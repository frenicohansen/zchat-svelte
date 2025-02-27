DROP TABLE IF EXISTS "conversations", "messages", "message_chunks";

CREATE DATABASE zstart;
CREATE DATABASE zstart_cvr;
CREATE DATABASE zstart_cdb;

\c zstart;

CREATE TABLE conversations (
  id SERIAL PRIMARY KEY,
  user_id INTEGER,
  title TEXT,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

CREATE TABLE messages (
  id SERIAL PRIMARY KEY,
  conversation_id INTEGER NOT NULL,
  sender VARCHAR(20) NOT NULL CHECK (sender IN ('user', 'assistant')),
  is_final BOOLEAN DEFAULT FALSE,
  final_text TEXT DEFAULT '',
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW(),
  FOREIGN KEY (conversation_id) REFERENCES conversations(id)
);

CREATE TABLE message_chunks (
  id SERIAL PRIMARY KEY,
  message_id INTEGER NOT NULL,
  chunk_index INTEGER NOT NULL,
  content TEXT NOT NULL,
  created_at TIMESTAMP DEFAULT NOW(),
  FOREIGN KEY (message_id) REFERENCES messages(id)
);

CREATE UNIQUE INDEX idx_message_chunk ON message_chunks(message_id, chunk_index);