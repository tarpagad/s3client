"use client";

import { AlertCircle, CheckCircle, File as FileIcon, Loader2, Upload, X } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";
import { uploadFile } from "@/actions/s3-actions";
import { Button } from "@/components/ui/button";

interface FileStatus {
	file: File;
	status: "pending" | "uploading" | "success" | "error";
	error?: string;
}

interface ConfirmUploadDialogProps {
	bucketName: string;
	prefix: string;
	files: File[];
	onClose: () => void;
	onSuccess: () => void;
}

export function ConfirmUploadDialog({
	bucketName,
	prefix,
	files: initialFiles,
	onClose,
	onSuccess,
}: ConfirmUploadDialogProps) {
	const [files, setFiles] = useState<FileStatus[]>(
		initialFiles.map((file) => ({ file, status: "pending" }))
	);
	const [isUploading, setIsUploading] = useState(false);
	const [isPublic, setIsPublic] = useState(true);

	async function handleUpload() {
		setIsUploading(true);
		let successCount = 0;
		let failCount = 0;

		const updatedFiles = [...files];

		for (let i = 0; i < updatedFiles.length; i++) {
			const fileStatus = updatedFiles[i];
			if (fileStatus.status === "success") continue;

			updatedFiles[i] = { ...fileStatus, status: "uploading" };
			setFiles([...updatedFiles]);

			const formData = new FormData();
			formData.append("file", fileStatus.file);
			const key = prefix + fileStatus.file.name;

			try {
				const result = await uploadFile(bucketName, key, formData, isPublic);
				if (result.success) {
					updatedFiles[i] = { ...fileStatus, status: "success" };
					successCount++;
				} else {
					updatedFiles[i] = {
						...fileStatus,
						status: "error",
						error: result.error || "Upload failed",
					};
					failCount++;
				}
			} catch (error) {
				updatedFiles[i] = {
					...fileStatus,
					status: "error",
					error: "Network error",
				};
				failCount++;
			}
			setFiles([...updatedFiles]);
		}

		setIsUploading(false);

		if (successCount > 0) {
			toast.success(`Uploaded ${successCount} file${successCount !== 1 ? "s" : ""}`);
			onSuccess();
			// If all succeeded, close after a short delay
			if (failCount === 0) {
				setTimeout(onClose, 1500);
			}
		}

		if (failCount > 0) {
			toast.error(`Failed to upload ${failCount} file${failCount !== 1 ? "s" : ""}`);
		}
	}

	return (
		<div className="fixed inset-0 bg-background/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
			<div className="bg-card border border-border/40 rounded-2xl shadow-2xl w-full max-w-lg p-6 animate-in zoom-in-95 duration-200">
				<div className="space-y-4">
					<div className="flex items-center justify-between">
						<div className="flex items-center gap-3">
							<div className="p-2 rounded-lg bg-primary/10 text-primary">
								<Upload size={24} />
							</div>
							<div className="space-y-1">
								<h2 className="text-xl font-bold tracking-tight">Confirm Upload</h2>
								<p className="text-sm text-muted-foreground">
									Uploading to <span className="font-mono text-xs bg-muted px-1 py-0.5 rounded">{prefix || "/"}</span>
								</p>
							</div>
						</div>
						<Button variant="ghost" size="icon" onClick={onClose} disabled={isUploading}>
							<X size={20} />
						</Button>
					</div>

					<div className="max-h-[300px] overflow-y-auto space-y-2 pr-2">
						{files.map((fileStatus, index) => (
							<div
								key={`${fileStatus.file.name}-${index}`}
								className="flex items-center justify-between bg-muted/30 p-3 rounded-lg border text-sm"
							>
								<div className="flex items-center gap-3 overflow-hidden">
									<div className="p-2 bg-primary/10 rounded-md text-primary shrink-0">
										<FileIcon size={16} />
									</div>
									<div className="flex flex-col min-w-0">
										<span className="font-medium truncate">{fileStatus.file.name}</span>
										<span className="text-xs text-muted-foreground">
											{(fileStatus.file.size / 1024 / 1024).toFixed(2)} MB
											{fileStatus.error && (
												<span className="text-destructive ml-2">- {fileStatus.error}</span>
											)}
										</span>
									</div>
								</div>

								<div className="flex items-center gap-2">
									{fileStatus.status === "uploading" && (
										<Loader2 className="animate-spin text-muted-foreground" size={16} />
									)}
									{fileStatus.status === "success" && (
										<CheckCircle className="text-green-500" size={16} />
									)}
									{fileStatus.status === "error" && (
										<AlertCircle className="text-destructive" size={16} />
									)}
								</div>
							</div>
						))}
					</div>

					<div className="flex items-center space-x-2 py-2">
						<input
							type="checkbox"
							id="is-public-confirm"
							checked={isPublic}
							onChange={(e) => setIsPublic(e.target.checked)}
							disabled={isUploading}
							className="w-4 h-4 rounded border-gray-300 text-primary focus:ring-primary"
						/>
						<label htmlFor="is-public-confirm" className="text-sm font-medium cursor-pointer select-none">
							Make files public automatically
						</label>
					</div>

					<div className="flex justify-end gap-3 pt-2">
						<Button variant="ghost" onClick={onClose} disabled={isUploading}>
							Cancel
						</Button>
						<Button
							onClick={handleUpload}
							disabled={isUploading || files.every(f => f.status === 'success')}
							className="min-w-[120px] gap-2"
						>
							{isUploading ? (
								<Loader2 className="animate-spin" size={16} />
							) : (
								<>
									<Upload size={16} />
									Upload Files
								</>
							)}
						</Button>
					</div>
				</div>
			</div>
		</div>
	);
}
