"use client";

import { Loader2, LogIn } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { toast } from "sonner";
import { authClient } from "@/lib/auth-client";
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

export function SignInForm() {
	const router = useRouter();
	const [loading, setLoading] = useState(false);

	async function onSubmit(event: React.FormEvent<HTMLFormElement>) {
		event.preventDefault();
		setLoading(true);

		const formData = new FormData(event.currentTarget);
		const email = formData.get("email") as string;
		const password = formData.get("password") as string;

		try {
			const { error } = await authClient.signIn.email({ email, password });

			if (error) {
				toast.error(error.message || "Invalid email or password");
			} else {
				toast.success("Signed in successfully");
				router.push("/dashboard");
				router.refresh();
			}
		} catch (_err) {
			toast.error("Something went wrong. Please try again.");
		} finally {
			setLoading(false);
		}
	}

	return (
		<Card className="w-full max-w-md shadow-xl border-muted/40">
			<CardHeader className="space-y-1 text-center">
				<div className="flex justify-center mb-2">
					<div className="p-3 bg-primary/10 rounded-full text-primary">
						<LogIn size={28} />
					</div>
				</div>
				<CardTitle className="text-2xl">Welcome back</CardTitle>
				<CardDescription>
					Sign in to your account to manage your buckets
				</CardDescription>
			</CardHeader>
			<form onSubmit={onSubmit}>
				<CardContent className="space-y-4">
					<div className="space-y-2">
						<Label htmlFor="email">Email</Label>
						<Input
							id="email"
							name="email"
							type="email"
							placeholder="you@example.com"
							required
							autoComplete="email"
						/>
					</div>
					<div className="space-y-2">
						<Label htmlFor="password">Password</Label>
						<Input
							id="password"
							name="password"
							type="password"
							placeholder="••••••••"
							required
							autoComplete="current-password"
						/>
					</div>
				</CardContent>
				<CardFooter className="flex flex-col gap-4">
					<Button className="w-full" type="submit" disabled={loading}>
						{loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
						Sign In
					</Button>
					<p className="text-sm text-muted-foreground text-center">
						Don&apos;t have an account?{" "}
						<Link
							href="/sign-up"
							className="text-primary hover:underline font-medium"
						>
							Sign up
						</Link>
					</p>
				</CardFooter>
			</form>
		</Card>
	);
}
