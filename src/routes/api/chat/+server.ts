import type { RequestHandler } from './$types'
import { env } from '$env/dynamic/private'
import { schema } from '$lib/db/schema'
import { createOpenRouter } from '@openrouter/ai-sdk-provider'
import { error, json } from '@sveltejs/kit'
import { streamText } from 'ai'
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
  const { conversationId: convIdFromClient, message: userMessage } = await request.json()

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
  // Append a final "Assistant:" prompt so the AI knows to respond.
  promptParts.push('Assistant:')
  const prompt = promptParts.join('\n')

  // Insert a new assistant message record to store the forthcoming response.
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

  let chunkIndex = 0
  const result = streamText({
    model: openrouter('google/gemini-2.0-flash-lite-preview-02-05:free'),
    prompt,
    onFinish: async ({ text }) => {
      // When finished, update the assistant message with the aggregated final text.
      try {
        await db
          .update(schema.messages)
          .set({ isFinal: true, finalText: text, updatedAt: sql`NOW()` })
          .where(eq(schema.messages.id, assistantMessageId))

        if (!conversationId) {
          return error(500, 'Database error updating conversation')
        }

        await db
          .update(schema.conversations)
          .set({ updatedAt: sql`NOW()` })
          .where(eq(schema.conversations.id, conversationId))
      }
      catch (err) {
        console.error('Error updating final assistant message:', err)
      }
    },
    onError({ error: streamError }) {
      console.error('Stream error:', streamError)
      error(500, `data: Error: ${streamError instanceof Error ? streamError.message : String(streamError)}\n`)
    },
  })

  const reader = result.textStream.getReader()

  while (true) {
    const { done, value } = await reader.read()
    const textChunk = value ?? ''
    db.insert(schema.messageChunks)
      .values({
        messageId: assistantMessageId,
        chunkIndex,
        content: textChunk,
      })
      .catch(err => console.error('Error inserting message chunk:', err))
    chunkIndex++

    if (done) {
      break
    }
  }

  return json({ messageId: assistantMessageId })
}) satisfies RequestHandler
