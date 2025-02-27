import {
  boolean,
  integer,
  pgEnum,
  pgTable,
  serial,
  text,
  timestamp,
  uniqueIndex,
} from 'drizzle-orm/pg-core'

export const senderEnum = pgEnum('sender', ['user', 'assistant'])

export const conversations = pgTable('conversations', {
  id: serial('id').primaryKey(),
  userId: integer('user_id'),
  title: text('title').notNull(),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow(),
})

export const messages = pgTable('messages', {
  id: serial('id').primaryKey(),
  conversationId: integer('conversation_id')
    .notNull()
    .references(() => conversations.id),
  sender: senderEnum('sender').notNull(),
  isFinal: boolean('is_final').notNull().default(false),
  finalText: text('final_text').notNull().default(''),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow(),
})

export const messageChunks = pgTable(
  'message_chunks',
  {
    id: serial('id').primaryKey(),
    messageId: integer('message_id')
      .notNull()
      .references(() => messages.id),
    chunkIndex: integer('chunk_index').notNull(),
    content: text('content').notNull(),
    createdAt: timestamp('created_at', { withTimezone: true }).defaultNow(),
  },
  table => [
    uniqueIndex('idx_message_chunk').on(
      table.messageId,
      table.chunkIndex,
    ),
  ],
)

export const schema = {
  conversations,
  messages,
  messageChunks,
}
