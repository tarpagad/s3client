import { S3Client, type S3ClientConfig } from "@aws-sdk/client-s3";
import { getDecryptedConnection } from "@/actions/credentials-actions";

export async function getS3Client(connectionId: string): Promise<S3Client> {
	const connection = await getDecryptedConnection(connectionId);

	if (!connection) {
		throw new Error("Connection not found");
	}

	const config: S3ClientConfig = {
		credentials: {
			accessKeyId: connection.accessKeyId,
			secretAccessKey: connection.secretAccessKey,
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
