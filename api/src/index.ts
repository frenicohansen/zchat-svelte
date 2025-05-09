import { Hono } from "hono";
import { cors } from "hono/cors";
import { auth } from "./lib/auth";
import { rateLimiter } from "hono-rate-limiter";
import api from "./api";

const app = new Hono<{
	Variables: {
		user: typeof auth.$Infer.Session.user | null;
		session: typeof auth.$Infer.Session.session | null;
	};
}>();

app.use(
  rateLimiter({
    windowMs: 5 * 60 * 1000, // 5 minutes
    limit: 100, // Limit each IP to 100 requests per `window` (here, per 5 minutes).
    keyGenerator: async (c) =>  {
			const session = await auth.api.getSession({ headers: c.req.raw.headers });
			return session?.session.ipAddress ?? c.req.header("x-forwarded-for") ?? ""
		}
  })
);

app.use("*", async (c, next) => {
	const session = await auth.api.getSession({ headers: c.req.raw.headers });

	if (!session) {
		c.set("user", null);
		c.set("session", null);
		return next();
	}

	c.set("user", session.user);
	c.set("session", session.session);

	return next();
});

app.use(
	"*",
	cors({
		origin: process.env.PUBLIC_FRONTEND_URL ?? "",
		allowHeaders: ["Content-Type", "Authorization"],
		allowMethods: ["POST", "GET", "OPTIONS"],
		exposeHeaders: ["Content-Length"],
		maxAge: 600,
		credentials: true,
	}),
);

app.on(["POST", "GET"], "/api/auth/*", (c) => {
	return auth.handler(c.req.raw);
});

app.get("/", (c) => c.text("Hey there!"));

app.get("/health", (c) => {
	return c.json({
		status: "ok",
		uptime: process.uptime(),
		timestamp: new Date().toISOString(),
	});
});

app.route("/api", api);

export default app;
