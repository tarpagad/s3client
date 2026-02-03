import { ArrowLeft } from "lucide-react";
import Link from "next/link";
import { notFound } from "next/navigation";
import { listObjects } from "@/actions/s3-actions";
import { FileExplorer } from "@/components/s3/file-explorer";
import { Button } from "@/components/ui/button";
import type { S3ObjectInfo } from "@/lib/types";

interface BucketPageProps {
	params: Promise<{
		bucketName: string;
	}>;
}

export default async function BucketPage({ params }: BucketPageProps) {
	const { bucketName } = await params;

	if (!bucketName) {
		return notFound();
	}

	let initialObjects: S3ObjectInfo[] = [];
	try {
		initialObjects = await listObjects(bucketName);
	} catch (error) {
		console.error("Failed to fetch initial objects:", error);
		// We'll let the FileExplorer handle the error state if needed,
		// or we could show an error card here.
	}

	return (
		<div className="space-y-6">
			<div className="flex items-center gap-4">
				<Link href="/dashboard">
					<Button variant="ghost" size="icon" className="rounded-full">
						<ArrowLeft size={20} />
					</Button>
				</Link>
				<div>
					<h1 className="text-2xl font-bold tracking-tight">{bucketName}</h1>
					<p className="text-sm text-muted-foreground">S3 Object Browser</p>
				</div>
			</div>

			<FileExplorer bucketName={bucketName} initialObjects={initialObjects} />
		</div>
	);
}
