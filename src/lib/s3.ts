import { S3Client, type S3ClientConfig } from "@aws-sdk/client-s3";
import { decrypt } from "@/lib/encryption";
import { getBucketConnection } from "@/actions/bucket-actions";

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

interface DecryptedCredentials {
	accessKeyId: string;
	secretAccessKey: string;
}

async function decryptCredentials(encrypted: string): Promise<DecryptedCredentials> {
	const decrypted = await decrypt(encrypted, getEncryptionKey());
	if (!decrypted) throw new Error("Failed to decrypt credentials");
	return JSON.parse(decrypted);
}

export async function getS3Client(connectionId: string): Promise<S3Client> {
	const connection = await getBucketConnection(connectionId);

	if (!connection) {
		throw new Error("Connection not found");
	}

	const creds = await decryptCredentials(connection.accessKeyId);

	const config: S3ClientConfig = {
		credentials: {
			accessKeyId: creds.accessKeyId,
			secretAccessKey: creds.secretAccessKey,
		},
		region: connection.region || "us-east-1",
	};

	if (connection.endpoint) {
		config.endpoint = connection.endpoint;
		config.forcePathStyle = true;
		config.region = connection.region || "auto";
	}

	return new S3Client(config);
}
