import { Cloud, Search } from "lucide-react";
import { SidebarNav } from "@/components/s3/sidebar-nav";
import { ThemeToggle } from "@/components/theme-toggle";
import { Input } from "@/components/ui/input";
import { listConnections } from "@/actions/credentials-actions";

export default async function DashboardLayout({ children }: { children: React.ReactNode }) {
	const connections = await listConnections();

	return (
		<div className="flex h-screen bg-background overflow-hidden">
			<aside className="w-64 border-r border-border/40 bg-card/30 hidden md:flex flex-col">
				<div className="p-6">
					<div className="flex items-center gap-2 font-bold text-xl tracking-tight">
						<div className="bg-primary text-primary-foreground p-1 rounded"><Cloud size={20} /></div>
						<span>S3 Client</span>
					</div>
				</div>
				<nav className="flex-1 px-4 space-y-2">
					<SidebarNav connections={connections} />
				</nav>
				<div className="p-4 border-t border-border/40">
					<p className="text-xs text-muted-foreground text-center">Credentials encrypted in browser</p>
				</div>
			</aside>
			<div className="flex-1 flex flex-col min-w-0 overflow-hidden">
				<header className="h-16 border-b border-border/40 flex items-center justify-between px-6 bg-card/10">
					<div className="flex items-center gap-4 flex-1 max-w-md">
						<div className="relative w-full">
							<Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
							<Input type="search" placeholder="Search buckets or files..." className="pl-9 bg-muted/50 border-none focus-visible:ring-1 focus-visible:ring-primary/20 h-9" />
						</div>
					</div>
					<div className="flex items-center gap-4">
						<ThemeToggle />
					</div>
				</header>
				<main className="flex-1 overflow-y-auto p-6 bg-[radial-gradient(circle_at_center,var(--tw-gradient-stops))] from-primary/2 via-transparent to-transparent">
					{children}
				</main>
			</div>
		</div>
	);
}
