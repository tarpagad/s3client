import { z } from "zod";

export const s3CredentialsSchema = z.object({
	accessKeyId: z.string().min(1, "Access Key ID is required"),
	secretAccessKey: z.string().min(1, "Secret Access Key is required"),
	region: z.string().default("us-east-1"),
	endpoint: z.string().optional(),
});

export type S3Credentials = z.infer<typeof s3CredentialsSchema>;

export interface BucketInfo {
	name: string;
	creationDate?: Date;
}

export interface S3ObjectInfo {
	key: string;
	name: string;
	lastModified?: Date;
	size?: number;
	etag?: string;
	type: "file" | "folder";
	extension?: string;
	isPublic?: boolean;
}

export interface ListObjectsResponse {
	objects: S3ObjectInfo[];
	nextToken?: string;
	totalObjects?: number;
}

export type BucketConnectionType = "s3" | "r2";

export interface BucketConnection {
	id: string;
	userId: string;
	name: string;
	type: BucketConnectionType;
	accessKeyId: string;
	secretAccessKey: string;
	region: string;
	endpoint: string | null;
	bucket: string | null;
	createdAt: string;
	updatedAt: string;
}

export const createBucketConnectionSchema = z.object({
	name: z.string().min(1, "Connection name is required"),
	type: z.enum(["s3", "r2"]),
	accessKeyId: z.string().min(1, "Access Key ID is required"),
	secretAccessKey: z.string().min(1, "Secret Access Key is required"),
	region: z.string().default("us-east-1"),
	endpoint: z.string().optional(),
	bucket: z.string().optional(),
});

export type CreateBucketConnectionInput = z.infer<
	typeof createBucketConnectionSchema
>;

export const updateBucketConnectionSchema = z.object({
	name: z.string().min(1, "Connection name is required"),
	accessKeyId: z.string().optional(),
	secretAccessKey: z.string().optional(),
	region: z.string().default("us-east-1"),
	endpoint: z.string().optional(),
	bucket: z.string().optional(),
});

export type UpdateBucketConnectionInput = z.infer<
	typeof updateBucketConnectionSchema
>;
