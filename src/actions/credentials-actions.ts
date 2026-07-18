"use server";

import { cookies } from "next/headers";
import { revalidatePath } from "next/cache";
import { decrypt, encrypt } from "@/lib/encryption";
import type {
	ConnectionInfo,
	CreateConnectionInput,
	DecryptedConnection,
	UpdateConnectionInput,
} from "@/lib/types";
import {
	createConnectionSchema,
	updateConnectionSchema,
} from "@/lib/types";

const COOKIE_NAME = "s3-connections";
const KEY_COOKIE_NAME = "s3-key";

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

export async function resolveEncryptionKey(overrideKey?: string): Promise<string> {
	if (overrideKey) return overrideKey;

	const cookieStore = await cookies();
	const keyCookie = cookieStore.get(KEY_COOKIE_NAME);
	if (keyCookie?.value) return keyCookie.value;

	const envKey = process.env.ENCRYPTION_KEY;
	if (envKey) return envKey;

	if (process.env.NODE_ENV !== "production") {
		return "default-dev-key-do-not-use-in-prod";
	}

	throw new Error(
		"No encryption key configured. Set the ENCRYPTION_KEY environment variable or set an encryption key in Settings."
	);
}

function generateId(): string {
	return crypto.randomUUID();
}

export async function readConnections(encryptionKey?: string): Promise<StoredConnection[]> {
	const cookieStore = await cookies();
	const cookie = cookieStore.get(COOKIE_NAME);
	if (!cookie?.value) return [];

	const key = await resolveEncryptionKey(encryptionKey);
	try {
		const decrypted = await decrypt(cookie.value, key);
		if (!decrypted) return [];
		return JSON.parse(decrypted) as StoredConnection[];
	} catch {
		return [];
	}
}

export async function writeConnections(connections: StoredConnection[], encryptionKey?: string): Promise<void> {
	const cookieStore = await cookies();
	const key = await resolveEncryptionKey(encryptionKey);
	const jsonStr = JSON.stringify(connections);
	const encrypted = await encrypt(jsonStr, key);

	cookieStore.set(COOKIE_NAME, encrypted, {
		httpOnly: true,
		secure: process.env.NODE_ENV === "production",
		sameSite: "strict",
		maxAge: 60 * 60 * 24 * 30,
		path: "/",
	});
}

function toConnectionInfo(c: StoredConnection): ConnectionInfo {
	return {
		id: c.id,
		name: c.name,
		type: c.type,
		region: c.region,
		endpoint: c.endpoint,
		bucket: c.bucket,
		publicUrl: c.publicUrl,
	};
}

export async function addConnection(
	data: CreateConnectionInput
): Promise<{ success?: boolean; error?: string; id?: string }> {
	const result = createConnectionSchema.safeParse(data);
	if (!result.success) {
		return { error: result.error.issues[0].message };
	}

	const key = await resolveEncryptionKey();
	const credsJson = JSON.stringify({
		accessKeyId: result.data.accessKeyId,
		secretAccessKey: result.data.secretAccessKey,
	});
	const encryptedCredentials = await encrypt(credsJson, key);

	const stored: StoredConnection = {
		id: generateId(),
		name: result.data.name,
		type: result.data.type,
		encryptedCredentials,
		region: result.data.region,
		endpoint: result.data.endpoint || null,
		bucket: result.data.bucket || null,
		publicUrl: result.data.publicUrl || null,
	};

	const connections = await readConnections();
	connections.push(stored);
	await writeConnections(connections);

	revalidatePath("/dashboard");
	return { success: true, id: stored.id };
}

export async function listConnections(): Promise<ConnectionInfo[]> {
	const connections = await readConnections();
	return connections.map(toConnectionInfo);
}

export async function getConnection(
	id: string
): Promise<ConnectionInfo | null> {
	const connections = await readConnections();
	const found = connections.find((c) => c.id === id);
	return found ? toConnectionInfo(found) : null;
}

export async function getDecryptedConnection(
	id: string
): Promise<DecryptedConnection | null> {
	const connections = await readConnections();
	const stored = connections.find((c) => c.id === id);
	if (!stored) return null;

	const key = await resolveEncryptionKey();
	const decrypted = await decrypt(
		stored.encryptedCredentials,
		key
	);
	if (!decrypted) return null;

	const creds = JSON.parse(decrypted) as {
		accessKeyId: string;
		secretAccessKey: string;
	};

	return {
		id: stored.id,
		name: stored.name,
		type: stored.type,
		region: stored.region,
		endpoint: stored.endpoint,
		bucket: stored.bucket,
		publicUrl: stored.publicUrl,
		accessKeyId: creds.accessKeyId,
		secretAccessKey: creds.secretAccessKey,
	};
}

export async function updateConnection(
	id: string,
	data: UpdateConnectionInput
): Promise<{ success?: boolean; error?: string }> {
	const result = updateConnectionSchema.safeParse(data);
	if (!result.success) {
		return { error: result.error.issues[0].message };
	}

	const connections = await readConnections();
	const index = connections.findIndex((c) => c.id === id);
	if (index === -1) {
		return { error: "Connection not found" };
	}

	const existing = connections[index];
	const key = await resolveEncryptionKey();

	const hasNewCredentials =
		result.data.accessKeyId && result.data.secretAccessKey;

	let encryptedCredentials = existing.encryptedCredentials;
	if (hasNewCredentials) {
		const credsJson = JSON.stringify({
			accessKeyId: result.data.accessKeyId,
			secretAccessKey: result.data.secretAccessKey,
		});
		encryptedCredentials = await encrypt(credsJson, key);
	}

	connections[index] = {
		...existing,
		name: result.data.name,
		encryptedCredentials,
		region: result.data.region,
		endpoint: result.data.endpoint || null,
		bucket: result.data.bucket || null,
		publicUrl: result.data.publicUrl ?? existing.publicUrl,
	};

	await writeConnections(connections);

	revalidatePath("/dashboard");
	return { success: true };
}

export async function removeConnection(
	id: string
): Promise<{ success?: boolean; error?: string }> {
	const connections = await readConnections();
	const filtered = connections.filter((c) => c.id !== id);

	if (filtered.length === connections.length) {
		return { error: "Connection not found" };
	}

	await writeConnections(filtered);

	revalidatePath("/dashboard");
	return { success: true };
}
