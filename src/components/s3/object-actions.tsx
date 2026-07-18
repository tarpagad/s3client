"use client";

import {
	Copy,
	Download,
	Edit2,
	Eye,
	Globe,
	MoreVertical,
	Trash2,
} from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { toast } from "sonner";
import { getDownloadUrl, makePublic } from "@/actions/s3-actions";
import { Button } from "@/components/ui/button";
import type { BucketConnectionType, S3ObjectInfo } from "@/lib/types";
import { cn, getPublicObjectUrl } from "@/lib/utils";
import { PreviewModal } from "./preview-modal";
import { RenameDialog } from "./rename-dialog";

interface ObjectActionsProps {
	connectionId: string;
	bucketName: string;
	connectionType: BucketConnectionType;
	publicUrl?: string | null;
	object: S3ObjectInfo;
	onRefresh: () => void;
	onDelete: (key: string) => void;
	onRename?: (oldKey: string, newKey: string) => void;
}

export function ObjectActions({
	connectionId,
	bucketName,
	connectionType,
	publicUrl,
	object,
	onRefresh,
	onDelete,
	onRename,
}: ObjectActionsProps) {
	const [isOpen, setIsOpen] = useState(false);
	const [openUp, setOpenUp] = useState(false);
	const [showRename, setShowRename] = useState(false);
	const [showPreview, setShowPreview] = useState(false);
	const menuRef = useRef<HTMLDivElement>(null);
	const buttonRef = useRef<HTMLButtonElement>(null);

	useEffect(() => {
		function handleClickOutside(event: MouseEvent) {
			if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
				setIsOpen(false);
			}
		}
		document.addEventListener("mousedown", handleClickOutside);
		return () => document.removeEventListener("mousedown", handleClickOutside);
	}, []);

	useEffect(() => {
		if (isOpen && buttonRef.current) {
			const rect = buttonRef.current.getBoundingClientRect();
			const spaceBelow = window.innerHeight - rect.bottom;
			setOpenUp(spaceBelow < 250);
		}
	}, [isOpen]);

	async function handleDownload() {
		setIsOpen(false);
		const result = await getDownloadUrl(connectionId, bucketName, object.key);
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
		const result = await makePublic(connectionId, bucketName, object.key);
		if (result.success) {
			toast.success("Object is now public");
			onRefresh();
		} else {
			toast.error(result.error || "Failed to make public");
		}
	}

	function getPublicUrl() {
		return getPublicObjectUrl(bucketName, object.key, publicUrl);
	}

	return (
		<div className="relative" ref={menuRef}>
			<Button
				ref={buttonRef}
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
				<div
					className={cn(
						"absolute right-0 w-48 bg-card border border-border/40 rounded-xl shadow-xl z-1000 py-1 overflow-hidden animate-in fade-in duration-150",
						openUp
							? "bottom-full mb-2 slide-in-from-bottom-2"
							: "top-full mt-2 slide-in-from-top-2",
					)}
				>
					{object.type === "file" && (
						<button
							type="button"
							onClick={() => {
								setShowPreview(true);
								setIsOpen(false);
							}}
							className="w-full flex items-center gap-2 px-4 py-2 text-sm hover:bg-accent text-left transition-colors"
						>
							<Eye size={14} className="text-muted-foreground" />
							Preview
						</button>
					)}

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
					connectionId={connectionId}
					bucketName={bucketName}
					oldKey={object.key}
					onClose={() => setShowRename(false)}
					onSuccess={onRefresh}
					onOptimisticRename={onRename}
				/>
			)}

			{showPreview && (
				<PreviewModal
					connectionId={connectionId}
					bucketName={bucketName}
					object={object}
					onClose={() => setShowPreview(false)}
				/>
			)}
		</div>
	);
}
