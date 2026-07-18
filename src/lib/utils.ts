import { type ClassValue, clsx } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
	return twMerge(clsx(inputs));
}

export function getPublicObjectUrl(
	bucketName: string,
	key: string,
	publicUrl?: string | null,
): string {
	if (publicUrl) {
		const baseUrl = publicUrl.replace(/\/$/, "");
		return `${baseUrl}/${key}`;
	}
	return `https://${bucketName}.s3.amazonaws.com/${key}`;
}
