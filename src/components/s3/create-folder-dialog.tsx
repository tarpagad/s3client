"use client";

import { FolderPlus, Loader2 } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";
import { createFolder } from "@/actions/s3-actions";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

interface CreateFolderDialogProps {
	bucketName: string;
	prefix: string;
	onClose: () => void;
	onSuccess: () => void;
}

export function CreateFolderDialog({
	bucketName,
	prefix,
	onClose,
	onSuccess,
}: CreateFolderDialogProps) {
	const [folderName, setFolderName] = useState("");
	const [isCreating, setIsCreating] = useState(false);

	async function handleCreate() {
		if (!folderName.trim()) {
			toast.error("Please enter a folder name");
			return;
		}

		setIsCreating(true);
		try {
			const result = await createFolder(bucketName, prefix, folderName.trim());
			if (result.success) {
				toast.success(`Folder "${folderName}" created successfully`);
				onSuccess();
				onClose();
			} else {
				toast.error(result.error || "Failed to create folder");
			}
		} catch (_error) {
			toast.error("An unexpected error occurred");
		} finally {
			setIsCreating(false);
		}
	}

	return (
		<div className="fixed inset-0 bg-background/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
			<div className="bg-card border border-border/40 rounded-2xl shadow-2xl w-full max-w-md p-6 animate-in zoom-in-95 duration-200">
				<div className="space-y-4">
					<div className="flex items-center gap-3">
						<div className="p-2 rounded-lg bg-primary/10 text-primary">
							<FolderPlus size={24} />
						</div>
						<div className="space-y-1">
							<h2 className="text-xl font-bold tracking-tight">New Folder</h2>
							<p className="text-sm text-muted-foreground">
								Create a new folder in{" "}
								<span className="font-mono text-xs bg-muted px-1 py-0.5 rounded">
									{prefix || "/"}
								</span>
							</p>
						</div>
					</div>

					<div className="space-y-2">
						<Label htmlFor="folderName">Folder Name</Label>
						<Input
							id="folderName"
							value={folderName}
							onChange={(e) => setFolderName(e.target.value)}
							placeholder="e.g. documents, images, backup"
							className="h-10"
							autoFocus
							onKeyDown={(e) => {
								if (e.key === "Enter") handleCreate();
								if (e.key === "Escape") onClose();
							}}
						/>
						<p className="text-[10px] text-muted-foreground italic">
							Avoid using special characters: \ ^ ` &gt; &lt; &#123; &#125; [ ]
							# % ~ | /
						</p>
					</div>

					<div className="flex justify-end gap-3 pt-2">
						<Button variant="ghost" onClick={onClose} disabled={isCreating}>
							Cancel
						</Button>
						<Button
							onClick={handleCreate}
							disabled={isCreating || !folderName.trim()}
							className="min-w-[100px] gap-2"
						>
							{isCreating ? (
								<Loader2 className="animate-spin" size={16} />
							) : (
								<>Create Folder</>
							)}
						</Button>
					</div>
				</div>
			</div>
		</div>
	);
}
