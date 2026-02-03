import { S3Client, type S3ClientConfig } from "@aws-sdk/client-s3";
import { getS3Credentials } from "@/actions/auth-actions";

export async function getS3Client(): Promise<S3Client> {
	const credentials = await getS3Credentials();

	if (!credentials) {
		throw new Error(
			"No S3 credentials found. Please connect your AWS account.",
		);
	}

	const config: S3ClientConfig = {
		credentials: {
			accessKeyId: credentials.accessKeyId,
			secretAccessKey: credentials.secretAccessKey,
		},
		region: credentials.region || "us-east-1",
	};

	// If a custom endpoint is provided (e.g., for Cloudflare R2, DigitalOcean Spaces, etc.)
	if (credentials.endpoint) {
		config.endpoint = credentials.endpoint;
		// For many non-AWS S3 providers, path style is required or preferred
		config.forcePathStyle = true;
	}

	return new S3Client(config);
}
