"use server";

import {
	CopyObjectCommand,
	DeleteObjectCommand,
	DeleteObjectsCommand,
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

export async function listBuckets(
	connectionId: string
): Promise<BucketInfo[]> {
	try {
		const client = await getS3Client(connectionId);
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
	connectionId: string,
	bucket: string,
	prefix: string = "",
	maxKeys: number = 100,
	continuationToken?: string,
	sortBy: "date-desc" | "date-asc" | "name-asc" | "name-desc" = "date-desc",
): Promise<ListObjectsResponse> {
	try {
		const client = await getS3Client(connectionId);

		let offset = 0;
		if (continuationToken) {
			try {
				const decoded = JSON.parse(
					Buffer.from(continuationToken, "base64").toString(),
				);
				offset = decoded.offset || 0;
			} catch {
				offset = 0;
			}
		}

		const allFolders: S3ObjectInfo[] = [];
		const allFiles: {
			Key: string;
			LastModified?: Date;
			Size?: number;
			ETag?: string;
		}[] = [];

		let s3Token: string | undefined;
		const SAFETY_LIMIT = 2000;
		let totalFetched = 0;

		do {
			const command = new ListObjectsV2Command({
				Bucket: bucket,
				Prefix: prefix,
				Delimiter: "/",
				ContinuationToken: s3Token,
			});
			const response = await client.send(command);

			if (response.CommonPrefixes) {
				for (const p of response.CommonPrefixes) {
					const prefixStr = p.Prefix ?? "";
					if (!allFolders.some((f) => f.key === prefixStr)) {
						const name = prefixStr.slice(0, -1).split("/").pop() || "";
						allFolders.push({
							key: prefixStr,
							name,
							type: "folder" as const,
						});
					}
				}
			}

			if (response.Contents) {
				for (const c of response.Contents) {
					if (c.Key === prefix) continue;
					const key = c.Key || "";
					if (key.endsWith("/") && key !== prefix) {
						const name = key.slice(0, -1).split("/").pop() || "";
						if (!allFolders.some((f) => f.key === key)) {
							allFolders.push({ key, name, type: "folder" as const });
						}
					} else {
						allFiles.push({
							Key: key,
							LastModified: c.LastModified,
							Size: c.Size,
							ETag: c.ETag,
						});
					}
				}
			}

			totalFetched = allFolders.length + allFiles.length;
			s3Token = response.NextContinuationToken;
		} while (s3Token && totalFetched < SAFETY_LIMIT);

		allFolders.sort((a, b) => a.name.localeCompare(b.name));

		allFiles.sort((a, b) => {
			if (sortBy === "date-desc") {
				return (b.LastModified?.getTime() || 0) - (a.LastModified?.getTime() || 0);
			}
			if (sortBy === "date-asc") {
				return (a.LastModified?.getTime() || 0) - (b.LastModified?.getTime() || 0);
			}
			const nameA = a.Key.split("/").pop() || "";
			const nameB = b.Key.split("/").pop() || "";
			if (sortBy === "name-asc") {
				return nameA.localeCompare(nameB);
			}
			if (sortBy === "name-desc") {
				return nameB.localeCompare(nameA);
			}
			return 0;
		});

		const allFilesMapped: S3ObjectInfo[] = allFiles.map((f) => {
			const name = f.Key.split("/").pop() || "";
			const extension = name.split(".").pop();
			return {
				key: f.Key,
				name,
				lastModified: f.LastModified,
				size: f.Size,
				etag: f.ETag,
				type: "file" as const,
				extension,
				isPublic: false,
			};
		});

		const combined = [...allFolders, ...allFilesMapped];
		const paginatedItems = combined.slice(offset, offset + maxKeys);

		const itemsWithAcl = await Promise.all(
			paginatedItems.map(async (item) => {
				if (item.type !== "file") return item;

				try {
					const acl = await client.send(
						new GetObjectAclCommand({ Bucket: bucket, Key: item.key }),
					);
					const isPublic = (acl.Grants || []).some(
						(grant) =>
							grant.Grantee?.URI ===
								"http://acs.amazonaws.com/groups/global/AllUsers" &&
							grant.Permission === "READ",
					);
					return { ...item, isPublic };
				} catch {
					return item;
				}
			}),
		);

		let nextToken: string | undefined;
		if (offset + maxKeys < combined.length) {
			nextToken = Buffer.from(
				JSON.stringify({ offset: offset + maxKeys }),
			).toString("base64");
		}

		return {
			objects: itemsWithAcl,
			nextToken,
			totalObjects: combined.length,
		};
	} catch (error: unknown) {
		console.error("Failed to list objects:", error);
		throw new Error(
			error instanceof Error ? error.message : "Failed to list objects",
		);
	}
}

export async function deleteObjects(
	connectionId: string,
	bucket: string,
	keys: string[],
) {
	try {
		const client = await getS3Client(connectionId);

		if (keys.length === 0) return { success: true };

		const objects = keys.map(key => ({ Key: key }));

		const batchSize = 1000;
		for (let i = 0; i < objects.length; i += batchSize) {
			const batch = objects.slice(i, i + batchSize);
			await client.send(
				new DeleteObjectsCommand({
					Bucket: bucket,
					Delete: { Objects: batch },
				}),
			);
		}

		revalidatePath("/dashboard");
		return { success: true };
	} catch (error: unknown) {
		console.error("Bulk delete failed:", error);
		return {
			error:
				error instanceof Error ? error.message : "Failed to delete objects",
		};
	}
}

export async function deleteObject(
	connectionId: string,
	bucket: string,
	key: string,
) {
	try {
		const client = await getS3Client(connectionId);
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
	connectionId: string,
	bucket: string,
	oldKey: string,
	newKey: string,
) {
	try {
		const client = await getS3Client(connectionId);

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

export async function getDownloadUrl(
	connectionId: string,
	bucket: string,
	key: string,
) {
	try {
		const client = await getS3Client(connectionId);
		const command = new GetObjectCommand({
			Bucket: bucket,
			Key: key,
		});

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
	connectionId: string,
	bucket: string,
	key: string,
	fileData: FormData,
	isPublic: boolean = false,
) {
	try {
		const client = await getS3Client(connectionId);
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
				ACL: isPublic ? "public-read" : undefined,
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

export async function makePublic(
	connectionId: string,
	bucket: string,
	key: string,
) {
	try {
		const client = await getS3Client(connectionId);
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

export async function getFileContent(
	connectionId: string,
	bucket: string,
	key: string,
) {
	try {
		const client = await getS3Client(connectionId);
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

export async function searchObjects(
	connectionId: string,
	bucket: string,
	prefix: string,
	query: string,
): Promise<ListObjectsResponse> {
	if (!query.trim()) {
		return listObjects(connectionId, bucket, prefix);
	}

	try {
		const client = await getS3Client(connectionId);
		const allFolders: S3ObjectInfo[] = [];
		const allFiles: {
			Key: string;
			LastModified?: Date;
			Size?: number;
			ETag?: string;
		}[] = [];
		let continuationToken: string | undefined;

		const lowerQuery = query.toLowerCase();

		do {
			const response = await client.send(
				new ListObjectsV2Command({
					Bucket: bucket,
					Prefix: prefix,
					Delimiter: "/",
					ContinuationToken: continuationToken,
				}),
			);

			const folders: S3ObjectInfo[] = (response.CommonPrefixes || [])
				.map((p) => {
					const prefixStr = p.Prefix ?? "";
					const name = prefixStr.slice(0, -1).split("/").pop() || "";
					return { key: prefixStr, name, type: "folder" as const };
				})
				.filter((f) => f.name.toLowerCase().includes(lowerQuery));

			allFolders.push(...folders);

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

		allFolders.sort((a, b) => a.name.localeCompare(b.name));

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
					} catch {}

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

export async function countObjects(
	connectionId: string,
	bucket: string,
	prefix: string = "",
): Promise<{ count: number }> {
	try {
		const client = await getS3Client(connectionId);
		let totalCount = 0;
		let continuationToken: string | undefined;

		do {
			const response = await client.send(
				new ListObjectsV2Command({
					Bucket: bucket,
					Prefix: prefix,
					Delimiter: "/",
					ContinuationToken: continuationToken,
					MaxKeys: 1000,
				}),
			);

			totalCount += response.CommonPrefixes?.length || 0;
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

export async function createFolder(
	connectionId: string,
	bucket: string,
	prefix: string,
	folderName: string,
) {
	try {
		if (!folderName.trim()) {
			throw new Error("Folder name cannot be empty");
		}

		const invalidChars = /[\\^`><{}[\]#%~|/]/;
		if (invalidChars.test(folderName)) {
			throw new Error(
				"Folder name contains invalid characters (\\ ^ ` > < { } [ ] # % ~ | /)",
			);
		}

		const client = await getS3Client(connectionId);
		const key = `${prefix}${folderName}/`;

		const response = await client.send(
			new ListObjectsV2Command({
				Bucket: bucket,
				Prefix: key,
				Delimiter: "/",
				MaxKeys: 1,
			}),
		);

		if (
			(response.Contents && response.Contents.length > 0) ||
			(response.CommonPrefixes && response.CommonPrefixes.length > 0)
		) {
			throw new Error("A folder or file with this name already exists");
		}

		await client.send(
			new PutObjectCommand({
				Bucket: bucket,
				Key: key,
				Body: "",
			}),
		);

		revalidatePath("/dashboard");
		return { success: true };
	} catch (error: unknown) {
		console.error("Failed to create folder:", error);
		return {
			error: error instanceof Error ? error.message : "Failed to create folder",
		};
	}
}
