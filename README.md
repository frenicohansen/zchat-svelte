# Demo
https://chat.z.kohans.de

# Notes
Every time a user sends a prompt in a conversation, all past messages are automatically included to provide context for the AI. As a result:
- Token usage increases with each message in the conversation
- Response times may become longer as the AI processes larger context
- The AI maintains conversation coherency through accumulated context

# Development Guide
## Prerequisites
- Docker installed
- Bun installed

## Getting Started

1. **Environment Setup**
  - Clone the repository
  - Copy `.env.local.example` to `.env`
  - Configure environment variables in `.env`

2. **Install Dependencies**
```sh
bun install
```

3. **Database Setup**
```sh
bun run dev:db-up
```

4. **Run Zero**
```sh
bun run dev:zero
```

5. **Start Development Servers**
```sh
bun run dev
```

## Important: Environment Configuration

Create symbolic links for the `.env` file in both `api` and `web` directories:

```sh
ln -s .env ./api/.env
ln -s .env ./web/.env
```
