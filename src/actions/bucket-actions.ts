"use server";

import { headers } from "next/headers";
import { revalidatePath } from "next/cache";
import { auth } from "@/lib/auth";
import { getDb } from "@/db";
import { encrypt } from "@/lib/encryption";
import type { BucketConnection as BucketConnectionRow } from "@/lib/types";
import {
	type BucketConnection,
	type CreateBucketConnectionInput,
	type UpdateBucketConnectionInput,
	createBucketConnectionSchema,
	updateBucketConnectionSchema,
} from "@/lib/types";

function getEncryptionKey(): string {
	const key = process.env.ENCRYPTION_KEY;
	if (!key) {
		if (process.env.NODE_ENV === "production") {
			throw new Error("ENCRYPTION_KEY environment variable is required");
		}
		return "default-dev-key-do-not-use-in-prod";
	}
	return key;
}

function generateId(): string {
	return crypto.randomUUID();
}

function nowISO(): string {
	return new Date().toISOString();
}

export async function addBucketConnection(data: CreateBucketConnectionInput) {
	const session = await auth.api.getSession({
		headers: await headers(),
	});

	if (!session) {
		return { error: "Not authenticated" };
	}

	const result = createBucketConnectionSchema.safeParse(data);
	if (!result.success) {
		return { error: result.error.issues[0].message };
	}

	try {
		const jsonStr = JSON.stringify({
			accessKeyId: result.data.accessKeyId,
			secretAccessKey: result.data.secretAccessKey,
		});
		const encrypted = await encrypt(jsonStr, getEncryptionKey());

		const id = generateId();
		const now = nowISO();
		const db = getDb();

		db.prepare(
			`INSERT INTO bucket_connection (id, userId, name, type, accessKeyId, secretAccessKey, region, endpoint, bucket, createdAt, updatedAt)
			 VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
		).run(
			id,
			session.user.id,
			result.data.name,
			result.data.type,
			encrypted,
			encrypted,
			result.data.region,
			result.data.endpoint || null,
			result.data.bucket || null,
			now,
			now,
		);

		revalidatePath("/dashboard");
		return { success: true, id };
	} catch (error) {
		console.error("Failed to add connection:", error);
		return { error: "Failed to add connection" };
	}
}

export async function listBucketConnections(): Promise<BucketConnection[]> {
	const session = await auth.api.getSession({
		headers: await headers(),
	});

	if (!session) {
		return [];
	}

	const db = getDb();
	const rows = db
		.prepare(
			`SELECT * FROM bucket_connection WHERE userId = ? ORDER BY createdAt DESC`,
		)
		.all(session.user.id) as BucketConnection[];

	return rows;
}

export async function getBucketConnection(
	id: string,
): Promise<BucketConnection | null> {
	const session = await auth.api.getSession({
		headers: await headers(),
	});

	if (!session) return null;

	const db = getDb();
	const row = db
		.prepare(
			`SELECT * FROM bucket_connection WHERE id = ? AND userId = ?`,
		)
		.get(id, session.user.id) as BucketConnection | undefined;

	return row || null;
}

export async function updateBucketConnection(
	id: string,
	data: UpdateBucketConnectionInput,
) {
	const session = await auth.api.getSession({
		headers: await headers(),
	});

	if (!session) {
		return { error: "Not authenticated" };
	}

	const result = updateBucketConnectionSchema.safeParse(data);
	if (!result.success) {
		return { error: result.error.issues[0].message };
	}

	try {
		const now = nowISO();
		const db = getDb();

		const existing = db
			.prepare(
				`SELECT * FROM bucket_connection WHERE id = ? AND userId = ?`,
			)
			.get(id, session.user.id) as BucketConnection | undefined;

		if (!existing) {
			return { error: "Connection not found" };
		}

		const hasNewCredentials =
			result.data.accessKeyId && result.data.secretAccessKey;

		let accessKeyIdEnc = existing.accessKeyId;
		let secretAccessKeyEnc = existing.secretAccessKey;

		if (hasNewCredentials) {
			const jsonStr = JSON.stringify({
				accessKeyId: result.data.accessKeyId,
				secretAccessKey: result.data.secretAccessKey,
			});
			const encrypted = await encrypt(jsonStr, getEncryptionKey());
			accessKeyIdEnc = encrypted;
			secretAccessKeyEnc = encrypted;
		}

		db.prepare(
			`UPDATE bucket_connection SET name = ?, accessKeyId = ?, secretAccessKey = ?, region = ?, endpoint = ?, bucket = ?, updatedAt = ? WHERE id = ? AND userId = ?`,
		).run(
			result.data.name,
			accessKeyIdEnc,
			secretAccessKeyEnc,
			result.data.region,
			result.data.endpoint || null,
			result.data.bucket || null,
			now,
			id,
			session.user.id,
		);

		revalidatePath("/dashboard");
		return { success: true };
	} catch (error) {
		console.error("Failed to update connection:", error);
		return { error: "Failed to update connection" };
	}
}

export async function removeBucketConnection(id: string) {
	const session = await auth.api.getSession({
		headers: await headers(),
	});

	if (!session) {
		return { error: "Not authenticated" };
	}

	const db = getDb();
	db.prepare(
		`DELETE FROM bucket_connection WHERE id = ? AND userId = ?`,
	).run(id, session.user.id);

	revalidatePath("/dashboard");
	return { success: true };
}
