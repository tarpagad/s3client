"use client";

import {
	Download,
	File as FileIcon,
	FileText,
	ImageIcon,
	Loader2,
	X,
} from "lucide-react";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import { getDownloadUrl, getFileContent } from "@/actions/s3-actions";
import { Button } from "@/components/ui/button";
import type { S3ObjectInfo } from "@/lib/types";

interface PreviewModalProps {
	bucketName: string;
	object: S3ObjectInfo;
	onClose: () => void;
}

export function PreviewModal({
	bucketName,
	object,
	onClose,
}: PreviewModalProps) {
	const [loading, setLoading] = useState(true);
	const [downloadUrl, setDownloadUrl] = useState<string | null>(null);
	const [textContent, setTextContent] = useState<string | null>(null);
	const [previewType, setPreviewType] = useState<
		"image" | "text" | "pdf" | "other"
	>("other");

	useEffect(() => {
		async function initPreview() {
			setLoading(true);
			const ext = object.extension?.toLowerCase() || "";

			// Determine type
			if (["jpg", "jpeg", "png", "gif", "svg", "webp"].includes(ext)) {
				setPreviewType("image");
				const result = await getDownloadUrl(bucketName, object.key);
				if (result.url) setDownloadUrl(result.url);
			} else if (["pdf"].includes(ext)) {
				setPreviewType("pdf");
				const result = await getDownloadUrl(bucketName, object.key);
				if (result.url) setDownloadUrl(result.url);
			} else if (
				[
					"txt",
					"md",
					"json",
					"js",
					"ts",
					"tsx",
					"jsx",
					"css",
					"py",
					"html",
				].includes(ext)
			) {
				setPreviewType("text");
				const result = await getFileContent(bucketName, object.key);
				if (result.content) setTextContent(result.content);
				if (result.error) toast.error(result.error);
			} else {
				setPreviewType("other");
			}

			setLoading(false);
		}

		initPreview();
	}, [bucketName, object]);

	async function handleDownload() {
		const result = await getDownloadUrl(bucketName, object.key);
		if (result.url) {
			window.open(result.url, "_blank");
		} else {
			toast.error(result.error || "Failed to get download URL");
		}
	}

	return (
		<div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-background/80 backdrop-blur-sm animate-in fade-in duration-200">
			<div className="bg-card border border-border/40 rounded-2xl shadow-2xl w-full max-w-4xl max-h-[90vh] flex flex-col overflow-hidden animate-in zoom-in-95 duration-200">
				{/* Header */}
				<div className="p-4 border-b flex items-center justify-between bg-muted/30">
					<div className="flex items-center gap-3">
						<div className="p-2 bg-primary/10 rounded-lg text-primary">
							{previewType === "image" ? (
								<ImageIcon size={20} />
							) : previewType === "text" ? (
								<FileText size={20} />
							) : (
								<FileIcon size={20} />
							)}
						</div>
						<div>
							<h3 className="font-semibold text-sm truncate max-w-[200px] md:max-w-md">
								{object.name}
							</h3>
							<p className="text-[10px] text-muted-foreground uppercase tracking-widest">
								Preview Mode
							</p>
						</div>
					</div>
					<div className="flex items-center gap-2">
						<Button
							variant="outline"
							size="sm"
							className="h-8 gap-2"
							onClick={handleDownload}
							type="button"
						>
							<Download size={14} />
							Download
						</Button>
						<Button
							variant="ghost"
							size="icon"
							className="h-8 w-8 rounded-full"
							onClick={onClose}
							type="button"
						>
							<X size={18} />
						</Button>
					</div>
				</div>

				{/* Content */}
				<div className="flex-1 overflow-auto bg-muted/10 p-4 md:p-8 flex items-center justify-center min-h-[300px]">
					{loading ? (
						<div className="flex flex-col items-center gap-3">
							<Loader2 className="animate-spin text-primary" size={40} />
							<p className="text-sm text-muted-foreground">
								Loading preview...
							</p>
						</div>
					) : previewType === "image" && downloadUrl ? (
						<div className="relative group">
							{/* eslint-disable-next-line @next/next/no-img-element */}
							<img
								src={downloadUrl}
								alt={object.name}
								className="max-w-full max-h-[60vh] rounded-lg shadow-lg object-contain bg-white/5"
							/>
						</div>
					) : previewType === "pdf" && downloadUrl ? (
						<iframe
							src={downloadUrl}
							className="w-full h-[60vh] rounded-lg border shadow-sm"
							title={object.name}
						/>
					) : previewType === "text" && textContent !== null ? (
						<div className="w-full h-full bg-card/50 border rounded-lg p-4 font-mono text-sm overflow-auto max-h-[60vh] whitespace-pre-wrap selection:bg-primary/20">
							{textContent}
						</div>
					) : (
						<div className="text-center space-y-4 max-w-sm">
							<div className="w-20 h-20 bg-muted rounded-full flex items-center justify-center mx-auto text-muted-foreground/50">
								<FileIcon size={40} />
							</div>
							<div>
								<h4 className="font-medium">No preview available</h4>
								<p className="text-sm text-muted-foreground">
									We don't support online preview for this file type yet.
								</p>
							</div>
							<Button onClick={handleDownload} className="w-full" type="button">
								Download to view
							</Button>
						</div>
					)}
				</div>

				{/* Footer/Info */}
				<div className="p-3 border-t bg-muted/30 flex items-center justify-between text-[11px] text-muted-foreground">
					<div className="flex gap-4">
						<span>
							Size:{" "}
							{(object.size || 0) > 1024 * 1024
								? `${((object.size || 0) / (1024 * 1024)).toFixed(2)} MB`
								: `${((object.size || 0) / 1024).toFixed(2)} KB`}
						</span>
						<span>
							Modified:{" "}
							{object.lastModified
								? new Date(object.lastModified).toLocaleDateString()
								: "Unknown"}
						</span>
					</div>
					<div className="hidden sm:block">
						Press <kbd className="bg-muted px-1 rounded border">Esc</kbd> to
						close
					</div>
				</div>
			</div>
		</div>
	);
}
