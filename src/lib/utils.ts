import { type ClassValue, clsx } from "clsx";
import { twMerge } from "tailwind-merge";
import type { BucketConnectionType } from "./types";

export function cn(...inputs: ClassValue[]) {
	return twMerge(clsx(inputs));
}

export function getPublicObjectUrl(
	type: BucketConnectionType,
	bucketName: string,
	key: string,
	r2PublicUrl?: string,
): string {
	if (type === "r2") {
		const baseUrl = r2PublicUrl?.replace(/\/$/, "");
		if (baseUrl) {
			return `${baseUrl}/${key}`;
		}
	}
	return `https://${bucketName}.s3.amazonaws.com/${key}`;
}
