"use client";

import { LogOut } from "lucide-react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { authClient } from "@/lib/auth-client";
import { Button } from "@/components/ui/button";

export function SignOutButton() {
	const router = useRouter();

	const handleSignOut = async () => {
		try {
			await authClient.signOut();
			toast.success("Signed out");
			router.push("/");
			router.refresh();
		} catch (_error) {
			toast.error("Failed to sign out");
		}
	};

	return (
		<Button
			variant="ghost"
			className="w-full justify-start gap-3 text-destructive hover:bg-destructive/10"
			onClick={handleSignOut}
		>
			<LogOut size={18} />
			Sign Out
		</Button>
	);
}
