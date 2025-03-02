import { betterAuth } from 'better-auth'
import { drizzleAdapter } from 'better-auth/adapters/drizzle'
import { jwt } from 'better-auth/plugins'
import { db } from './db'

export const auth = betterAuth({
  secret: process.env.AUTH_SECRET,
  database: drizzleAdapter(db, {
    provider: 'pg',
  }),
  trustedOrigins: [process.env.PUBLIC_FRONTEND_URL ?? 'http://localhost:3000'],
  plugins: [jwt()],
  socialProviders: {
    github: {
      clientId: process.env.GITHUB_CLIENT_ID ?? '',
      clientSecret: process.env.GITHUB_CLIENT_SECRET ?? '',
    },
  },
  session: {
    cookieCache: {
      enabled: true,
      maxAge: 30 * 60, // Cache duration in seconds
    },
  },
})
