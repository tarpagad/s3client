"use client";

import { Loader2 } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";
import { renameObject } from "@/actions/s3-actions";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

interface RenameDialogProps {
	bucketName: string;
	oldKey: string;
	onClose: () => void;
	onSuccess: () => void;
}

export function RenameDialog({
	bucketName,
	oldKey,
	onClose,
	onSuccess,
}: RenameDialogProps) {
	const [newKey, setNewKey] = useState(oldKey);
	const [isRenaming, setIsRenaming] = useState(false);

	async function handleRename() {
		if (newKey === oldKey) {
			onClose();
			return;
		}

		setIsRenaming(true);
		try {
			const result = await renameObject(bucketName, oldKey, newKey);
			if (result.success) {
				toast.success("Renamed successfully");
				onSuccess();
				onClose();
			} else {
				toast.error(result.error || "Failed to rename");
			}
		} catch (_error) {
			toast.error("An unexpected error occurred");
		} finally {
			setIsRenaming(false);
		}
	}

	return (
		<div className="fixed inset-0 bg-background/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
			<div className="bg-card border border-border/40 rounded-2xl shadow-2xl w-full max-w-md p-6 animate-in zoom-in-95 duration-200">
				<div className="space-y-4">
					<div className="space-y-2">
						<h2 className="text-xl font-bold tracking-tight">Rename</h2>
						<p className="text-sm text-muted-foreground">
							Enter a new name for your file or folder.
						</p>
					</div>

					<div className="space-y-2">
						<Label htmlFor="newKey">New Name / Path</Label>
						<Input
							id="newKey"
							value={newKey}
							onChange={(e) => setNewKey(e.target.value)}
							placeholder="Enter new name..."
							className="h-10"
							autoFocus
						/>
					</div>

					<div className="flex justify-end gap-3 pt-2">
						<Button variant="ghost" onClick={onClose} disabled={isRenaming}>
							Cancel
						</Button>
						<Button
							onClick={handleRename}
							disabled={isRenaming}
							className="min-w-[80px]"
						>
							{isRenaming ? (
								<Loader2 className="animate-spin" size={16} />
							) : (
								"Rename"
							)}
						</Button>
					</div>
				</div>
			</div>
		</div>
	);
}
