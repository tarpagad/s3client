"use client";

import { Loader2, ShieldCheck } from "lucide-react";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { toast } from "sonner";
import { z } from "zod";
import { saveS3Credentials } from "@/actions/auth-actions";
import { Button } from "@/components/ui/button";
import {
	Card,
	CardContent,
	CardDescription,
	CardFooter,
	CardHeader,
	CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { s3CredentialsSchema } from "@/lib/types";

export function ConnectForm() {
	const router = useRouter();
	const [loading, setLoading] = useState(false);

	async function onSubmit(event: React.FormEvent<HTMLFormElement>) {
		event.preventDefault();
		setLoading(true);

		const formData = new FormData(event.currentTarget);
		const data = {
			accessKeyId: formData.get("accessKeyId") as string,
			secretAccessKey: formData.get("secretAccessKey") as string,
			region: (formData.get("region") as string) || "us-east-1",
		};

		// Client-side validation
		const result = s3CredentialsSchema.safeParse(data);
		if (!result.success) {
			toast.error(result.error.errors[0].message);
			setLoading(false);
			return;
		}

		try {
			const response = await saveS3Credentials(data);

			if (response.error) {
				toast.error(response.error);
			} else {
				toast.success("Credentials saved securely");
				router.refresh();
				router.push("/dashboard"); // Redirect to dashboard
			}
		} catch (error) {
			toast.error("Something went wrong. Please try again.");
		} finally {
			setLoading(false);
		}
	}

	return (
		<Card className="w-full max-w-md mx-auto shadow-lg border-muted/40">
			<CardHeader className="space-y-1">
				<div className="flex items-center gap-2 mb-2">
					<div className="p-2 bg-primary/10 rounded-full text-primary">
						<ShieldCheck size={24} />
					</div>
					<CardTitle className="text-2xl">Connect S3</CardTitle>
				</div>
				<CardDescription>
					Enter your AWS S3 credentials. They will be encrypted and stored in a
					secure, HTTP-only cookie. We do not store your keys in any database.
				</CardDescription>
			</CardHeader>
			<form onSubmit={onSubmit}>
				<CardContent className="space-y-4">
					<div className="space-y-2">
						<Label htmlFor="accessKeyId">Access Key ID</Label>
						<Input
							id="accessKeyId"
							name="accessKeyId"
							placeholder="AKIA..."
							required
							autoComplete="off"
						/>
					</div>
					<div className="space-y-2">
						<Label htmlFor="secretAccessKey">Secret Access Key</Label>
						<Input
							id="secretAccessKey"
							name="secretAccessKey"
							type="password"
							placeholder="wJalrXUtnFEMI/K7MDENG/bPxRfiCYEXAMPLEKEY"
							required
							autoComplete="off"
						/>
					</div>
					<div className="space-y-2">
						<Label htmlFor="region">Region</Label>
						<Input
							id="region"
							name="region"
							placeholder="us-east-1"
							defaultValue="us-east-1"
						/>
					</div>
				</CardContent>
				<CardFooter>
					<Button className="w-full" type="submit" disabled={loading}>
						{loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
						Connect Securely
					</Button>
				</CardFooter>
			</form>
		</Card>
	);
}
