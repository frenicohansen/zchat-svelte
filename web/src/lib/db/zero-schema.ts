import type { ExpressionBuilder, Row } from '@rocicorp/zero'
import { definePermissions } from '@rocicorp/zero'
import * as drizzleSchema from 'db-schema'
import { createZeroSchema } from 'drizzle-zero'

export const schema = createZeroSchema(drizzleSchema, {
  version: 1,
  casing: 'snake_case',
  tables: {
    conversations: {
      id: true,
      userId: true,
      title: true,
      accessLevel: true,
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
    },
    user: false,
    session: false,
    account: false,
    verification: false,
    jwks: false,
  },
})

export type Schema = typeof schema
type TableName = keyof Schema['tables']
export type Conversation = Row<typeof schema.tables.conversations>
export type Message = Row<typeof schema.tables.messages>
export type MessageChunk = Row<typeof schema.tables.messageChunks>

interface AuthData {
  sub: string | null
}

export const permissions = definePermissions<AuthData, Schema>(schema, () => {
  const userIsLoggedIn = (
    authData: AuthData,
    { cmpLit }: ExpressionBuilder<Schema, TableName>,
  ) => cmpLit(authData.sub, 'IS NOT', null)

  const loggedInAndConversationOwner = (
    authData: AuthData,
    eb: ExpressionBuilder<Schema, 'conversations'>,
  ) => eb.and(
    userIsLoggedIn(authData, eb),
    eb.cmp('userId', '=', authData.sub ?? 'null'),
  )

  const canSeeConversation = (
    authData: AuthData,
    eb: ExpressionBuilder<Schema, 'conversations'>,
  ) => eb.or(
    loggedInAndConversationOwner(authData, eb),
    eb.cmp('accessLevel', 'public_read'),
    eb.cmp('accessLevel', 'public_write'),

  )

  const canSeeMessages = (
    authData: AuthData,
    eb: ExpressionBuilder<Schema, 'messages'>,
  ) => eb.exists('conversation', q => q.where(eb => canSeeConversation(authData, eb)))

  const canDeleteMessages = (
    authData: AuthData,
    eb: ExpressionBuilder<Schema, 'messages'>,
  ) => eb.exists('conversation', q => q.where(eb => loggedInAndConversationOwner(authData, eb)))

  const canSeeMessageChunks = (
    authData: AuthData,
    eb: ExpressionBuilder<Schema, 'messageChunks'>,
  ) => eb.exists('message', q => q.where(eb => canSeeMessages(authData, eb)))

  return {
    messages: {
      row: {
        select: [canSeeMessages],
        delete: [canDeleteMessages],
      },
    },
    messageChunks: {
      row: {
        select: [canSeeMessageChunks],
      },
    },
    conversations: {
      row: {
        select: [canSeeConversation],
        update: {
          preMutation: [loggedInAndConversationOwner],
          postMutation: [loggedInAndConversationOwner],
        },
        delete: [loggedInAndConversationOwner],
      },
    },
  }
})
