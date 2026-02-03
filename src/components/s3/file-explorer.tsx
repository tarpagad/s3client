"use client";

import {
	CloudUpload,
	Code2,
	File,
	Folder,
	Grid,
	Image as ImageIcon,
	Link as LinkIcon,
	List as ListIcon,
	Loader2,
	Music,
	Plus,
	Search,
	Video,
} from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";
import { deleteObject, listObjects } from "@/actions/s3-actions";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import type { S3ObjectInfo } from "@/lib/types";
import { cn } from "@/lib/utils";
import { Breadcrumbs } from "./breadcrumbs";
import { ObjectActions } from "./object-actions";
import { UploadZone } from "./upload-zone";

interface FileExplorerProps {
	bucketName: string;
	initialObjects: S3ObjectInfo[];
}

export function FileExplorer({
	bucketName,
	initialObjects,
}: FileExplorerProps) {
	const [prefix, setPrefix] = useState("");
	const [objects, setObjects] = useState<S3ObjectInfo[]>(initialObjects);
	const [loading, setLoading] = useState(false);
	const [searchQuery, setSearchQuery] = useState("");
	const [viewMode, setViewMode] = useState<"list" | "grid">("list");
	const [showUpload, setShowUpload] = useState(false);

	const getFileIcon = (obj: S3ObjectInfo) => {
		if (obj.type === "folder")
			return <Folder className="text-primary fill-primary/10" size={18} />;

		const ext = obj.extension?.toLowerCase();
		if (["jpg", "jpeg", "png", "gif", "svg", "webp"].includes(ext || ""))
			return <ImageIcon className="text-indigo-500" size={18} />;
		if (["mp4", "webm", "mov", "avi"].includes(ext || ""))
			return <Video className="text-pink-500" size={18} />;
		if (["mp3", "wav", "ogg"].includes(ext || ""))
			return <Music className="text-amber-500" size={18} />;
		if (
			[
				"js",
				"ts",
				"tsx",
				"jsx",
				"py",
				"go",
				"rs",
				"html",
				"css",
				"json",
			].includes(ext || "")
		)
			return <Code2 className="text-blue-500" size={18} />;

		return <File className="text-muted-foreground" size={18} />;
	};

	const getFileIconLarge = (obj: S3ObjectInfo) => {
		if (obj.type === "folder")
			return <Folder size={40} className="text-primary fill-primary/10" />;

		const ext = obj.extension?.toLowerCase();
		if (["jpg", "jpeg", "png", "gif", "svg", "webp"].includes(ext || ""))
			return <ImageIcon size={40} className="text-indigo-400" />;
		if (["mp4", "webm", "mov", "avi"].includes(ext || ""))
			return <Video size={40} className="text-pink-400" />;
		if (["mp3", "wav", "ogg"].includes(ext || ""))
			return <Music size={40} className="text-amber-400" />;
		if (
			[
				"js",
				"ts",
				"tsx",
				"jsx",
				"py",
				"go",
				"rs",
				"html",
				"css",
				"json",
			].includes(ext || "")
		)
			return <Code2 size={40} className="text-blue-400" />;

		return <File size={40} className="text-muted-foreground" />;
	};

	async function fetchObjects(newPrefix: string) {
		setLoading(true);
		try {
			const data = await listObjects(bucketName, newPrefix);
			setObjects(data);
			setPrefix(newPrefix);
		} catch (error: unknown) {
			toast.error(
				error instanceof Error ? error.message : "Failed to load objects",
			);
		} finally {
			setLoading(false);
		}
	}

	const filteredObjects = objects.filter((obj) =>
		obj.name.toLowerCase().includes(searchQuery.toLowerCase()),
	);

	const formatSize = (bytes?: number) => {
		if (bytes === undefined) return "-";
		const sizes = ["Bytes", "KB", "MB", "GB", "TB"];
		if (bytes === 0) return "0 Byte";
		const i = Math.floor(Math.log(bytes) / Math.log(1024));
		return Math.round(bytes / 1024 ** i) + " " + sizes[i];
	};

	async function handleDelete(key: string) {
		if (!confirm("Are you sure you want to delete this?")) return;

		const result = await deleteObject(bucketName, key);
		if (result.success) {
			toast.success("Deleted successfully");
			fetchObjects(prefix);
		} else {
			toast.error(result.error || "Failed to delete");
		}
	}

	return (
		<div className="space-y-4">
			<div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
				<Breadcrumbs
					bucketName={bucketName}
					prefix={prefix}
					onNavigate={(p) => fetchObjects(p)}
				/>

				<div className="flex items-center gap-2">
					<div className="relative w-full md:w-64">
						<Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
						<Input
							placeholder="Search files..."
							className="pl-9 h-9"
							value={searchQuery}
							onChange={(e) => setSearchQuery(e.target.value)}
						/>
					</div>
					<div className="flex border rounded-lg overflow-hidden shrink-0">
						<Button
							variant={viewMode === "list" ? "secondary" : "ghost"}
							size="icon"
							className="h-9 w-9 rounded-none"
							onClick={() => setViewMode("list")}
							type="button"
						>
							<ListIcon size={16} />
						</Button>
						<Button
							variant={viewMode === "grid" ? "secondary" : "ghost"}
							size="icon"
							className="h-9 w-9 rounded-none"
							onClick={() => setViewMode("grid")}
							type="button"
						>
							<Grid size={16} />
						</Button>
					</div>
					<Button
						onClick={() => setShowUpload(!showUpload)}
						variant={showUpload ? "secondary" : "default"}
						className="gap-2 h-9"
						type="button"
					>
						{showUpload ? (
							<Plus className="rotate-45" size={16} />
						) : (
							<CloudUpload size={16} />
						)}
						{showUpload ? "Close" : "Upload"}
					</Button>
				</div>
			</div>

			{showUpload && (
				<div className="animate-in slide-in-from-top duration-300">
					<UploadZone
						bucketName={bucketName}
						prefix={prefix}
						onSuccess={() => {
							fetchObjects(prefix);
							setShowUpload(false);
						}}
					/>
				</div>
			)}

			<div className="min-h-[400px] relative">
				{loading && (
					<div className="absolute inset-0 bg-background/50 backdrop-blur-[1px] z-10 flex items-center justify-center">
						<Loader2 className="animate-spin text-primary" size={32} />
					</div>
				)}

				{viewMode === "list" ? (
					<div className="border rounded-xl overflow-hidden bg-card/30">
						<table className="w-full text-sm text-left">
							<thead className="bg-muted/50 text-muted-foreground font-medium border-b">
								<tr>
									<th className="px-4 py-3">Name</th>
									<th className="px-4 py-3 hidden md:table-cell">Size</th>
									<th className="px-4 py-3 hidden lg:table-cell">
										Last Modified
									</th>
									<th className="px-4 py-3 text-right">Actions</th>
								</tr>
							</thead>
							<tbody className="divide-y divide-border/40">
								{filteredObjects.length === 0 && !loading && (
									<tr>
										<td
											colSpan={4}
											className="px-4 py-12 text-center text-muted-foreground"
										>
											No files or folders found
										</td>
									</tr>
								)}
								{filteredObjects.map((obj) => (
									<tr
										key={obj.key}
										className="hover:bg-muted/30 transition-colors group"
									>
										<td className="px-4 py-3">
											<div className="flex items-center gap-3">
												{getFileIcon(obj)}
												{obj.type === "folder" ? (
													<button
														onClick={() => fetchObjects(obj.key)}
														className="font-medium hover:underline text-left cursor-pointer"
														type="button"
													>
														{obj.name}
													</button>
												) : (
													<span className="font-medium">{obj.name}</span>
												)}
											</div>
										</td>
										<td className="px-4 py-3 text-muted-foreground hidden md:table-cell">
											{obj.type === "file" ? formatSize(obj.size) : "-"}
										</td>
										<td className="px-4 py-3 text-muted-foreground hidden lg:table-cell">
											{obj.lastModified
												? new Date(obj.lastModified).toLocaleString()
												: "-"}
										</td>
										<td className="px-4 py-3 text-right">
											<div className="flex items-center justify-end gap-1">
												{obj.isPublic && (
													<Button
														variant="ghost"
														size="icon"
														className="h-8 w-8 text-primary hover:bg-primary/10"
														type="button"
														onClick={(e) => {
															e.stopPropagation();
															const url = `https://${bucketName}.s3.amazonaws.com/${obj.key}`;
															navigator.clipboard.writeText(url);
															toast.success("Public URL copied");
														}}
														title="Copy Public URL"
													>
														<LinkIcon size={14} />
													</Button>
												)}
												<ObjectActions
													bucketName={bucketName}
													object={obj}
													onRefresh={() => fetchObjects(prefix)}
													onDelete={handleDelete}
												/>
											</div>
										</td>
									</tr>
								))}
							</tbody>
						</table>
					</div>
				) : (
					<div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4">
						{filteredObjects.map((obj) => (
							<Card
								key={obj.key}
								className={cn(
									"group hover:border-primary/50 transition-all cursor-pointer relative",
									obj.type === "folder" ? "bg-primary/5" : "bg-card/40",
								)}
								onClick={() => obj.type === "folder" && fetchObjects(obj.key)}
							>
								<CardContent className="p-4 flex flex-col items-center justify-center text-center space-y-2">
									{getFileIconLarge(obj)}
									<span className="text-xs font-medium truncate w-full">
										{obj.name}
									</span>

									<div className="absolute top-1 right-1 opacity-100 group-hover:opacity-100 flex items-center gap-1">
										{obj.isPublic && (
											<Button
												variant="secondary"
												size="icon"
												className="h-6 w-6 bg-background/80 backdrop-blur-sm"
												type="button"
												onClick={(e) => {
													e.stopPropagation();
													const url = `https://${bucketName}.s3.amazonaws.com/${obj.key}`;
													navigator.clipboard.writeText(url);
													toast.success("Public URL copied");
												}}
												title="Copy Public URL"
											>
												<LinkIcon size={10} />
											</Button>
										)}
										<div className="bg-background/80 backdrop-blur-sm rounded-md">
											<ObjectActions
												bucketName={bucketName}
												object={obj}
												onRefresh={() => fetchObjects(prefix)}
												onDelete={handleDelete}
											/>
										</div>
									</div>
								</CardContent>
							</Card>
						))}
					</div>
				)}
			</div>
		</div>
	);
}
