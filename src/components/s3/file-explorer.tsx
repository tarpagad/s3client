"use client";

import {
	ChevronLeft,
	ChevronRight,
	CloudUpload,
	Code2,
	File,
	Folder,
	FolderPlus,
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
import React, { useState } from "react";
import { toast } from "sonner";
import {
	countObjects,
	deleteObject,
	listObjects,
	searchObjects,
} from "@/actions/s3-actions";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import type { UserPrefs } from "@/lib/preferences";
import type { S3ObjectInfo } from "@/lib/types";
import { cn } from "@/lib/utils";
import { Breadcrumbs } from "./breadcrumbs";
import { CreateFolderDialog } from "./create-folder-dialog";
import { ObjectActions } from "./object-actions";
import { PreviewModal } from "./preview-modal";
import { UploadZone } from "./upload-zone";

interface FileExplorerProps {
	bucketName: string;
	initialObjects: S3ObjectInfo[];
	initialNextToken?: string;
	initialPrefs: UserPrefs;
}

export function FileExplorer({
	bucketName,
	initialObjects,
	initialNextToken,
	initialPrefs,
}: FileExplorerProps) {
	const [prefix, setPrefix] = useState("");
	const [objects, setObjects] = useState<S3ObjectInfo[]>(initialObjects);
	const [loading, setLoading] = useState(false);
	const [searchQuery, setSearchQuery] = useState("");
	const [viewMode, setViewMode] = useState<"list" | "grid">(
		initialPrefs.viewMode,
	);
	const [showUpload, setShowUpload] = useState(false);
	const [showCreateFolder, setShowCreateFolder] = useState(false);
	const [previewObject, setPreviewObject] = useState<S3ObjectInfo | null>(null);
	const [nextToken, setNextToken] = useState<string | undefined>(
		initialNextToken,
	);
	const [prevTokens, setPrevTokens] = useState<string[]>([]);
	const [currentPage, setCurrentPage] = useState(1);
	const [sortBy, setSortBy] = useState<
		"date-desc" | "date-asc" | "name-asc" | "name-desc"
	>("date-desc");
	const [totalItems, setTotalItems] = useState<number | null>(null);
	const [tokenCache, setTokenCache] = useState<(string | undefined)[]>([
		undefined,
	]); // Page 1 is always undefined token
	const [isSearching, setIsSearching] = useState(false);

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

	// Handle Date serialization from Server Actions
	const safeDate = (date: Date | string | undefined): Date | undefined => {
		if (!date) return undefined;
		return new Date(date);
	};

	async function fetchObjects(newPrefix: string, token?: string, sortStr?: typeof sortBy) {
		setLoading(true);
		try {
			const data = await listObjects(
				bucketName,
				newPrefix,
				initialPrefs.itemsPerPage,
				token,
				sortStr || sortBy,
			);
			
			// Fix Date objects coming from Server Action (serialized as strings)
			const fixedObjects = data.objects.map(obj => ({
				...obj,
				lastModified: safeDate(obj.lastModified)
			}));

			setObjects(fixedObjects);
			setNextToken(data.nextToken);
			setPrefix(newPrefix);

			if (!token) {
				setPrevTokens([]);
				setCurrentPage(1);
				setTokenCache([undefined]);
				// Use the total from the response
				if (data.totalObjects !== undefined) {
					setTotalItems(data.totalObjects);
				}
			}

			// Update token cache for the NEXT page
			if (data.nextToken) {
				setTokenCache((prev) => {
					const next = [...prev];
					const nextPageIndex = currentPage; // current page is token index - 1
					next[nextPageIndex] = data.nextToken;
					return next;
				});
			} else {
                 // Explicitly clear future cache if no next token
                 setTokenCache(prev => prev.slice(0, currentPage));
            }
			setIsSearching(false);
		} catch (error: unknown) {
			toast.error(
				error instanceof Error ? error.message : "Failed to load objects",
			);
		} finally {
			setLoading(false);
		}
	}

	async function handleNextPage() {
		if (!nextToken) return;
		setPrevTokens([...prevTokens, nextToken]);
		// Need to increment page BEFORE fetching for the cache logic to work for *next* page
        // But the previous implementation logic was: page 1 (no token) -> loads. nextToken set.
        // Click Next -> fetch(nextToken). 
		// Actually, let's keep it simple:
        const nextPageNum = currentPage + 1;
        setCurrentPage(nextPageNum);
		await fetchObjects(prefix, nextToken);
	}

	async function handlePrevPage() {
		if (currentPage === 1) return;
		const newPrevTokens = [...prevTokens];
		newPrevTokens.pop(); // Remove current
		const lastToken = newPrevTokens[newPrevTokens.length - 1];
		setPrevTokens(newPrevTokens);
        const prevPageNum = currentPage - 1;
        setCurrentPage(prevPageNum);
		await fetchObjects(prefix, lastToken);
	}

	async function jumpToPage(page: number) {
		if (page === currentPage || page < 1) return;
		if (totalItems && page > Math.ceil(totalItems / initialPrefs.itemsPerPage))
			return;

		// If we have the token in cache, use it
		if (page <= tokenCache.length) {
			const token = tokenCache[page - 1];
			// Correct prevTokens history
			const newPrevTokens = [];
			for (let i = 1; i < page; i++) {
				newPrevTokens.push(tokenCache[i]);
			}
			setPrevTokens(newPrevTokens as string[]);
            setCurrentPage(page);
			await fetchObjects(prefix, token);
		} else {
            // New logic: with simple offset pagination server-side, we technically *could* construct the token
            // But to stick to the opaque token pattern, and since we don't have the "construct token" logic exposed to client,
            // we will sadly have to forbid jumping to unknown pages OR accept that the user has to click "Next"
            // HOWEVER, since I know the server implementation uses base64(json({offset: N})), 
            // I CAN optimistically construct it here if I really wanted to, but that leaks implementation details.
            
            // Allow sequential jump only for now or notify
            toast.info("Please navigate sequentially to caching pages.");
		}
	}

	async function handleSearchExecute() {
		if (!searchQuery.trim()) {
			fetchObjects(prefix);
			return;
		}

		setLoading(true);
		setIsSearching(true);
		try {
			const data = await searchObjects(bucketName, prefix, searchQuery);
            // Fix Dates
			const fixedObjects = data.objects.map(obj => ({
				...obj,
				lastModified: safeDate(obj.lastModified)
			}));
			setObjects(fixedObjects);
			setNextToken(undefined); 
			setTotalItems(data.totalObjects ?? data.objects.length);
		} catch (error: unknown) {
			toast.error(error instanceof Error ? error.message : "Search failed");
		} finally {
			setLoading(false);
		}
	}

	function handlePreview(obj: S3ObjectInfo) {
		if (obj.type === "file") {
			setPreviewObject(obj);
		}
	}

	const filteredObjects = isSearching
		? objects
		: objects.filter((obj) =>
				obj.name.toLowerCase().includes(searchQuery.toLowerCase()),
			);

	// Client-side sort is now just for display consistency on the current page
    // The server handles the "True" sort
	const sortedObjects = [...filteredObjects].sort((a, b) => {
		// Folders always come first
		if (a.type !== b.type) return a.type === "folder" ? -1 : 1;

        // Use the same logic as server for consistent in-page display
		if (sortBy === "date-desc") {
			return (
				(b.lastModified?.getTime() || 0) - (a.lastModified?.getTime() || 0)
			);
		}
		if (sortBy === "date-asc") {
			return (
				(a.lastModified?.getTime() || 0) - (b.lastModified?.getTime() || 0)
			);
		}
		if (sortBy === "name-asc") {
			return a.name.localeCompare(b.name);
		}
		if (sortBy === "name-desc") {
			return b.name.localeCompare(a.name);
		}
		return 0;
	});

	const formatSize = (bytes?: number) => {
		if (bytes === undefined) return "-";
		const sizes = ["Bytes", "KB", "MB", "GB", "TB"];
		if (bytes === 0) return "0 Byte";
		const i = Math.floor(Math.log(bytes) / Math.log(1024));
		return Math.round(bytes / 1024 ** i) + " " + sizes[i];
	};

	async function handleDelete(key: string) {
		if (!confirm("Are you sure you want to delete this?")) return;

		// Optimistic update
		const previousObjects = [...objects];
		setObjects(objects.filter((obj) => obj.key !== key));

		const result = await deleteObject(bucketName, key);
		if (result.success) {
			toast.success("Deleted successfully");
		} else {
			setObjects(previousObjects); // Rollback
			toast.error(result.error || "Failed to delete");
		}
	}

	function handleOptimisticRename(oldKey: string, newKey: string) {
		setObjects(
			objects.map((obj) => {
				if (obj.key === oldKey) {
					const name = newKey.split("/").pop() || "";
					const extension = name.split(".").pop();
					return { ...obj, key: newKey, name, extension };
				}
				return obj;
			}),
		);
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
							placeholder="Search in this folder..."
							className="pl-9 h-9"
							value={searchQuery}
							onChange={(e) => setSearchQuery(e.target.value)}
							onKeyDown={(e) => {
								if (e.key === "Enter") handleSearchExecute();
							}}
						/>
						{isSearching && (
							<Button
								variant="ghost"
								size="sm"
								className="absolute right-1 top-1 h-7 w-7 p-0"
								onClick={() => {
									setSearchQuery("");
									fetchObjects(prefix);
								}}
								type="button"
							>
								<Plus className="rotate-45" size={14} />
							</Button>
						)}
					</div>
					<Button
						variant="ghost"
						size="icon"
						className="h-9 w-9 shrink-0"
						onClick={handleSearchExecute}
						type="button"
						disabled={loading}
					>
						<Search size={16} />
					</Button>
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
					<Button
						onClick={() => setShowCreateFolder(true)}
						variant="outline"
						className="gap-2 h-9 border-primary/20 hover:border-primary/50 hover:bg-primary/5 text-primary"
						type="button"
					>
						<FolderPlus size={16} />
						<span className="hidden sm:inline">New Folder</span>
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
					<div className="border rounded-xl bg-card/30">
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
								{sortedObjects.map((obj) => (
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
													<button
														onClick={() => handlePreview(obj)}
														className="font-medium hover:underline text-left cursor-pointer"
														type="button"
													>
														{obj.name}
													</button>
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
													onRename={handleOptimisticRename}
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
						{sortedObjects.map((obj) => (
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
												onRename={handleOptimisticRename}
											/>
										</div>
									</div>
								</CardContent>
							</Card>
						))}
					</div>
				)}
			</div>

			{/* Pagination Controls */}
			{(nextToken || currentPage > 1 || totalItems || isSearching) && (
				<div className="flex items-center justify-between px-2 py-4 border-t border-border/40">
					<div className="text-sm text-muted-foreground">
						{isSearching ? (
							<span className="flex items-center gap-2">
								<Search size={14} className="text-primary" />
								Search results for{" "}
								<span className="font-medium text-foreground italic">
									"{searchQuery}"
								</span>
								<span className="text-xs">({objects.length} found)</span>
							</span>
						) : (
							<>
								Page{" "}
								<span className="font-medium text-foreground">
									{currentPage}
								</span>
								{totalItems && (
									<>
										{" "}
										of{" "}
										<span className="font-medium text-foreground">
											{Math.ceil(totalItems / initialPrefs.itemsPerPage)}
										</span>
									</>
								)}
							</>
						)}
					</div>
					<div className="flex items-center gap-2">
						{!isSearching && (
							<>
								<select
									value={sortBy}
									onChange={(e) => {
										const newSort = e.target.value as
											| "date-desc"
											| "date-asc"
											| "name-asc"
											| "name-desc";
										setSortBy(newSort);
										fetchObjects(prefix, undefined, newSort);
									}}
									className="h-8 text-xs rounded-md border border-input bg-background px-2 py-1 outline-none mr-4"
								>
									<option value="date-desc">Newest First</option>
									<option value="date-asc">Oldest First</option>
									<option value="name-asc">Name (A-Z)</option>
									<option value="name-desc">Name (Z-A)</option>
								</select>

								<div className="flex items-center gap-1 mr-4">
									{totalItems &&
										Array.from(
											{
												length: Math.ceil(
													totalItems / initialPrefs.itemsPerPage,
												),
											},
											(_, i) => i + 1,
										)
											.filter(
												(p) =>
													p === 1 ||
													p ===
														Math.ceil(
															(totalItems || 0) / initialPrefs.itemsPerPage,
														) ||
													Math.abs(p - currentPage) <= 1,
											)
											.map((p, i, arr) => (
												<React.Fragment key={p}>
													{i > 0 && arr[i - 1] !== p - 1 && (
														<span className="px-1">...</span>
													)}
													<Button
														variant={currentPage === p ? "default" : "ghost"}
														size="sm"
														onClick={() => jumpToPage(p)}
														className="h-8 w-8 p-0"
														disabled={loading}
													>
														{p}
													</Button>
												</React.Fragment>
											))}
								</div>

								<Button
									variant="outline"
									size="sm"
									onClick={handlePrevPage}
									disabled={currentPage === 1 || loading}
									className="h-8 gap-1"
								>
									<ChevronLeft size={16} /> Previous
								</Button>
								<Button
									variant="outline"
									size="sm"
									onClick={handleNextPage}
									disabled={!nextToken || loading}
									className="h-8 gap-1"
								>
									Next <ChevronRight size={16} />
								</Button>
							</>
						)}
						{isSearching && (
							<Button
								variant="outline"
								size="sm"
								onClick={() => {
									setSearchQuery("");
									fetchObjects(prefix);
								}}
								className="h-8"
							>
								Clear Search
							</Button>
						)}
					</div>
				</div>
			)}

			{previewObject && (
				<PreviewModal
					bucketName={bucketName}
					object={previewObject}
					onClose={() => setPreviewObject(null)}
				/>
			)}

			{showCreateFolder && (
				<CreateFolderDialog
					bucketName={bucketName}
					prefix={prefix}
					onClose={() => setShowCreateFolder(false)}
					onSuccess={() => fetchObjects(prefix)}
				/>
			)}
		</div>
	);
}
