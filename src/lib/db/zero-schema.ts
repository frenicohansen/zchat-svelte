import type { Row } from '@rocicorp/zero'
import { ANYONE_CAN, definePermissions } from '@rocicorp/zero'
import { createZeroSchema } from 'drizzle-zero'
import * as drizzleSchema from './schema'

export const schema = createZeroSchema(drizzleSchema, {
  version: 1,
  casing: 'snake_case',
  tables: {
    conversations: {
      id: true,
      userId: true,
      title: true,
      createdAt: true,
      updatedAt: true,
    },
    messages: {
      id: true,
      conversationId: true,
      sender: true,
      isFinal: true,
      finalText: true,
      createdAt: true,
      updatedAt: true,
    },
    messageChunks: {
      id: true,
      messageId: true,
      chunkIndex: true,
      content: true,
      createdAt: true,
      updatedAt: true,
    },
  },
})

export type Schema = typeof schema
export type Conversations = Row<typeof schema.tables.conversations>
export type Messages = Row<typeof schema.tables.messages>
export type MessageChunks = Row<typeof schema.tables.messageChunks>

interface AuthData {
  sub: string | null
}

export const permissions = definePermissions<AuthData, Schema>(schema, () => {
  return {
    messages: {
      row: {
        select: ANYONE_CAN,
        delete: ANYONE_CAN,
      },
    },
    messageChunks: {
      row: {
        select: ANYONE_CAN,
      },
    },
    conversations: {
      row: {
        select: ANYONE_CAN,
        delete: ANYONE_CAN,
      },
    },
  }
})
