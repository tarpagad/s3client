"use server";

import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { decrypt, encrypt } from "@/lib/encryption";
import { type S3Credentials, s3CredentialsSchema } from "@/lib/types";

const COOKIE_NAME = "s3-credentials";
const ENCRYPTION_KEY =
	process.env.ENCRYPTION_KEY || "default-dev-key-do-not-use-in-prod";

export async function saveS3Credentials(data: S3Credentials) {
	const result = s3CredentialsSchema.safeParse(data);
	if (!result.success) {
		return { error: result.error.errors[0].message };
	}

	try {
		const jsonStr = JSON.stringify(result.data);
		const encrypted = await encrypt(jsonStr, ENCRYPTION_KEY);

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
		const decrypted = await decrypt(encrypted, ENCRYPTION_KEY);
		if (!decrypted) return null;
		return JSON.parse(decrypted) as S3Credentials;
	} catch (error) {
		console.error("Failed to get credentials:", error);
		return null;
	}
}
