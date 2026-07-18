import { Database, Globe, Plus, RefreshCw } from "lucide-react";
import Link from "next/link";
import { listConnections } from "@/actions/credentials-actions";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export const dynamic = "force-dynamic";

export default async function DashboardPage() {
	const connections = await listConnections();
	const s3Connections = connections.filter((c) => c.type === "s3");
	const r2Connections = connections.filter((c) => c.type === "r2");

	return (
		<div className="space-y-8 animate-in fade-in duration-500">
			<div className="flex items-center justify-between">
				<div>
					<h1 className="text-3xl font-bold tracking-tight">Connections</h1>
					<p className="text-muted-foreground">Manage your S3 and R2 bucket connections.</p>
				</div>
				<div className="flex gap-2">
					<Link href="/dashboard"><Button variant="outline" size="sm" className="gap-2"><RefreshCw size={14} />Refresh</Button></Link>
					<Link href="/dashboard/connections/new"><Button size="sm" className="gap-2"><Plus size={14} />Add Connection</Button></Link>
				</div>
			</div>
			{connections.length === 0 ? (
				<div className="py-16 text-center space-y-4 border-2 border-dashed border-muted rounded-2xl bg-muted/5">
					<div className="p-4 bg-muted inline-block rounded-full text-muted-foreground"><Globe size={32} /></div>
					<div>
						<h3 className="text-lg font-medium">No connections yet</h3>
						<p className="text-sm text-muted-foreground max-w-md mx-auto">Add an S3 or R2 connection to start managing your buckets. Your credentials are encrypted and stored only in your browser.</p>
						<div className="mt-6"><Link href="/dashboard/connections/new"><Button className="gap-2"><Plus size={16} />Add Your First Connection</Button></Link></div>
					</div>
				</div>
			) : (
				<div className="space-y-10">
					{s3Connections.length > 0 && (
						<section>
							<div className="flex items-center gap-3 mb-5">
								<div className="p-2 bg-orange-500/10 rounded-lg text-orange-500"><Database size={20} /></div>
								<h2 className="text-xl font-semibold">Amazon S3</h2>
								<span className="text-xs text-muted-foreground bg-muted px-2 py-0.5 rounded-full">{s3Connections.length} connection{s3Connections.length > 1 ? "s" : ""}</span>
							</div>
							<div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
								{s3Connections.map((conn) => (
									<Link key={conn.id} href={`/dashboard/connections/${conn.id}`}>
										<Card className="hover:border-orange-500/50 transition-all hover:scale-[1.02] cursor-pointer group bg-card/40 overflow-hidden relative">
											<div className="absolute top-0 right-0 p-4 opacity-5 group-hover:opacity-10 transition-opacity"><Database size={80} /></div>
											<CardHeader className="flex flex-row items-center gap-4">
												<div className="w-12 h-12 rounded-xl bg-orange-500/10 text-orange-500 flex items-center justify-center shadow-inner"><Database size={24} /></div>
												<div>
													<CardTitle className="text-lg">{conn.name}</CardTitle>
													<p className="text-xs text-muted-foreground">{conn.region}{conn.bucket && ` • ${conn.bucket}`}</p>
												</div>
											</CardHeader>
											<CardContent>
												<div className="flex items-center gap-2 text-xs text-muted-foreground pt-2">
													<div className="w-2 h-2 rounded-full bg-orange-500 animate-pulse" />S3 Compatible
												</div>
											</CardContent>
										</Card>
									</Link>
								))}
							</div>
						</section>
					)}
					{r2Connections.length > 0 && (
						<section>
							<div className="flex items-center gap-3 mb-5">
								<div className="p-2 bg-blue-500/10 rounded-lg text-blue-500"><Globe size={20} /></div>
								<h2 className="text-xl font-semibold">Cloudflare R2</h2>
								<span className="text-xs text-muted-foreground bg-muted px-2 py-0.5 rounded-full">{r2Connections.length} connection{r2Connections.length > 1 ? "s" : ""}</span>
							</div>
							<div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
								{r2Connections.map((conn) => (
									<Link key={conn.id} href={`/dashboard/connections/${conn.id}`}>
										<Card className="hover:border-blue-500/50 transition-all hover:scale-[1.02] cursor-pointer group bg-card/40 overflow-hidden relative">
											<div className="absolute top-0 right-0 p-4 opacity-5 group-hover:opacity-10 transition-opacity"><Database size={80} /></div>
											<CardHeader className="flex flex-row items-center gap-4">
												<div className="w-12 h-12 rounded-xl bg-blue-500/10 text-blue-500 flex items-center justify-center shadow-inner"><Globe size={24} /></div>
												<div>
													<CardTitle className="text-lg">{conn.name}</CardTitle>
													<p className="text-xs text-muted-foreground">R2{conn.bucket && ` • ${conn.bucket}`}</p>
												</div>
											</CardHeader>
											<CardContent>
												<div className="flex items-center gap-2 text-xs text-muted-foreground pt-2">
													<div className="w-2 h-2 rounded-full bg-blue-500 animate-pulse" />S3 Compatible
												</div>
											</CardContent>
										</Card>
									</Link>
								))}
							</div>
						</section>
					)}
				</div>
			)}
		</div>
	);
}
