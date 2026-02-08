"use client";

import { File as FileIcon, Loader2, Upload, X, CheckCircle, AlertCircle } from "lucide-react";
import { useRef, useState } from "react";
import { toast } from "sonner";
import { uploadFile } from "@/actions/s3-actions";
import { Button } from "@/components/ui/button";

interface UploadZoneProps {
	bucketName: string;
	prefix: string;
	onSuccess: () => void;
}

interface FileStatus {
	file: File;
	status: "pending" | "uploading" | "success" | "error";
	error?: string;
}

export function UploadZone({ bucketName, prefix, onSuccess }: UploadZoneProps) {
	const [isDragActive, setIsDragActive] = useState(false);
	const [files, setFiles] = useState<FileStatus[]>([]);
	const [isUploading, setIsUploading] = useState(false);
	const fileInputRef = useRef<HTMLInputElement>(null);

	function addFiles(newFiles: File[]) {
		const newFileStatuses = newFiles.map((file) => ({
			file,
			status: "pending" as const,
		}));
		setFiles((prev) => [...prev, ...newFileStatuses]);
	}

	function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
		if (e.target.files && e.target.files.length > 0) {
			addFiles(Array.from(e.target.files));
		}
		// Reset input value so same files can be selected again if needed
		if (fileInputRef.current) {
			fileInputRef.current.value = "";
		}
	}

	function onDragOver(e: React.DragEvent) {
		e.preventDefault();
		setIsDragActive(true);
	}

	function onDragLeave() {
		setIsDragActive(false);
	}

	function onDrop(e: React.DragEvent) {
		e.preventDefault();
		setIsDragActive(false);
		if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
			addFiles(Array.from(e.dataTransfer.files));
		}
	}

	function removeFile(index: number) {
		setFiles((prev) => prev.filter((_, i) => i !== index));
	}

	async function handleUpload() {
		if (files.length === 0) return;

		setIsUploading(true);
		let successCount = 0;
		let failCount = 0;

		const uploadedFiles = [...files];

		// Upload sequentially to avoid overwhelming server or hitting limits
		for (let i = 0; i < uploadedFiles.length; i++) {
			const fileStatus = uploadedFiles[i];
			if (fileStatus.status === "success") continue; // Skip already uploaded

			// Update status to uploading
			uploadedFiles[i] = { ...fileStatus, status: "uploading" };
			setFiles([...uploadedFiles]);

			const formData = new FormData();
			formData.append("file", fileStatus.file);
			const key = prefix + fileStatus.file.name;

			try {
				const result = await uploadFile(bucketName, key, formData);
				if (result.success) {
					uploadedFiles[i] = { ...fileStatus, status: "success" };
					successCount++;
				} else {
					uploadedFiles[i] = {
						...fileStatus,
						status: "error",
						error: result.error || "Upload failed",
					};
					failCount++;
				}
			} catch (error) {
				uploadedFiles[i] = {
					...fileStatus,
					status: "error",
					error: "Network error",
				};
				failCount++;
			}
			setFiles([...uploadedFiles]);
		}

		setIsUploading(false);

		if (successCount > 0) {
			toast.success(
				`Uploaded ${successCount} file${successCount !== 1 ? "s" : ""}`,
			);
			onSuccess();
			// Clear successful uploads after a delay? Or just keep them visible?
			// For now, let's remove successful ones so user can see failures or upload more
			setTimeout(() => {
				setFiles((prev) => prev.filter((f) => f.status !== "success"));
			}, 2000);
		}

		if (failCount > 0) {
			toast.error(`Failed to upload ${failCount} file${failCount !== 1 ? "s" : ""}`);
		}
	}

	return (
		<div className="space-y-4">
			<div
				onDragOver={onDragOver}
				onDragLeave={onDragLeave}
				onDrop={onDrop}
				className={`
          border-2 border-dashed rounded-2xl p-8 transition-all flex flex-col items-center justify-center space-y-4
          ${isDragActive ? "border-primary bg-primary/5 scale-[1.01]" : "border-border/60 hover:border-border hover:bg-muted/30"}
          ${files.length > 0 ? "bg-primary/5 border-primary/40" : ""}
        `}
			>
				<input
					type="file"
					multiple
					className="hidden"
					ref={fileInputRef}
					onChange={handleFileChange}
				/>

				{files.length > 0 ? (
					<div className="flex flex-col items-center space-y-4 w-full">
						<div className="w-full max-h-[300px] overflow-y-auto space-y-2 pr-2">
							{files.map((fileStatus, index) => (
								<div
									key={`${fileStatus.file.name}-${index}`}
									className="flex items-center justify-between bg-background/50 p-3 rounded-lg border text-sm"
								>
									<div className="flex items-center gap-3 overflow-hidden">
										<div className="p-2 bg-primary/10 rounded-md text-primary">
											<FileIcon size={16} />
										</div>
										<div className="flex flex-col min-w-0">
											<span className="font-medium truncate">{fileStatus.file.name}</span>
											<span className="text-xs text-muted-foreground">
												{(fileStatus.file.size / 1024 / 1024).toFixed(2)} MB
												{fileStatus.error && (
													<span className="text-destructive ml-2">
														- {fileStatus.error}
													</span>
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
										{fileStatus.status !== "uploading" && (
											<button
												type="button"
												onClick={() => removeFile(index)}
												className="text-muted-foreground hover:text-destructive transition-colors p-1"
											>
												<X size={16} />
											</button>
										)}
									</div>
								</div>
							))}
						</div>

						<div className="flex gap-3 w-full max-w-xs">
							<Button
								variant="ghost"
								className="flex-1"
								onClick={() => setFiles([])}
								disabled={isUploading}
								type="button"
							>
								Clear All
							</Button>
							<Button
								className="flex-1"
								onClick={handleUpload}
								disabled={isUploading || files.some((f) => f.status === "uploading")}
								type="button"
							>
								{isUploading ? (
									<Loader2 className="animate-spin" size={18} />
								) : (
									<>
										<Upload size={18} className="mr-2" />
										Upload {files.filter(f => f.status === 'pending').length > 0 ? `(${files.filter(f => f.status === 'pending').length})` : ''}
									</>
								)}
							</Button>
						</div>
					</div>
				) : (
					<>
						<div className="bg-muted p-4 rounded-full text-muted-foreground group-hover:text-primary transition-colors">
							<Upload size={32} />
						</div>
						<div className="text-center space-y-1">
							<p className="font-medium">Click or drag files to upload</p>
							<p className="text-xs text-muted-foreground">
								Multiple files supported (Max 50MB per file)
							</p>
						</div>
						<Button
							variant="outline"
							size="sm"
							onClick={() => fileInputRef.current?.click()}
						>
							Select Files
						</Button>
					</>
				)}
			</div>
		</div>
	);
}
