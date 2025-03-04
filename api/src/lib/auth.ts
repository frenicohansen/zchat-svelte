import { betterAuth } from "better-auth";
import { drizzleAdapter } from "better-auth/adapters/drizzle";
import { jwt } from "better-auth/plugins";
import { db } from "./db";

export const auth = betterAuth({
	database: drizzleAdapter(db, {
		provider: "pg",
	}),
	trustedOrigins: [process.env.PUBLIC_FRONTEND_URL ?? "http://localhost:3000"],
	plugins: [jwt()],
	socialProviders: {
		github: {
			clientId: process.env.GITHUB_CLIENT_ID ?? "",
			clientSecret: process.env.GITHUB_CLIENT_SECRET ?? "",
		},
	},
	session: {
		cookieCache: {
			enabled: true,
			maxAge: 7 * 60 * 60,
		},
	},
	advanced: {
		cookiePrefix: "zchat",
		crossSubDomainCookies: {
			enabled: true,
			domain: new URL(process.env.PUBLIC_FRONTEND_URL ?? "http://localhost:3000").hostname,
		},
    defaultCookieAttributes: {
        secure: true,
        httpOnly: true,
        sameSite: "none",  // Allows CORS-based cookie sharing across subdomains
        partitioned: true, // New browser standards will mandate this for foreign cookies
    },
	},
});
