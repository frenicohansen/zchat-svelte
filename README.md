# Demo
https://chat.z.kohans.de

![image](https://github.com/user-attachments/assets/0b1bdb82-a992-4f27-96ad-7ae99272c1fd)


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
