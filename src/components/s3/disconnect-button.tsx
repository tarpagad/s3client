"use client";

import { LogOut } from "lucide-react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { removeS3Credentials } from "@/actions/auth-actions";
import { Button } from "@/components/ui/button";

export function DisconnectButton() {
	const router = useRouter();

	const handleDisconnect = async () => {
		try {
			await removeS3Credentials();
			toast.success("Disconnected from S3");
			router.push("/");
			router.refresh();
		} catch (error) {
			toast.error("Failed to disconnect");
		}
	};

	return (
		<Button
			variant="ghost"
			className="w-full justify-start gap-3 text-destructive hover:bg-destructive/10"
			onClick={handleDisconnect}
		>
			<LogOut size={18} />
			Disconnect S3
		</Button>
	);
}
