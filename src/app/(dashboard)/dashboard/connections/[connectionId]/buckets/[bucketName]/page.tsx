import { ArrowLeft } from "lucide-react";
import Link from "next/link";
import { notFound } from "next/navigation";
import { getConnection } from "@/actions/credentials-actions";
import { listObjects } from "@/actions/s3-actions";
import { FileExplorer } from "@/components/s3/file-explorer";
import { Button } from "@/components/ui/button";
import { getUserPrefs } from "@/lib/preferences";
import type { S3ObjectInfo } from "@/lib/types";

interface BucketPageProps {
	params: Promise<{ connectionId: string; bucketName: string }>;
}

export default async function BucketPage({ params }: BucketPageProps) {
	const { connectionId, bucketName } = await params;
	if (!bucketName || !connectionId) { return notFound(); }

	const connection = await getConnection(connectionId);
	if (!connection) { return notFound(); }

	const prefs = await getUserPrefs();
	let initialObjects: S3ObjectInfo[] = [];
	let initialNextToken: string | undefined;
	try {
		const result = await listObjects(connectionId, bucketName, "", prefs.itemsPerPage);
		initialObjects = result.objects;
		initialNextToken = result.nextToken;
	} catch (error) { console.error("Failed to fetch initial objects:", error); }

	return (
		<div className="space-y-6">
			<div className="flex items-center gap-4">
				<Link href={`/dashboard/connections/${connectionId}`}><Button variant="ghost" size="icon" className="rounded-full"><ArrowLeft size={20} /></Button></Link>
				<div>
					<div className="flex items-center gap-2">
						<h1 className="text-2xl font-bold tracking-tight">{bucketName}</h1>
						<span className="text-xs font-medium px-2 py-0.5 rounded-full bg-primary/10 text-primary border border-primary/20">{connection.name}</span>
					</div>
					<p className="text-sm text-muted-foreground">{connection.type === "s3" ? "Amazon S3" : "Cloudflare R2"} — Object Browser</p>
				</div>
			</div>
			<FileExplorer
				connectionId={connectionId}
				bucketName={bucketName}
				connectionType={connection.type}
				r2PublicUrl={process.env.R2_PUBLIC_URL}
				initialObjects={initialObjects}
				initialNextToken={initialNextToken}
				initialPrefs={prefs}
			/>
		</div>
	);
}
