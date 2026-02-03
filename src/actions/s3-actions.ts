"use server";

import {
	CopyObjectCommand,
	DeleteObjectCommand,
	GetObjectAclCommand,
	GetObjectCommand,
	ListBucketsCommand,
	ListObjectsV2Command,
	PutObjectAclCommand,
	PutObjectCommand,
} from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";
import { revalidatePath } from "next/cache";
import { getS3Client } from "@/lib/s3";
import type { BucketInfo, S3ObjectInfo } from "@/lib/types";

export async function listBuckets(): Promise<BucketInfo[]> {
	try {
		const client = await getS3Client();
		const response = await client.send(new ListBucketsCommand({}));

		return (response.Buckets || []).map((bucket) => ({
			name: bucket.Name || "unknown",
			creationDate: bucket.CreationDate,
		}));
	} catch (error: unknown) {
		console.error("Failed to list buckets:", error);
		throw new Error(
			error instanceof Error ? error.message : "Failed to list buckets",
		);
	}
}

export async function listObjects(
	bucket: string,
	prefix: string = "",
): Promise<S3ObjectInfo[]> {
	try {
		const client = await getS3Client();
		const response = await client.send(
			new ListObjectsV2Command({
				Bucket: bucket,
				Prefix: prefix,
				Delimiter: "/", // Essential for folder simulation
			}),
		);

		const folders: S3ObjectInfo[] = (response.CommonPrefixes || []).map((p) => {
			const prefixStr = p.Prefix ?? "";
			const name = prefixStr.slice(0, -1).split("/").pop() || "";
			return {
				key: prefixStr,
				name,
				type: "folder",
			};
		});

		const files: S3ObjectInfo[] = await Promise.all(
			(response.Contents || [])
				.filter((content) => content.Key !== prefix)
				.map(async (content) => {
					const key = content.Key ?? "";
					const name = key.split("/").pop() || "";
					const extension = name.split(".").pop();

					let isPublic = false;
					try {
						const acl = await client.send(
							new GetObjectAclCommand({ Bucket: bucket, Key: key }),
						);
						isPublic = (acl.Grants || []).some(
							(grant) =>
								grant.Grantee?.URI ===
									"http://acs.amazonaws.com/groups/global/AllUsers" &&
								grant.Permission === "READ",
						);
					} catch (_e) {
						// Ignored, might happen if user doesn't have permission to read ACL
					}

					return {
						key: key,
						name,
						lastModified: content.LastModified,
						size: content.Size,
						etag: content.ETag,
						type: "file",
						extension,
						isPublic,
					};
				}),
		);

		return [...folders, ...files];
	} catch (error: unknown) {
		console.error("Failed to list objects:", error);
		throw new Error(
			error instanceof Error ? error.message : "Failed to list objects",
		);
	}
}

export async function deleteObject(bucket: string, key: string) {
	try {
		const client = await getS3Client();
		await client.send(
			new DeleteObjectCommand({
				Bucket: bucket,
				Key: key,
			}),
		);
		revalidatePath("/dashboard");
		return { success: true };
	} catch (error: unknown) {
		console.error("Operation failed:", error);
		return {
			error:
				error instanceof Error ? error.message : "An unknown error occurred",
		};
	}
}

export async function renameObject(
	bucket: string,
	oldKey: string,
	newKey: string,
) {
	try {
		const client = await getS3Client();

		// S3 doesn't have "rename", we must Copy + Delete
		await client.send(
			new CopyObjectCommand({
				Bucket: bucket,
				CopySource: encodeURIComponent(`${bucket}/${oldKey}`),
				Key: newKey,
			}),
		);

		await client.send(
			new DeleteObjectCommand({
				Bucket: bucket,
				Key: oldKey,
			}),
		);

		revalidatePath("/dashboard");
		return { success: true };
	} catch (error: unknown) {
		console.error("Failed to rename object:", error);
		return {
			error: error instanceof Error ? error.message : "Failed to rename object",
		};
	}
}

export async function getDownloadUrl(bucket: string, key: string) {
	try {
		const client = await getS3Client();
		const command = new GetObjectCommand({
			Bucket: bucket,
			Key: key,
		});

		// URL expires in 1 hour
		const url = await getSignedUrl(client, command, { expiresIn: 3600 });
		return { url };
	} catch (error: unknown) {
		console.error("Failed to generate presigned URL:", error);
		return {
			error:
				error instanceof Error
					? error.message
					: "Failed to generate download URL",
		};
	}
}

export async function uploadFile(
	bucket: string,
	key: string,
	fileData: FormData,
) {
	try {
		const client = await getS3Client();
		const file = fileData.get("file") as File;

		if (!file) {
			throw new Error("No file provided");
		}

		const bytes = await file.arrayBuffer();
		const buffer = Buffer.from(bytes);

		await client.send(
			new PutObjectCommand({
				Bucket: bucket,
				Key: key,
				Body: buffer,
				ContentType: file.type,
			}),
		);

		revalidatePath("/dashboard");
		return { success: true };
	} catch (error: unknown) {
		console.error("Failed to upload file:", error);
		return {
			error: error instanceof Error ? error.message : "Failed to upload file",
		};
	}
}

export async function makePublic(bucket: string, key: string) {
	try {
		const client = await getS3Client();
		await client.send(
			new PutObjectAclCommand({
				Bucket: bucket,
				Key: key,
				ACL: "public-read",
			}),
		);
		revalidatePath("/dashboard");
		return { success: true };
	} catch (error: unknown) {
		console.error("Failed to make object public:", error);
		return {
			error:
				error instanceof Error ? error.message : "Failed to set public access",
		};
	}
}
