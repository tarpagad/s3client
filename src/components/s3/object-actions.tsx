"use client";

import {
	Copy,
	Download,
	Edit2,
	Globe,
	MoreVertical,
	Trash2,
} from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { toast } from "sonner";
import { getDownloadUrl, makePublic } from "@/actions/s3-actions";
import { Button } from "@/components/ui/button";
import type { S3ObjectInfo } from "@/lib/types";
import { RenameDialog } from "./rename-dialog";

interface ObjectActionsProps {
	bucketName: string;
	object: S3ObjectInfo;
	onRefresh: () => void;
	onDelete: (key: string) => void;
}

export function ObjectActions({
	bucketName,
	object,
	onRefresh,
	onDelete,
}: ObjectActionsProps) {
	const [isOpen, setIsOpen] = useState(false);
	const [showRename, setShowRename] = useState(false);
	const menuRef = useRef<HTMLDivElement>(null);

	useEffect(() => {
		function handleClickOutside(event: MouseEvent) {
			if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
				setIsOpen(false);
			}
		}
		document.addEventListener("mousedown", handleClickOutside);
		return () => document.removeEventListener("mousedown", handleClickOutside);
	}, []);

	async function handleDownload() {
		setIsOpen(false);
		const result = await getDownloadUrl(bucketName, object.key);
		if (result.url) {
			window.open(result.url, "_blank");
		} else {
			toast.error(result.error || "Failed to get download URL");
		}
	}

	function copyToClipboard(text: string) {
		navigator.clipboard.writeText(text);
		toast.success("Copied to clipboard");
		setIsOpen(false);
	}

	async function handleMakePublic() {
		setIsOpen(false);
		const result = await makePublic(bucketName, object.key);
		if (result.success) {
			toast.success("Object is now public");
			onRefresh();
		} else {
			toast.error(result.error || "Failed to make public");
		}
	}

	function getPublicUrl() {
		// This depends on the S3 provider. For AWS prefix: https://BUCKET.s3.REGION.amazonaws.com/KEY
		// However, for more general usage, we can construct it if we know the endpoint.
		// For now, let's assume a standard AWS-like structure if endpoint is not set.
		// We'd ideally want to get the endpoint/region from the client config or server.
		// Simplified for now:
		return `https://${bucketName}.s3.amazonaws.com/${object.key}`;
	}

	return (
		<div className="relative" ref={menuRef}>
			<Button
				variant="ghost"
				size="icon"
				className="h-8 w-8"
				type="button"
				onClick={(e) => {
					e.stopPropagation();
					setIsOpen(!isOpen);
				}}
			>
				<MoreVertical size={16} />
			</Button>

			{isOpen && (
				<div className="absolute right-0 mt-2 w-48 bg-card border border-border/40 rounded-xl shadow-xl z-50 py-1 overflow-hidden animate-in fade-in slide-in-from-top-2 duration-150">
					{object.type === "file" && (
						<button
							type="button"
							onClick={handleDownload}
							className="w-full flex items-center gap-2 px-4 py-2 text-sm hover:bg-accent text-left transition-colors"
						>
							<Download size={14} className="text-muted-foreground" />
							Download
						</button>
					)}

					<button
						type="button"
						onClick={() => {
							setShowRename(true);
							setIsOpen(false);
						}}
						className="w-full flex items-center gap-2 px-4 py-2 text-sm hover:bg-accent text-left transition-colors"
					>
						<Edit2 size={14} className="text-muted-foreground" />
						Rename
					</button>

					<button
						type="button"
						onClick={() => copyToClipboard(object.key)}
						className="w-full flex items-center gap-2 px-4 py-2 text-sm hover:bg-accent text-left transition-colors"
					>
						<Copy size={14} className="text-muted-foreground" />
						Copy Key
					</button>

					{!object.isPublic && object.type === "file" && (
						<button
							type="button"
							onClick={handleMakePublic}
							className="w-full flex items-center gap-2 px-4 py-2 text-sm hover:bg-accent text-left transition-colors"
						>
							<Globe size={14} className="text-muted-foreground" />
							Make Public
						</button>
					)}

					{object.isPublic && (
						<button
							type="button"
							onClick={() => copyToClipboard(getPublicUrl())}
							className="w-full flex items-center gap-2 px-4 py-2 text-sm hover:bg-accent text-left transition-colors"
						>
							<Globe size={14} className="text-muted-foreground" />
							Copy Public URL
						</button>
					)}

					<div className="h-px bg-border/40 my-1" />

					<button
						type="button"
						onClick={() => {
							onDelete(object.key);
							setIsOpen(false);
						}}
						className="w-full flex items-center gap-2 px-4 py-2 text-sm hover:bg-destructive/10 text-destructive text-left transition-colors"
					>
						<Trash2 size={14} />
						Delete
					</button>
				</div>
			)}

			{showRename && (
				<RenameDialog
					bucketName={bucketName}
					oldKey={object.key}
					onClose={() => setShowRename(false)}
					onSuccess={onRefresh}
				/>
			)}
		</div>
	);
}
