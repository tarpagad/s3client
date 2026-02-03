import { betterAuth } from "better-auth";

export const auth = betterAuth({
	// Disable database requirement by using stateless cookie-based sessions
	session: {
		cookieCache: {
			enabled: true,
			maxAge: 7 * 24 * 60 * 60, // 7 days
			strategy: "jwe",
			refreshCache: true,
		},
	},
	account: {
		storeStateStrategy: "cookie",
		storeAccountCookie: true, // Crucial for database-less OAuth flows
	},
});
