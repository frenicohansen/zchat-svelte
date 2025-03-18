import { Hono } from "hono";
import { createOpenRouter } from "@openrouter/ai-sdk-provider";
import { generateText, streamText } from "ai";
import { eq, sql } from "drizzle-orm";
import { schema } from "db-schema";
import { db } from "./lib/db";
import { systemPrompt } from "./lib/ai";
import type { auth } from "./lib/auth";
import { HTTPException } from "hono/http-exception";

class PermissionError extends HTTPException {
	constructor(message: string) {
		super(403, { message });
		this.name = "PermissionError";
	}
}

class NotFoundError extends HTTPException {
	constructor(message: string) {
		super(404, { message });
		this.name = "NotFoundError";
	}
}

class DatabaseError extends HTTPException {
	constructor(message: string, cause?: unknown) {
		super(500, { message });
		this.name = "DatabaseError";
		this.cause = cause;
	}
}

const app = new Hono<{
	Variables: {
		user: typeof auth.$Infer.Session.user | null;
		session: typeof auth.$Infer.Session.session | null;
	};
}>();

app.onError((err, c) => {
	if (err instanceof HTTPException) {
		return err.getResponse();
	}

	return c.json({ error: "An unexpected error occurred" }, 500);
});

const activeStreams = new Map<number, AbortController>();

app.post("/chat", async (c) => {
	const user = c.get("user");
	if (!user) {
		throw new HTTPException(401, { message: "Unauthorized" });
	}

	const { conversationId: convIdFromClient, message: userMessage } =
		await c.req.json();
	if (!userMessage) {
		throw new HTTPException(400, {
			message: "Missing 'message' in request body",
		});
	}

	// Step 1: Create or verify conversation and add user message
	const conversationId = await createConversationAndUserMessage(
		user.id,
		convIdFromClient,
		userMessage,
	);

	// Step 2: Get conversation history
	const allMessages = await getConversationMessages(conversationId);

	// Step 3: Format prompt
	const promptParts = allMessages.map((msg) =>
		msg.sender === "user"
			? `User: ${msg.finalText}`
			: `Assistant: ${msg.finalText}`,
	);
	promptParts.push("Assistant:");
	const prompt = promptParts.join("\n");

	// Step 4: Create assistant message placeholder
	const assistantMessageId = await createAssistantMessage(conversationId);

	// Step 5: Set up AI model
	const modelName = process.env.AI_MODEL_NAME;
	if (!modelName) {
		throw new HTTPException(500, {
			message: "Server configuration error: Missing AI model name",
		});
	}

	const openrouter = createOpenRouter({
		apiKey: process.env.OPENROUTER_API_KEY ?? "",
	});

	// Step 6: Set up stream and abort controller
	const abortController = new AbortController();
	activeStreams.set(assistantMessageId, abortController);

	// Step 7: Start AI text streaming
	const result = streamText({
		model: openrouter(modelName),
		system: systemPrompt,
		prompt,
		abortSignal: abortController.signal,
		onFinish: async () => {
			if (!convIdFromClient) {
				await generateConversationTitle(conversationId, prompt, modelName);
			}
		},
		onError({ error: streamError }) {
			console.error("Stream error:", streamError);
			activeStreams.delete(assistantMessageId);
		},
	});

	// Step 8: Process AI text stream
	processTextStream(result.textStream, conversationId, assistantMessageId);

	// Step 9: Return immediate response to client
	return c.json({ conversationId, messageId: assistantMessageId });
});

app.post("/stop", async (c) => {
	const user = c.get("user");
	if (!user) {
		throw new HTTPException(401, { message: "Unauthorized" });
	}

	const { messageId } = await c.req.json();
	if (!messageId) {
		throw new HTTPException(400, {
			message: "Missing 'messageId' in request body",
		});
	}

	try {
		const message = await db.query.messages.findFirst({
			where: (messages, { eq }) => eq(messages.id, messageId),
			with: {
				conversation: {
					columns: {
						userId: true,
						accessLevel: true,
					},
				},
			},
		});

		if (!message) {
			throw new HTTPException(404, { message: "Message not found" });
		}

		if (
			message.conversation.userId !== user.id &&
			message.conversation.accessLevel !== "public_write"
		) {
			throw new HTTPException(403, {
				message: "User does not have permission to stop this message",
			});
		}

		const controller = activeStreams.get(messageId);
		if (controller) {
			controller.abort();
			activeStreams.delete(messageId);
			return c.json({ success: true, messageId });
		}

		return c.json({
			success: false,
			message: "No active stream found for this message",
		});
	} catch (err) {
		if (err instanceof HTTPException) {
			throw err;
		}
		throw new HTTPException(500, {
			message: "An error occurred while stopping the stream",
			cause: err,
		});
	}
});

