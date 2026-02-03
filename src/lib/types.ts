import { z } from "zod";

export const s3CredentialsSchema = z.object({
	accessKeyId: z.string().min(1, "Access Key ID is required"),
	secretAccessKey: z.string().min(1, "Secret Access Key is required"),
	region: z.string().default("us-east-1"),
	endpoint: z.string().optional(), // For non-AWS S3 compatible services
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
