import { betterAuth } from "better-auth";
import { nextCookies } from "better-auth/next-js";
import { getDb } from "@/db";

export const auth = betterAuth({
	database: getDb(),
	emailAndPassword: {
		enabled: true,
	},
	session: {
		cookieCache: {
			enabled: true,
			maxAge: 7 * 24 * 60 * 60,
			strategy: "jwe",
		},
	},
	account: {
		storeStateStrategy: "cookie",
		storeAccountCookie: true,
	},
	plugins: [nextCookies()],
});

export type Session = typeof auth.$Infer.Session;
