"use client";
import { Globe, HardDrive, Loader2, ShieldCheck } from "lucide-react";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { toast } from "sonner";
import { addConnection } from "@/actions/credentials-actions";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { cn } from "@/lib/utils";
import type { BucketConnectionType } from "@/lib/types";

export function AddConnectionForm() {
	const router = useRouter();
	const [loading, setLoading] = useState(false);
	const [type, setType] = useState<BucketConnectionType>("s3");

	async function onSubmit(event: React.FormEvent<HTMLFormElement>) {
		event.preventDefault();
		setLoading(true);
		const formData = new FormData(event.currentTarget);
		const data = {
			name: formData.get("name") as string,
			type: type,
			accessKeyId: formData.get("accessKeyId") as string,
			secretAccessKey: formData.get("secretAccessKey") as string,
			region: (formData.get("region") as string) || "us-east-1",
			endpoint: (formData.get("endpoint") as string) || undefined,
			bucket: (formData.get("bucket") as string) || undefined,
		};
		try {
			const response = await addConnection(data);
			if (response.error) { toast.error(response.error); }
			else {
				toast.success(type === "s3" ? "S3 connection added" : "R2 connection added");
				router.push("/dashboard");
				router.refresh();
			}
		} catch (_error) { toast.error("Something went wrong. Please try again."); }
		finally { setLoading(false); }
	}

	return (
		<Card className="w-full shadow-lg border-muted/40">
			<CardHeader className="space-y-1">
				<div className="flex items-center gap-2 mb-2">
					<div className="p-2 bg-primary/10 rounded-full text-primary"><ShieldCheck size={24} /></div>
					<CardTitle className="text-2xl">New Connection</CardTitle>
				</div>
				<CardDescription>Choose the provider type and enter your credentials. They will be encrypted and stored in a secure, HTTP-only cookie.</CardDescription>
			</CardHeader>
			<form onSubmit={onSubmit}>
				<CardContent className="space-y-6">
					<div className="space-y-3">
						<Label>Provider Type</Label>
						<div className="grid grid-cols-2 gap-4">
							<button type="button" onClick={() => setType("s3")}
								className={cn("flex flex-col items-center gap-3 p-4 rounded-xl border-2 transition-all", type === "s3" ? "border-orange-500 bg-orange-500/5" : "border-border/40 hover:border-border")}>
								<div className={cn("p-3 rounded-lg transition-colors", type === "s3" ? "bg-orange-500 text-white" : "bg-muted text-muted-foreground")}><HardDrive size={24} /></div>
								<span className="font-medium text-sm">Amazon S3</span>
							</button>
							<button type="button" onClick={() => setType("r2")}
								className={cn("flex flex-col items-center gap-3 p-4 rounded-xl border-2 transition-all", type === "r2" ? "border-blue-500 bg-blue-500/5" : "border-border/40 hover:border-border")}>
								<div className={cn("p-3 rounded-lg transition-colors", type === "r2" ? "bg-blue-500 text-white" : "bg-muted text-muted-foreground")}><Globe size={24} /></div>
								<span className="font-medium text-sm">Cloudflare R2</span>
							</button>
						</div>
					</div>
					<div className="space-y-2"><Label htmlFor="name">Connection Name</Label><Input id="name" name="name" placeholder={type === "s3" ? "e.g. Production S3" : "e.g. Media R2"} required /></div>
					<div className="space-y-2"><Label htmlFor="accessKeyId">Access Key ID</Label><Input id="accessKeyId" name="accessKeyId" placeholder={type === "s3" ? "AKIA..." : "R2 Access Key"} required autoComplete="off" /></div>
					<div className="space-y-2"><Label htmlFor="secretAccessKey">Secret Access Key</Label><Input id="secretAccessKey" name="secretAccessKey" type="password" placeholder="wJalrXUt...EXAMPLEKEY" required autoComplete="off" /></div>
					<div className="grid grid-cols-1 md:grid-cols-2 gap-4">
						<div className="space-y-2"><Label htmlFor="region">Region</Label><Input id="region" name="region" placeholder="us-east-1" defaultValue="us-east-1" /></div>
						<div className="space-y-2"><Label htmlFor="bucket">Bucket (optional)</Label><Input id="bucket" name="bucket" placeholder="Leave blank to browse all" /></div>
					</div>
					{type === "r2" && (
						<div className="space-y-2">
							<Label htmlFor="endpoint">R2 Endpoint</Label>
							<Input id="endpoint" name="endpoint" placeholder="https://<accountid>.r2.cloudflarestorage.com" />
							<p className="text-xs text-muted-foreground">Your R2 endpoint URL from the Cloudflare dashboard. Required for R2 connections.</p>
						</div>
					)}
				</CardContent>
				<div className="px-6 pb-6">
					<Button className="w-full" type="submit" disabled={loading}>
						{loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
						{type === "s3" ? "Connect S3" : "Connect R2"}
					</Button>
				</div>
			</form>
		</Card>
	);
}
