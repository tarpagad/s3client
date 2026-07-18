"use client";

import { LayoutDashboard, Settings, Plus, Database, Globe } from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";
import type { ConnectionInfo } from "@/lib/types";

interface SidebarNavProps {
	connections: ConnectionInfo[];
}

export function SidebarNav({ connections }: SidebarNavProps) {
	const pathname = usePathname();

	const routes = [
		{
			label: "Connections",
			icon: LayoutDashboard,
			href: "/dashboard",
			active:
				pathname === "/dashboard" || pathname.startsWith("/dashboard/connections"),
		},
		{
			label: "Add Connection",
			icon: Plus,
			href: "/dashboard/connections/new",
			active: pathname === "/dashboard/connections/new",
		},
		{
			label: "Settings",
			icon: Settings,
			href: "/dashboard/settings",
			active: pathname === "/dashboard/settings",
		},
	];

	return (
		<div className="space-y-1">
			{routes.map((route) => (
				<Link
					key={route.href}
					href={route.href}
					className={cn(
						"flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium transition-colors group",
						route.active
							? "bg-primary text-primary-foreground shadow-sm"
							: "text-muted-foreground hover:text-foreground hover:bg-muted",
					)}
				>
					<route.icon
						size={18}
						className={cn(
							"transition-colors shrink-0",
							route.active
								? "text-primary-foreground"
								: "text-muted-foreground group-hover:text-foreground",
						)}
					/>
					{route.label}
				</Link>
			))}

			{connections.length > 0 && (
				<>
					<div className="pt-4 pb-1.5">
						<p className="px-3 text-xs font-semibold uppercase tracking-wider text-muted-foreground/60">
							Connected
						</p>
					</div>
					{connections.map((conn) => {
						const href = `/dashboard/connections/${conn.id}`;
						const isActive =
							pathname === href ||
							pathname.startsWith(`${href}/`);
						return (
							<Link
								key={conn.id}
								href={href}
								className={cn(
									"flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium transition-colors group",
									isActive
										? "bg-primary/10 text-primary font-semibold"
										: "text-muted-foreground hover:text-foreground hover:bg-muted",
								)}
							>
								{conn.type === "r2" ? (
									<Globe
										size={18}
										className={cn(
											"transition-colors shrink-0",
											isActive
												? "text-primary"
												: "text-muted-foreground group-hover:text-foreground",
										)}
									/>
								) : (
									<Database
										size={18}
										className={cn(
											"transition-colors shrink-0",
											isActive
												? "text-primary"
												: "text-muted-foreground group-hover:text-foreground",
										)}
									/>
								)}
								<span className="truncate">{conn.name}</span>
							</Link>
						);
					})}
				</>
			)}
		</div>
	);
}