async function createConversationAndUserMessage(
	userId: string,
	convIdFromClient: string | undefined,
	userMessage: string,
): Promise<string> {
	let conversationId: string | undefined;

	try {
		await db.transaction(async (tx) => {
			if (convIdFromClient) {
				const conversation = await tx.query.conversations.findFirst({
					columns: { id: true, userId: true, accessLevel: true },
					where: (conversation, { eq }) =>
						eq(conversation.id, convIdFromClient),
				});

				if (!conversation) {
					throw new NotFoundError("Conversation not found");
				}

				if (
					conversation.userId !== userId &&
					conversation.accessLevel !== "public_write"
				) {
					throw new PermissionError(
						"User does not have permission to write to this conversation",
					);
				}

				conversationId = convIdFromClient;
			} else {
				const convRes = await tx
					.insert(schema.conversations)
					.values({ userId, title: "New Chat" })
					.returning({ id: schema.conversations.id });
				conversationId = convRes[0].id;
			}

			if (!conversationId) {
				throw new DatabaseError("Database error creating conversation");
			}

			await tx.insert(schema.messages).values({
				conversationId,
				sender: "user",
				isFinal: true,
				finalText: userMessage,
			});
		});

		return conversationId as string;
	} catch (err) {
		// Propagate NotFoundError and PermissionError
		if (err instanceof NotFoundError || err instanceof PermissionError) {
			throw err;
		}

		// Wrap other errors
		throw new DatabaseError("Failed to create conversation or message", err);
	}
}

async function getConversationMessages(conversationId: string) {
	try {
		return db.query.messages.findMany({
			where: (message, { eq }) => eq(message.conversationId, conversationId),
			orderBy: (message, { asc }) => [asc(message.createdAt)],
		});
	} catch (err) {
		throw new DatabaseError("Failed to retrieve conversation messages", err);
	}
}

async function createAssistantMessage(conversationId: string) {
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

		return result[0].id;
	} catch (err) {
		throw new DatabaseError("Failed to create assistant message", err);
	}
}

async function generateConversationTitle(
	conversationId: string,
	prompt: string,
	modelName: string,
) {
	try {
		const openrouter = createOpenRouter({
			apiKey: process.env.OPENROUTER_API_KEY ?? "",
		});

		const titlePrompt = `Generate a short, descriptive title (max. 3 words and plain text) for the following conversation:\n\n${prompt}`;
		const titleResult = await generateText({
			model: openrouter(modelName),
			prompt: titlePrompt,
		});
		const generatedTitle = titleResult.text.trim().replace(/^"|"$/g, "");

		await db
			.update(schema.conversations)
			.set({ title: generatedTitle, updatedAt: sql`NOW()` })
			.where(eq(schema.conversations.id, conversationId));
	} catch (err) {
		// Non-critical error, just log but don't throw
		console.error("Error generating/updating conversation title:", err);
	}
}

async function processTextStream(
	textStream: ReadableStream<string>,
	conversationId: string,
	messageId: number,
) {
	let chunkIndex = 0;
	let finalText = "";

	try {
		for await (const textPart of textStream) {
			await insertMessageChunk(messageId, chunkIndex, textPart);
			finalText += textPart;
			chunkIndex++;
		}

		activeStreams.delete(messageId);
		await finalizeMessages(conversationId, messageId, finalText);
	} catch (err) {
		if (
			err instanceof Error &&
			(err.name === "AbortError" || err.name === "TimeoutError")
		) {
			await finalizeMessages(conversationId, messageId, finalText);
		} else {
			console.error("Unhandled streaming error:", err);
		}

		activeStreams.delete(messageId);
	}
}

async function insertMessageChunk(
	messageId: number,
	chunkIndex: number,
	content: string,
) {
	try {
		await db.insert(schema.messageChunks).values({
			messageId,
			chunkIndex,
			content,
		});
	} catch (err) {
		console.error("Error inserting message chunk:", err);
	}
}

async function finalizeMessages(
	conversationId: string,
	messageId: number,
	text?: string,
) {
	try {
		await db.transaction(async (tx) => {
			let finalText: string;

			if (text) {
				finalText = text;
			} else {
				const chunks = await tx.query.messageChunks.findMany({
					where: (chunk, { eq }) => eq(chunk.messageId, messageId),
					orderBy: (chunk, { asc }) => [asc(chunk.chunkIndex)],
				});

				finalText = chunks.map((chunk) => chunk.content).join("");
			}

			await tx
				.update(schema.messages)
				.set({ isFinal: true, finalText, updatedAt: sql`NOW()` })
				.where(eq(schema.messages.id, messageId));

			await tx
				.update(schema.conversations)
				.set({ updatedAt: sql`NOW()` })
				.where(eq(schema.conversations.id, conversationId));

			await tx
				.delete(schema.messageChunks)
				.where(eq(schema.messageChunks.messageId, messageId));
		});
	} catch (err) {
		console.error("Failed to finalize message", err);
	}
}

export default app;
