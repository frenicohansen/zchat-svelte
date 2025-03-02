import { relations } from 'drizzle-orm'
import {
  boolean,
  index,
  integer,
  pgEnum,
  pgTable,
  serial,
  text,
  timestamp,
  uniqueIndex,
} from 'drizzle-orm/pg-core'
import { customAlphabet, urlAlphabet } from 'nanoid'

const nanoid = customAlphabet(urlAlphabet, 12)

export const senderEnum = pgEnum('sender', ['user', 'assistant'])
export const accessLevelEnum = pgEnum('access_level', ['private', 'public_read', 'public_write'])

export const user = pgTable('user', {
  id: text('id').primaryKey().$defaultFn(nanoid),
  name: text('name').notNull(),
  email: text('email').notNull().unique(),
  emailVerified: boolean('email_verified').notNull(),
  image: text('image'),
  createdAt: timestamp('created_at').notNull(),
  updatedAt: timestamp('updated_at').notNull(),
}, table => [
  index('idx_user_email').on(table.email),
])

export const session = pgTable('session', {
  id: text('id').primaryKey().$defaultFn(nanoid),
  expiresAt: timestamp('expires_at').notNull(),
  token: text('token').notNull().unique(),
  createdAt: timestamp('created_at').notNull(),
  updatedAt: timestamp('updated_at').notNull(),
  ipAddress: text('ip_address'),
  userAgent: text('user_agent'),
  userId: text('user_id').notNull().references(() => user.id, { onDelete: 'cascade' }),
}, table => [
  index('idx_session_user_id_token').on(table.userId, table.token),
])

export const account = pgTable('account', {
  id: text('id').primaryKey().$defaultFn(nanoid),
  accountId: text('account_id').notNull(),
  providerId: text('provider_id').notNull(),
  userId: text('user_id').notNull().references(() => user.id, { onDelete: 'cascade' }),
  accessToken: text('access_token'),
  refreshToken: text('refresh_token'),
  idToken: text('id_token'),
  accessTokenExpiresAt: timestamp('access_token_expires_at'),
  refreshTokenExpiresAt: timestamp('refresh_token_expires_at'),
  scope: text('scope'),
  password: text('password'),
  createdAt: timestamp('created_at').notNull(),
  updatedAt: timestamp('updated_at').notNull(),
}, table => [
  index('idx_account_user_id').on(table.userId),
])

export const verification = pgTable('verification', {
  id: text('id').primaryKey().$defaultFn(nanoid),
  identifier: text('identifier').notNull(),
  value: text('value').notNull(),
  expiresAt: timestamp('expires_at').notNull(),
  createdAt: timestamp('created_at'),
  updatedAt: timestamp('updated_at'),
}, table => [
  index('idx_verification_identifier').on(table.identifier),
])

export const jwks = pgTable('jwks', {
  id: text('id').primaryKey().$defaultFn(nanoid),
  publicKey: text('public_key').notNull(),
  privateKey: text('private_key').notNull(),
  createdAt: timestamp('created_at').notNull(),
})

export const conversations = pgTable('conversations', {
  id: text('id').primaryKey().$defaultFn(nanoid),
  userId: text('user_id').notNull().references(() => user.id),
  title: text('title').notNull(),
  accessLevel: accessLevelEnum('access_level').notNull().default('private'),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow(),
})

export const messages = pgTable('messages', {
  id: serial('id').primaryKey(),
  conversationId: text('conversation_id').notNull().references(() => conversations.id),
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

// Relations
export const accountRelations = relations(account, ({ one }) => ({
  user: one(user, {
    fields: [account.userId],
    references: [user.id],
  }),
}))

export const sessionRelations = relations(session, ({ one }) => ({
  user: one(user, {
    fields: [session.userId],
    references: [user.id],
  }),
}))

export const userRelations = relations(user, ({ many }) => ({
  sessions: many(session),
  accounts: many(account),
  conversations: many(conversations),
}))

export const conversationsRelations = relations(conversations, ({ one, many }) => ({
  messages: many(messages),
  user: one(user, {
    fields: [conversations.userId],
    references: [user.id],
  }),
}))

export const messagesRelations = relations(messages, ({ one, many }) => ({
  conversation: one(conversations, {
    fields: [messages.conversationId],
    references: [conversations.id],
  }),
  messageChunks: many(messageChunks),
}))

export const messageChunksRelations = relations(messageChunks, ({ one }) => ({
  message: one(messages, {
    fields: [messageChunks.messageId],
    references: [messages.id],
  }),
}))

export const schema = {
  user,
  session,
  account,
  verification,
  jwks,
  conversations,
  messages,
  messageChunks,
  accountRelations,
  sessionRelations,
  userRelations,
  conversationsRelations,
  messagesRelations,
  messageChunksRelations,
}
