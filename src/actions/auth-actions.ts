"use server";

import { cookies } from "next/headers";
import { decrypt, encrypt } from "@/lib/encryption";
import { type S3Credentials, s3CredentialsSchema } from "@/lib/types";

const COOKIE_NAME = "s3-credentials";

function getEncryptionKey(): string {
	const key = process.env.ENCRYPTION_KEY;

	if (!key) {
		if (process.env.NODE_ENV === "production") {
			throw new Error(
				"ENCRYPTION_KEY environment variable is required in production. Generate a secure key and set it in your deployment environment."
			);
		}

		// Dev-only fallback — never use in production
		console.warn(
			"⚠️  ENCRYPTION_KEY not set. Using insecure default. Set ENCRYPTION_KEY in .env.local for secure development."
		);
		return "default-dev-key-do-not-use-in-prod";
	}

	return key;
}

export async function saveS3Credentials(data: S3Credentials) {
	const result = s3CredentialsSchema.safeParse(data);
	if (!result.success) {
		return { error: result.error.issues[0].message };
	}

	try {
		const jsonStr = JSON.stringify(result.data);
		const encrypted = await encrypt(jsonStr, getEncryptionKey());

		const cookieStore = await cookies();
		cookieStore.set(COOKIE_NAME, encrypted, {
			httpOnly: true,
			secure: process.env.NODE_ENV === "production",
			sameSite: "strict",
			maxAge: 60 * 60 * 24 * 30, // 30 days
			path: "/",
		});

		return { success: true };
	} catch (error) {
		console.error("Failed to save credentials:", error);
		return { error: "Failed to save credentials" };
	}
}

export async function removeS3Credentials() {
	const cookieStore = await cookies();
	cookieStore.delete(COOKIE_NAME);
	return { success: true };
}

export async function getS3Credentials(): Promise<S3Credentials | null> {
	const cookieStore = await cookies();
	const encrypted = cookieStore.get(COOKIE_NAME)?.value;

	if (!encrypted) return null;

	try {
		const decrypted = await decrypt(encrypted, getEncryptionKey());
		if (!decrypted) return null;
		return JSON.parse(decrypted) as S3Credentials;
	} catch (error) {
		console.error("Failed to get credentials:", error);
		return null;
	}
}
