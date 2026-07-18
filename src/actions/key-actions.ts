"use server";

import { cookies } from "next/headers";
import { decrypt, encrypt } from "@/lib/encryption";
import {
	readConnections,
	resolveEncryptionKey,
	writeConnections,
} from "./credentials-actions";

const KEY_COOKIE_NAME = "s3-key";

export async function setEncryptionKey(
	key: string
): Promise<{ success?: boolean; error?: string }> {
	if (!key || key.length < 8) {
		return { error: "Encryption key must be at least 8 characters" };
	}

	const cookieStore = await cookies();
	cookieStore.set(KEY_COOKIE_NAME, key, {
		httpOnly: true,
		secure: process.env.NODE_ENV === "production",
		sameSite: "strict",
		maxAge: 60 * 60 * 24 * 365 * 10,
		path: "/",
	});

	return { success: true };
}

export async function getEncryptionKeyStatus(): Promise<{
	hasCookieKey: boolean;
	hasEnvKey: boolean;
}> {
	const cookieStore = await cookies();
	const keyCookie = cookieStore.get(KEY_COOKIE_NAME);
	return {
		hasCookieKey: !!keyCookie?.value,
		hasEnvKey: !!process.env.ENCRYPTION_KEY,
	};
}

export async function removeEncryptionKey(): Promise<{
	success?: boolean;
	error?: string;
}> {
	const cookieStore = await cookies();
	cookieStore.delete(KEY_COOKIE_NAME);
	return { success: true };
}

export async function changeEncryptionKey(
	currentKey: string,
	newKey: string
): Promise<{ success?: boolean; error?: string }> {
	if (!newKey || newKey.length < 8) {
		return { error: "New encryption key must be at least 8 characters" };
	}
	if (!currentKey) {
		return { error: "Current encryption key is required" };
	}

	const cookieStore = await cookies();
	const connectionsCookie = cookieStore.get("s3-connections");

	if (!connectionsCookie?.value) {
		const newCookieStore = await cookies();
		newCookieStore.set(KEY_COOKIE_NAME, newKey, {
			httpOnly: true,
			secure: process.env.NODE_ENV === "production",
			sameSite: "strict",
			maxAge: 60 * 60 * 24 * 365 * 10,
			path: "/",
		});
		return { success: true };
	}

	const connections = await readConnections(currentKey);

	if (!connections || connections.length === 0) {
		const parsed = await decrypt(connectionsCookie.value, currentKey);
		if (parsed === null) {
			return {
				error:
					"Failed to decrypt connections with the current key. Please verify it is correct.",
			};
		}
	}

	const migrated: StoredConnection[] = [];
	for (const conn of connections) {
		const decryptedInner = await decrypt(conn.encryptedCredentials, currentKey);
		if (decryptedInner) {
			const reEncryptedInner = await encrypt(decryptedInner, newKey);
			migrated.push({ ...conn, encryptedCredentials: reEncryptedInner });
		} else {
			migrated.push(conn);
		}
	}

	interface StoredConnection {
		id: string;
		name: string;
		type: "s3" | "r2";
		encryptedCredentials: string;
		region: string;
		endpoint: string | null;
		bucket: string | null;
		publicUrl: string | null;
	}

	await writeConnections(migrated as StoredConnection[], newKey);

	const updatedCookieStore = await cookies();
	updatedCookieStore.set(KEY_COOKIE_NAME, newKey, {
		httpOnly: true,
		secure: process.env.NODE_ENV === "production",
		sameSite: "strict",
		maxAge: 60 * 60 * 24 * 365 * 10,
		path: "/",
	});

	return { success: true };
}
