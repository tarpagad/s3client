import { Database, Plus, RefreshCw } from "lucide-react";
import Link from "next/link";
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

export const dynamic = "force-dynamic";

export default async function DashboardPage() {
	let buckets: BucketInfo[] = [];
	let error: string | null = null;

	try {
		buckets = await listBuckets();
	} catch (err: unknown) {
		error = err instanceof Error ? err.message : "An unknown error occurred";
	}

	return (
		<div className="space-y-8 animate-in fade-in duration-500">
			<div className="flex items-center justify-between">
				<div>
					<h1 className="text-3xl font-bold tracking-tight">Buckets</h1>
					<p className="text-muted-foreground">
						Select a bucket to start managing your files.
					</p>
				</div>
				<div className="flex gap-2">
					<form action="/dashboard">
						<Button variant="outline" size="sm" className="gap-2">
							<RefreshCw size={14} />
							Refresh
						</Button>
					</form>
					<Button size="sm" className="gap-2">
						<Plus size={14} />
						Create Bucket
					</Button>
				</div>
			</div>

			{error ? (
				<Card className="border-destructive/20 bg-destructive/5">
					<CardHeader>
						<CardTitle className="text-destructive">Connection Error</CardTitle>
						<CardDescription className="text-destructive/80">
							We couldn't fetch your buckets. Please check your AWS credentials
							or permissions.
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
					<Card className="hover:border-primary/50 transition-colors cursor-pointer group bg-card/20 border-dashed border-2 flex flex-col items-center justify-center p-6 h-48">
						<div className="p-3 bg-muted rounded-full text-muted-foreground group-hover:bg-primary/10 group-hover:text-primary transition-colors mb-4">
							<Plus size={32} />
						</div>
						<div className="text-center">
							<CardTitle className="text-sm font-medium">
								Create New Bucket
							</CardTitle>
							<CardDescription className="text-xs">
								AWS S3 Provisioning
							</CardDescription>
						</div>
					</Card>

					{buckets.map((bucket) => (
						<Link key={bucket.name} href={`/dashboard/buckets/${bucket.name}`}>
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
										Connected via S3 SDK
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
									We didn't find any buckets in this region. You can create one
									via the AWS console or the button above.
								</p>
							</div>
						</div>
					)}
				</div>
			)}
		</div>
	);
}
