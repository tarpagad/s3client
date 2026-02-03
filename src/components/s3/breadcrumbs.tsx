"use client";

import { ChevronRight, Home } from "lucide-react";
import { cn } from "@/lib/utils";

interface BreadcrumbsProps {
	bucketName: string;
	prefix: string;
	onNavigate: (prefix: string) => void;
}

export function Breadcrumbs({
	bucketName,
	prefix,
	onNavigate,
}: BreadcrumbsProps) {
	const parts = prefix.split("/").filter(Boolean);

	return (
		<nav className="flex items-center space-x-1 text-sm text-muted-foreground mb-6 overflow-hidden">
			<button
				type="button"
				onClick={() => onNavigate("")}
				className="flex items-center hover:text-foreground transition-colors"
			>
				<Home size={16} className="mr-1" />
				<span className="font-medium truncate max-w-[100px]">{bucketName}</span>
			</button>

			{parts.map((part, index) => {
				const currentPrefix = parts.slice(0, index + 1).join("/") + "/";
				return (
					<div key={currentPrefix} className="flex items-center">
						<ChevronRight size={14} className="mx-1 shrink-0 opacity-50" />
						<button
							type="button"
							onClick={() => onNavigate(currentPrefix)}
							className={cn(
								"hover:text-foreground transition-colors truncate max-w-[150px]",
								index === parts.length - 1
									? "text-foreground font-semibold"
									: "",
							)}
						>
							{part}
						</button>
					</div>
				);
			})}
		</nav>
	);
}
