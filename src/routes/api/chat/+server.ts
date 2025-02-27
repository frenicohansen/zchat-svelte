import type { RequestHandler } from './$types'
import { env } from '$env/dynamic/private'
import { schema } from '$lib/db/schema'
import { createOpenRouter } from '@openrouter/ai-sdk-provider'
import { error, json } from '@sveltejs/kit'
import { generateText, streamText } from 'ai'
import { eq, sql } from 'drizzle-orm'
import { drizzle } from 'drizzle-orm/node-postgres'
import pg from 'pg'

const { Pool } = pg
const pool = new Pool({
  connectionString: env.DATABASE_URL,
})

const db = drizzle({ client: pool, schema })

const openrouter = createOpenRouter({
  apiKey: env.OPENROUTER_API_KEY ?? '',
})

export const POST = (async ({ request }) => {
  const {
    conversationId: convIdFromClient,
    message: userMessage,
  } = await request.json()

  if (!userMessage) {
    return error(400, 'Missing \'message\' in request body')
  }

  let conversationId: number | undefined
  try {
    await db.transaction(async (tx) => {
      if (convIdFromClient) {
        conversationId = convIdFromClient
      }
      else {
        const convRes = await tx
          .insert(schema.conversations)
          .values({ userId: null, title: 'Chat Session' })
          .returning({ id: schema.conversations.id })
        conversationId = convRes[0].id
      }

      if (!conversationId) {
        return error(500, 'Database error creating conversation')
      }

      await tx.insert(schema.messages).values({
        conversationId,
        sender: 'user',
        isFinal: true,
        finalText: userMessage,
      })
    })
  }
  catch (err) {
    console.error('Error creating conversation/message:', err)
    return error(500, 'Database error during initialization.')
  }

  if (!conversationId) {
    return error(500, 'Database error creating conversation')
  }

  let allMessages
  try {
    allMessages = await db
      .select()
      .from(schema.messages)
      .where(eq(schema.messages.conversationId, conversationId))
      .orderBy(schema.messages.createdAt)
  }
  catch (err) {
    console.error('Error retrieving conversation messages:', err)
    return error(500, 'Database error retrieving messages.')
  }

  // Build the prompt by merging all conversation messages.
  // Format: "User: <text>" for user messages and "Assistant: <text>" for assistant messages.
  const promptParts = allMessages.map(msg =>
    msg.sender === 'user'
      ? `User: ${msg.finalText}`
      : `Assistant: ${msg.finalText}`,
  )
  promptParts.push('Assistant:')
  const prompt = promptParts.join('\n')

  let assistantMessageId: number
  try {
    const result = await db
      .insert(schema.messages)
      .values({
        conversationId,
        sender: 'assistant',
        isFinal: false,
        finalText: '',
      })
      .returning({ id: schema.messages.id })
    assistantMessageId = result[0].id
  }
  catch (err) {
    console.error('Error inserting assistant message:', err)
    return error(500, 'Database error inserting assistant message.')
  }

  const modelName = 'google/gemini-2.0-flash-lite-preview-02-05:free'
  const result = streamText({
    model: openrouter(modelName),
    prompt,
    onFinish: async ({ text }) => {
      try {
        await Promise.all([
          db
            .update(schema.messages)
            .set({ isFinal: true, finalText: text, updatedAt: sql`NOW()` })
            .where(eq(schema.messages.id, assistantMessageId)),

          conversationId
            ? (async () => {
                try {
                  const titlePrompt = `Generate a short, descriptive title (max. 3 words and plain text) for the following conversation:\n\n${prompt}`
                  const titleResult = await generateText({
                    model: openrouter(modelName),
                    prompt: titlePrompt,
                  })
                  const generatedTitle = titleResult.text.trim()

                  await db
                    .update(schema.conversations)
                    .set({ title: generatedTitle, updatedAt: sql`NOW()` })
                    .where(eq(schema.conversations.id, conversationId))
                }
                catch (err) {
                  console.error('Error generating/updating conversation title:', err)
                }
              })()
            : Promise.resolve(),
        ])
      }
      catch (err) {
        console.error('Error updating final assistant message:', err)
      }
    },
    onError({ error: streamError }) {
      console.error('Stream error:', streamError)
      error(500, `data: Error: ${streamError instanceof Error ? streamError.message : String(streamError)}\n`)
    },
  });

  (async () => {
    let chunkIndex = 0
    const reader = result.textStream.getReader()
    while (true) {
      const { done, value } = await reader.read()
      const textChunk = value ?? ''
      await db.insert(schema.messageChunks)
        .values({
          messageId: assistantMessageId,
          chunkIndex,
          content: textChunk,
        })
        .catch(err => console.error('Error inserting message chunk:', err))
      chunkIndex++
      if (done) {
        await db
          .delete(schema.messageChunks)
          .where(eq(schema.messageChunks.messageId, assistantMessageId))
        break
      }
    }
  })().catch(err => console.error('Stream processing error:', err))

  return json({ conversationId, messageId: assistantMessageId })
}) satisfies RequestHandler
