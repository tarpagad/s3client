import { Cloud, Search } from "lucide-react";
import Link from "next/link";
import { redirect } from "next/navigation";
import { getS3Credentials } from "@/actions/auth-actions";
import { DisconnectButton } from "@/components/s3/disconnect-button";
import { SidebarNav } from "@/components/s3/sidebar-nav";
import { Input } from "@/components/ui/input";

export default async function DashboardLayout({
	children,
}: {
	children: React.ReactNode;
}) {
	const credentials = await getS3Credentials();

	if (!credentials) {
		redirect("/");
	}

	return (
		<div className="flex h-screen bg-background overflow-hidden">
			{/* Sidebar */}
			<aside className="w-64 border-r border-border/40 bg-card/30 hidden md:flex flex-col">
				<div className="p-6">
					<div className="flex items-center gap-2 font-bold text-xl tracking-tight">
						<div className="bg-primary text-primary-foreground p-1 rounded">
							<Cloud size={20} />
						</div>
						<span>S3 Client</span>
					</div>
				</div>

				<nav className="flex-1 px-4 space-y-2">
					<SidebarNav />
				</nav>

				<div className="p-4 border-t border-border/40">
					<DisconnectButton />
				</div>
			</aside>

			{/* Main Content */}
			<div className="flex-1 flex flex-col min-w-0 overflow-hidden">
				{/* Top Header */}
				<header className="h-16 border-b border-border/40 flex items-center justify-between px-6 bg-card/10">
					<div className="flex items-center gap-4 flex-1 max-w-md">
						<div className="relative w-full">
							<Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
							<Input
								type="search"
								placeholder="Search buckets or files..."
								className="pl-9 bg-muted/50 border-none focus-visible:ring-1 focus-visible:ring-primary/20 h-9"
							/>
						</div>
					</div>
					<div className="flex items-center gap-4">
						<div className="w-8 h-8 rounded-full bg-linear-to-br from-primary to-primary/50 flex items-center justify-center text-[10px] font-bold text-primary-foreground shadow-sm">
							AWS
						</div>
					</div>
				</header>

				{/* Viewport */}
				<main className="flex-1 overflow-y-auto p-6 bg-[radial-gradient(circle_at_center,var(--tw-gradient-stops))] from-primary/2 via-transparent to-transparent">
					{children}
				</main>
			</div>
		</div>
	);
}
