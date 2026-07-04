import { ArrowLeft, Database, Edit, Plus, RefreshCw, Trash2 } from "lucide-react";
import Link from "next/link";
import { notFound } from "next/navigation";
import { getBucketConnection, removeBucketConnection } from "@/actions/bucket-actions";
import { listBuckets } from "@/actions/s3-actions";
import { Button } from "@/components/ui/button";
import {
	Card,
	CardContent,
	CardDescription,
	CardHeader,
	CardTitle,
} from "@/components/ui/card";
import type { BucketInfo } from "@/lib/types";

interface ConnectionBucketsPageProps {
	params: Promise<{
		connectionId: string;
	}>;
}

export const dynamic = "force-dynamic";

export default async function ConnectionBucketsPage({
	params,
}: ConnectionBucketsPageProps) {
	const { connectionId } = await params;

	const connection = await getBucketConnection(connectionId);

	if (!connection) {
		return notFound();
	}

	let buckets: BucketInfo[] = [];
	let error: string | null = null;

	try {
		buckets = await listBuckets(connectionId);
		buckets.sort((a, b) => a.name.localeCompare(b.name));
	} catch (err: unknown) {
		error = err instanceof Error ? err.message : "An unknown error occurred";
	}

	const typeColor = connection.type === "s3" ? "orange" : "blue";
	const typeLabel = connection.type === "s3" ? "Amazon S3" : "Cloudflare R2";

	return (
		<div className="space-y-6 animate-in fade-in duration-500">
			<div className="flex items-center gap-4">
				<Link href="/dashboard">
					<Button variant="ghost" size="icon" className="rounded-full">
						<ArrowLeft size={20} />
					</Button>
				</Link>
				<div className="flex-1">
					<div className="flex items-center gap-3">
						<h1 className="text-2xl font-bold tracking-tight">
							{connection.name}
						</h1>
						<span
							className={`text-xs font-medium px-2.5 py-0.5 rounded-full bg-${typeColor}-500/10 text-${typeColor}-500 border border-${typeColor}-500/20`}
						>
							{typeLabel}
						</span>
					</div>
					<p className="text-sm text-muted-foreground">
						{connection.region}
						{connection.endpoint && ` • ${connection.endpoint}`}
					</p>
				</div>
				<div className="flex gap-2">
					<Link href={`/dashboard/connections/${connectionId}/edit`}>
						<Button variant="outline" size="sm" className="gap-2">
							<Edit size={14} />
							Edit
						</Button>
					</Link>
					<form
						action={async () => {
							"use server";
							await removeBucketConnection(connectionId);
						}}
					>
						<Button
							variant="outline"
							size="sm"
							className="gap-2 text-destructive hover:bg-destructive/10 border-destructive/20"
						>
							<Trash2 size={14} />
							Delete
						</Button>
					</form>
					<form action={`/dashboard/connections/${connectionId}`}>
						<Button variant="outline" size="sm" className="gap-2">
							<RefreshCw size={14} />
							Refresh
						</Button>
					</form>
				</div>
			</div>

			{error ? (
				<Card className="border-destructive/20 bg-destructive/5">
					<CardHeader>
						<CardTitle className="text-destructive">Connection Error</CardTitle>
						<CardDescription className="text-destructive/80">
							We couldn&apos;t fetch buckets for this connection. Please check
							your credentials and permissions.
						</CardDescription>
					</CardHeader>
					<CardContent>
						<p className="text-sm font-mono bg-background/50 p-4 rounded border border-destructive/10">
							{error}
						</p>
					</CardContent>
				</Card>
			) : (
				<div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
					{buckets.map((bucket) => (
						<Link
							key={bucket.name}
							href={`/dashboard/connections/${connectionId}/buckets/${bucket.name}`}
						>
							<Card className="hover:border-primary/50 transition-all hover:scale-[1.02] cursor-pointer group bg-card/40 overflow-hidden relative">
								<div className="absolute top-0 right-0 p-4 opacity-5 group-hover:opacity-10 transition-opacity">
									<Database size={80} />
								</div>
								<CardHeader className="flex flex-row items-center gap-4">
									<div className="w-12 h-12 rounded-xl bg-primary/10 text-primary flex items-center justify-center shadow-inner">
										<Database size={24} />
									</div>
									<div>
										<CardTitle className="text-lg">{bucket.name}</CardTitle>
										<CardDescription className="text-xs">
											{bucket.creationDate
												? `Created: ${new Date(bucket.creationDate).toLocaleDateString()}`
												: "Date unknown"}
										</CardDescription>
									</div>
								</CardHeader>
								<CardContent>
									<div className="flex items-center gap-2 text-xs text-muted-foreground pt-2">
										<div className="w-2 h-2 rounded-full bg-green-500 animate-pulse" />
										Connected via {typeLabel}
									</div>
								</CardContent>
							</Card>
						</Link>
					))}

					{buckets.length === 0 && !error && (
						<div className="col-span-full py-12 text-center space-y-4 border-2 border-dashed border-muted rounded-2xl bg-muted/5">
							<div className="p-4 bg-muted inline-block rounded-full text-muted-foreground">
								<Database size={32} />
							</div>
							<div>
								<h3 className="text-lg font-medium">No buckets found</h3>
								<p className="text-sm text-muted-foreground max-w-xs mx-auto">
									No buckets were found for this connection. You can create one
									via the provider console.
								</p>
							</div>
						</div>
					)}
				</div>
			)}
		</div>
	);
}
