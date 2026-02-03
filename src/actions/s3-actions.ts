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
import type {
	BucketInfo,
	ListObjectsResponse,
	S3ObjectInfo,
} from "@/lib/types";

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
	maxKeys: number = 100,
	continuationToken?: string,
): Promise<ListObjectsResponse> {
	try {
		const client = await getS3Client();
		const response = await client.send(
			new ListObjectsV2Command({
				Bucket: bucket,
				Prefix: prefix,
				Delimiter: "/",
				MaxKeys: maxKeys,
				ContinuationToken: continuationToken,
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

		const contents = response.Contents || [];
		const filesToProcess = contents.filter((content) => content.Key !== prefix);

		// Performance optimization: Batch ACL checks to prevent "socket usage at capacity"
		const batchSize = 10;
		const files: S3ObjectInfo[] = [];

		for (let i = 0; i < filesToProcess.length; i += batchSize) {
			const batch = filesToProcess.slice(i, i + batchSize);
			const batchResults = await Promise.all(
				batch.map(async (content) => {
					const key = content.Key ?? "";
					const name = key.split("/").pop() || "";
					const extension = name.split(".").pop();

					let isPublic = false;
					try {
						// Only check ACL if we are truly investigating public status.
						// This is still high-overhead; in production you'd use S3 Inventory or Tags.
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
			files.push(...(batchResults as S3ObjectInfo[]));
		}

		return {
			objects: [...folders, ...files],
			nextToken: response.NextContinuationToken,
			totalObjects: response.KeyCount,
		};
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

export async function getFileContent(bucket: string, key: string) {
	try {
		const client = await getS3Client();
		const response = await client.send(
			new GetObjectCommand({
				Bucket: bucket,
				Key: key,
			}),
		);

		if (!response.Body) {
			throw new Error("Empty response body");
		}

		const content = await response.Body.transformToString();
		return { content };
	} catch (error: unknown) {
		console.error("Failed to fetch file content:", error);
		return {
			error:
				error instanceof Error ? error.message : "Failed to fetch file content",
		};
	}
}
/**
 * Performs a server-side search for objects within a specific prefix.
 * Matches both folders and files.
 */
export async function searchObjects(
	bucket: string,
	prefix: string,
	query: string,
): Promise<ListObjectsResponse> {
	if (!query.trim()) {
		return listObjects(bucket, prefix);
	}

	try {
		const client = await getS3Client();
		const allFolders: S3ObjectInfo[] = [];
		const allFiles: {
			Key: string;
			LastModified?: Date;
			Size?: number;
			ETag?: string;
		}[] = [];
		let continuationToken: string | undefined;

		const lowerQuery = query.toLowerCase();

		// Step 1: Accumulate all matches across all pages
		do {
			const response = await client.send(
				new ListObjectsV2Command({
					Bucket: bucket,
					Prefix: prefix,
					Delimiter: "/",
					ContinuationToken: continuationToken,
				}),
			);

			// Match folders
			const folders: S3ObjectInfo[] = (response.CommonPrefixes || [])
				.map((p) => {
					const prefixStr = p.Prefix ?? "";
					const name = prefixStr.slice(0, -1).split("/").pop() || "";
					return { key: prefixStr, name, type: "folder" as const };
				})
				.filter((f) => f.name.toLowerCase().includes(lowerQuery));

			allFolders.push(...folders);

			// Match files
			const files = (response.Contents || [])
				.filter((c) => {
					if (c.Key === prefix) return false;
					const name = c.Key?.split("/").pop() || "";
					return name.toLowerCase().includes(lowerQuery);
				})
				.map((c) => ({
					Key: c.Key || "",
					LastModified: c.LastModified,
					Size: c.Size,
					ETag: c.ETag,
				}));

			allFiles.push(...files);
			continuationToken = response.NextContinuationToken;
		} while (continuationToken);

		// Step 2: Batch ACL checks for MATCHED files (limit search results to 100 for safety)
		const matchedFilesToProcess = allFiles.slice(0, 100);
		const batchSize = 10;
		const finalFiles: S3ObjectInfo[] = [];

		for (let i = 0; i < matchedFilesToProcess.length; i += batchSize) {
			const batch = matchedFilesToProcess.slice(i, i + batchSize);
			const batchResults = await Promise.all(
				batch.map(async (content) => {
					const key = content.Key;
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
					} catch (_e) {}

					return {
						key,
						name,
						lastModified: content.LastModified,
						size: content.Size,
						etag: content.ETag,
						type: "file" as const,
						extension,
						isPublic,
					};
				}),
			);
			finalFiles.push(...batchResults);
		}

		return {
			objects: [...allFolders, ...finalFiles],
			totalObjects: allFolders.length + finalFiles.length,
		};
	} catch (error: unknown) {
		console.error("Search failed:", error);
		throw new Error(error instanceof Error ? error.message : "Search failed");
	}
}

/**
 * Counts the total number of items in a specific prefix (folder).
 * This is optimized for speed by not fetching ACLs or metadata.
 */
export async function countObjects(
	bucket: string,
	prefix: string = "",
): Promise<{ count: number }> {
	try {
		const client = await getS3Client();
		let totalCount = 0;
		let continuationToken: string | undefined;

		do {
			const response = await client.send(
				new ListObjectsV2Command({
					Bucket: bucket,
					Prefix: prefix,
					Delimiter: "/",
					ContinuationToken: continuationToken,
					MaxKeys: 1000, // Fetch in large chunks for counting
				}),
			);

			totalCount += response.CommonPrefixes?.length || 0;
			// We only count files that aren't the prefix itself
			const files = (response.Contents || []).filter((c) => c.Key !== prefix);
			totalCount += files.length;

			continuationToken = response.NextContinuationToken;
		} while (continuationToken);

		return { count: totalCount };
	} catch (error: unknown) {
		console.error("Failed to count objects:", error);
		return { count: 0 };
	}
}
