export const ENCRYPTION_ALGORITHM = "AES-GCM";

async function getCryptoKey(secret: string): Promise<CryptoKey> {
	const encoder = new TextEncoder();
	const keyData = encoder.encode(secret);
	// Hash the secret to ensure it's 32 bytes (256 bits) for AES-256
	const hash = await crypto.subtle.digest("SHA-256", keyData);
	return crypto.subtle.importKey(
		"raw",
		hash,
		{ name: ENCRYPTION_ALGORITHM },
		false,
		["encrypt", "decrypt"],
	);
}

export async function encrypt(text: string, secret: string): Promise<string> {
	const key = await getCryptoKey(secret);
	const iv = crypto.getRandomValues(new Uint8Array(12));
	const encoder = new TextEncoder();
	const encoded = encoder.encode(text);

	const ciphertext = await crypto.subtle.encrypt(
		{
			name: ENCRYPTION_ALGORITHM,
			iv,
		},
		key,
		encoded,
	);

	// Combine IV and ciphertext for storage
	const ivArr = Array.from(iv);
	const ciphertextArr = Array.from(new Uint8Array(ciphertext));
	const combined = new Uint8Array([...ivArr, ...ciphertextArr]);

	// Return base64url encoded string
	return btoa(String.fromCharCode(...combined));
}

export async function decrypt(
	encryptedText: string,
	secret: string,
): Promise<string | null> {
	try {
		const combinedStr = atob(encryptedText);
		const combined = new Uint8Array(combinedStr.length);
		for (let i = 0; i < combinedStr.length; i++) {
			combined[i] = combinedStr.charCodeAt(i);
		}

		// Extract IV (first 12 bytes)
		const iv = combined.slice(0, 12);
		const ciphertext = combined.slice(12);

		const key = await getCryptoKey(secret);

		const decrypted = await crypto.subtle.decrypt(
			{
				name: ENCRYPTION_ALGORITHM,
				iv,
			},
			key,
			ciphertext,
		);

		const decoder = new TextDecoder();
		return decoder.decode(decrypted);
	} catch (error) {
		console.error("Decryption failed:", error);
		return null;
	}
}
