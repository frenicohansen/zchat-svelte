import { Hono } from "hono";
import { createOpenRouter } from "@openrouter/ai-sdk-provider";
import { generateText, streamText } from "ai";
import { eq, sql } from "drizzle-orm";
import { schema } from "db-schema";
import { db } from "./lib/db";
import type { auth } from "./lib/auth";
import { TypeValidationError } from "ai";

const app = new Hono<{
	Variables: {
		user: typeof auth.$Infer.Session.user | null;
		session: typeof auth.$Infer.Session.session | null;
	};
}>();

app.post("/", async (c) => {
	const user = c.get("user");

	if (!user) return c.text("Unauthorized", 401);

	const { conversationId: convIdFromClient, message: userMessage } =
		await c.req.json();

	if (!userMessage) {
		return c.text("Missing 'message' in request body", 400);
	}

	let conversationId: string | undefined;
	try {
		await db.transaction(async (tx) => {
			if (convIdFromClient) {
				const conversation = await db.query.conversations.findFirst({
					columns: { id: true, userId: true, accessLevel: true },
					where: (conversation, { eq }) =>
						eq(conversation.id, convIdFromClient),
				});

				if (!conversation) {
					return c.text("Conversation not found", 404);
				}

				if (
					conversation.userId !== user.id &&
					conversation.accessLevel !== "public_write"
				) {
					return c.text(
						"User does not have permission to write to this conversation",
						403,
					);
				}

				conversationId = convIdFromClient;
			} else {
				const convRes = await tx
					.insert(schema.conversations)
					.values({ userId: user.id, title: "New Chat" })
					.returning({ id: schema.conversations.id });
				conversationId = convRes[0].id;
			}

			if (!conversationId) {
				return c.text("Database error creating conversation", 500);
			}

			await tx.insert(schema.messages).values({
				conversationId,
				sender: "user",
				isFinal: true,
				finalText: userMessage,
			});
		});
	} catch (err) {
		console.error("Error creating conversation/message:", err);
		return c.text("Database error during initialization.", 500);
	}

	if (!conversationId) {
		return c.text("Database error creating conversation", 500);
	}

	let allMessages: (typeof schema.messages.$inferSelect)[];
	try {
		allMessages = await db
			.select()
			.from(schema.messages)
			.where(eq(schema.messages.conversationId, conversationId))
			.orderBy(schema.messages.createdAt);
	} catch (err) {
		console.error("Error retrieving conversation messages:", err);
		return c.text("Database error retrieving messages.", 500);
	}

	// Build the prompt by merging all conversation messages.
	// Format: "User: <text>" for user messages and "Assistant: <text>" for assistant messages.
	const promptParts = allMessages.map((msg) =>
		msg.sender === "user"
			? `User: ${msg.finalText}`
			: `Assistant: ${msg.finalText}`,
	);
	promptParts.push("Assistant:");
	const prompt = promptParts.join("\n");

	let assistantMessageId: number;
	try {
		const result = await db
			.insert(schema.messages)
			.values({
				conversationId,
				sender: "assistant",
				isFinal: false,
				finalText: "",
			})
			.returning({ id: schema.messages.id });
		assistantMessageId = result[0].id;
	} catch (err) {
		console.error("Error inserting assistant message:", err);
		return c.text("Database error inserting assistant message.", 500);
	}

	const modelName = process.env.AI_MODEL_NAME;
	if (!modelName) {
		throw new Error("Missing AI_MODEL_NAME in environment variables");
	}

	const openrouter = createOpenRouter({
		apiKey: process.env.OPENROUTER_API_KEY ?? "",
	});

	const result = streamText({
		model: openrouter(modelName),
		prompt,
		onFinish: async ({ text }) => {
			try {
				await db
					.update(schema.messages)
					.set({ isFinal: true, finalText: text, updatedAt: sql`NOW()` })
					.where(eq(schema.messages.id, assistantMessageId));

				if (!conversationId) return;

				await db
					.update(schema.conversations)
					.set({ updatedAt: sql`NOW()` })
					.where(eq(schema.conversations.id, conversationId));

				// Only update the title when the use doesn't provide a conversation ID (i.e. when creating a new conversation)
				if (convIdFromClient) return;

				try {
					const titlePrompt = `Generate a short, descriptive title (max. 3 words and plain text) for the following conversation:\n\n${prompt}`;
					const titleResult = await generateText({
						model: openrouter(modelName),
						prompt: titlePrompt,
					});
					const generatedTitle = titleResult.text.trim().replace(/^"|"$/g, '');

					await db
						.update(schema.conversations)
						.set({ title: generatedTitle, updatedAt: sql`NOW()` })
						.where(eq(schema.conversations.id, conversationId));
				} catch (err) {
					console.error("Error generating/updating conversation title:", err);
				}
			} catch (err) {
				console.error("Error updating final assistant message:", err);
			}
		},
		onError({ error: streamError }) {
			console.error("Stream error:", streamError);
			c.json(
				{ error: "Message generation failed. Please try again later." },
				500,
			);
		},
	});

	(async () => {
		try {
			const reader = result.textStream.getReader();
			if (!reader) return;
			let chunkIndex = 0;
			while (true) {
				const { done, value } = await reader.read();
				const textChunk = value ?? "";
				await db
					.insert(schema.messageChunks)
					.values({
						messageId: assistantMessageId,
						chunkIndex,
						content: textChunk,
					})
					.catch((err) => console.error("Error inserting message chunk:", err));
	
				chunkIndex++;
	
				if (done) {
					await db
						.delete(schema.messageChunks)
						.where(eq(schema.messageChunks.messageId, assistantMessageId));
					break;
				}
			}
		} catch (error) {
			if (TypeValidationError.isInstance(error)) {
				console.error("Type validation error:", error.message);
				console.error("Error details:", error.cause);
			}
		}
	})().catch((err) => console.error("Stream processing error:", err));

	return c.json({ conversationId, messageId: assistantMessageId });
});

export default app;
