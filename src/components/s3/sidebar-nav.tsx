"use client";

import { LayoutDashboard, Settings } from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";

export function SidebarNav() {
	const pathname = usePathname();

	const routes = [
		{
			label: "Buckets",
			icon: LayoutDashboard,
			href: "/dashboard",
			active:
				pathname === "/dashboard" || pathname.startsWith("/dashboard/buckets"),
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
							"transition-colors",
							route.active
								? "text-primary-foreground"
								: "text-muted-foreground group-hover:text-foreground",
						)}
					/>
					{route.label}
				</Link>
			))}
		</div>
	);
}
