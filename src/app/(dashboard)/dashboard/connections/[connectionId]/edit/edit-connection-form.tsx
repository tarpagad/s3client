"use client";
import { Loader2, ShieldCheck } from "lucide-react";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { toast } from "sonner";
import { updateConnection } from "@/actions/credentials-actions";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import type { ConnectionInfo } from "@/lib/types";

interface EditConnectionFormProps { connection: ConnectionInfo; }

export function EditConnectionForm({ connection }: EditConnectionFormProps) {
	const router = useRouter();
	const [loading, setLoading] = useState(false);

	async function onSubmit(event: React.FormEvent<HTMLFormElement>) {
		event.preventDefault();
		setLoading(true);
		const formData = new FormData(event.currentTarget);
		const accessKeyId = formData.get("accessKeyId") as string;
		const secretAccessKey = formData.get("secretAccessKey") as string;
		const publicUrl = formData.get("publicUrl") as string;
		const data = {
			name: formData.get("name") as string,
			region: (formData.get("region") as string) || "us-east-1",
			endpoint: (formData.get("endpoint") as string) || undefined,
			bucket: (formData.get("bucket") as string) || undefined,
			publicUrl: publicUrl || undefined,
			...(accessKeyId ? { accessKeyId } : {}),
			...(secretAccessKey ? { secretAccessKey } : {}),
		};
		try {
			const response = await updateConnection(connection.id, data);
			if (response.error) { toast.error(response.error); }
			else { toast.success("Connection updated successfully"); router.push(`/dashboard/connections/${connection.id}`); router.refresh(); }
		} catch (_error) { toast.error("Something went wrong. Please try again."); }
		finally { setLoading(false); }
	}

	const isR2 = connection.type === "r2";

	return (
		<Card className="w-full shadow-lg border-muted/40">
			<CardHeader className="space-y-1">
				<div className="flex items-center gap-2 mb-2">
					<div className="p-2 bg-primary/10 rounded-full text-primary"><ShieldCheck size={24} /></div>
					<CardTitle className="text-2xl">{isR2 ? "R2" : "S3"} Connection</CardTitle>
				</div>
				<CardDescription>Leave the credential fields blank to keep the existing values.</CardDescription>
			</CardHeader>
			<form onSubmit={onSubmit}>
				<CardContent className="space-y-6">
					<div className="space-y-2"><Label htmlFor="name">Connection Name</Label><Input id="name" name="name" defaultValue={connection.name} required /></div>
					<div className="space-y-2"><Label htmlFor="accessKeyId">Access Key ID</Label><Input id="accessKeyId" name="accessKeyId" placeholder="Leave blank to keep current" autoComplete="off" /></div>
					<div className="space-y-2"><Label htmlFor="secretAccessKey">Secret Access Key</Label><Input id="secretAccessKey" name="secretAccessKey" type="password" placeholder="Leave blank to keep current" autoComplete="off" /></div>
					<div className="grid grid-cols-1 md:grid-cols-2 gap-4">
						<div className="space-y-2"><Label htmlFor="region">Region</Label><Input id="region" name="region" defaultValue={connection.region} placeholder="us-east-1" /></div>
						<div className="space-y-2"><Label htmlFor="bucket">Bucket</Label><Input id="bucket" name="bucket" defaultValue={connection.bucket || ""} placeholder="Leave blank to browse all" /></div>
					</div>
					<div className="space-y-2">
						<Label htmlFor="endpoint">Endpoint</Label>
						<Input id="endpoint" name="endpoint" defaultValue={connection.endpoint || ""} placeholder={isR2 ? "https://<accountid>.r2.cloudflarestorage.com" : "Optional custom endpoint"} />
						{isR2 && <p className="text-xs text-muted-foreground">Your R2 endpoint URL from the Cloudflare dashboard.</p>}
					</div>
					<div className="space-y-2">
						<Label htmlFor="publicUrl">Public URL (optional)</Label>
						<Input id="publicUrl" name="publicUrl" defaultValue={connection.publicUrl || ""} placeholder={isR2 ? "https://pub-<bucketid>.r2.dev" : "https://my-bucket.example.com"} />
						<p className="text-xs text-muted-foreground">Base URL for public object links. If set, this will be used instead of the default S3 domain.</p>
					</div>
				</CardContent>
				<div className="px-6 pb-6">
					<Button className="w-full" type="submit" disabled={loading}>
						{loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}Save Changes
					</Button>
				</div>
			</form>
		</Card>
	);
}
