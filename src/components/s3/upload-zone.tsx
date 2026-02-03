"use client";

import { File as FileIcon, Loader2, Upload, X } from "lucide-react";
import { useRef, useState } from "react";
import { toast } from "sonner";
import { uploadFile } from "@/actions/s3-actions";
import { Button } from "@/components/ui/button";

interface UploadZoneProps {
	bucketName: string;
	prefix: string;
	onSuccess: () => void;
}

export function UploadZone({ bucketName, prefix, onSuccess }: UploadZoneProps) {
	const [isUploading, setIsUploading] = useState(false);
	const [isDragActive, setIsDragActive] = useState(false);
	const [selectedFile, setSelectedFile] = useState<File | null>(null);
	const fileInputRef = useRef<HTMLInputElement>(null);

	function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
		const file = e.target.files?.[0];
		if (file) setSelectedFile(file);
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
		const file = e.dataTransfer.files?.[0];
		if (file) setSelectedFile(file);
	}

	async function handleUpload() {
		if (!selectedFile) return;

		setIsUploading(true);
		const formData = new FormData();
		formData.append("file", selectedFile);

		const key = prefix + selectedFile.name;

		try {
			const result = await uploadFile(bucketName, key, formData);
			if (result.success) {
				toast.success("File uploaded successfully");
				setSelectedFile(null);
				onSuccess();
			} else {
				toast.error(result.error || "Upload failed");
			}
		} catch (_error) {
			toast.error("An unexpected error occurred during upload");
		} finally {
			setIsUploading(false);
		}
	}

	return (
		<div className="space-y-4">
			<div
				onDragOver={onDragOver}
				onDragLeave={onDragLeave}
				onDrop={onDrop}
				onKeyDown={(e) => {
					if (e.key === "Enter" || e.key === " ") fileInputRef.current?.click();
				}}
				role="button"
				tabIndex={0}
				className={`
          border-2 border-dashed rounded-2xl p-8 transition-all flex flex-col items-center justify-center space-y-4
          ${isDragActive ? "border-primary bg-primary/5 scale-[1.01]" : "border-border/60 hover:border-border hover:bg-muted/30"}
          ${selectedFile ? "bg-primary/5 border-primary/40" : ""}
        `}
			>
				<input
					type="file"
					className="hidden"
					ref={fileInputRef}
					onChange={handleFileChange}
				/>

				{selectedFile ? (
					<div className="flex flex-col items-center space-y-4 w-full">
						<div className="bg-primary/10 p-4 rounded-xl text-primary relative">
							<FileIcon size={40} />
							<button
								type="button"
								onClick={() => setSelectedFile(null)}
								className="absolute -top-2 -right-2 bg-destructive text-destructive-foreground rounded-full p-1 shadow-lg hover:scale-110 transition-transform"
							>
								<X size={14} />
							</button>
						</div>
						<div className="text-center">
							<p className="font-semibold truncate max-w-[250px]">
								{selectedFile.name}
							</p>
							<p className="text-xs text-muted-foreground">
								{(selectedFile.size / 1024 / 1024).toFixed(2)} MB
							</p>
						</div>
						<div className="flex gap-3 w-full max-w-xs">
							<Button
								variant="ghost"
								className="flex-1"
								onClick={() => setSelectedFile(null)}
								disabled={isUploading}
								type="button"
							>
								Clear
							</Button>
							<Button
								className="flex-1"
								onClick={handleUpload}
								disabled={isUploading}
								type="button"
							>
								{isUploading ? (
									<Loader2 className="animate-spin" size={18} />
								) : (
									<>
										<Upload size={18} className="mr-2" />
										Upload
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
							<p className="font-medium">Click or drag file to upload</p>
							<p className="text-xs text-muted-foreground">
								Any file up to 50MB (Server limit)
							</p>
						</div>
						<Button
							variant="outline"
							size="sm"
							onClick={() => fileInputRef.current?.click()}
						>
							Select File
						</Button>
					</>
				)}
			</div>
		</div>
	);
}
