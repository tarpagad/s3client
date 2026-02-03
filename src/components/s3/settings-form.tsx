"use client";

import { Grid, List, Save } from "lucide-react";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import {
	Card,
	CardContent,
	CardDescription,
	CardHeader,
	CardTitle,
} from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { cn } from "@/lib/utils";

export function SettingsForm() {
	const [viewMode, setViewMode] = useState<"list" | "grid">("list");
	const [itemsPerPage, setItemsPerPage] = useState(20);
	const [isSaving, setIsSaving] = useState(false);

	useEffect(() => {
		// Load from cookies on mount
		const cookies = document.cookie.split("; ");
		const userPrefs = cookies.find((c) => c.startsWith("user_prefs="));
		if (userPrefs) {
			try {
				const prefs = JSON.parse(decodeURIComponent(userPrefs.split("=")[1]));
				if (prefs.viewMode) setViewMode(prefs.viewMode);
				if (prefs.itemsPerPage) setItemsPerPage(prefs.itemsPerPage);
			} catch (e) {
				console.error("Failed to parse prefs", e);
			}
		}
	}, []);

	const handleSave = () => {
		setIsSaving(true);
		const prefs = { viewMode, itemsPerPage };
		// Set cookie for 30 days
		const expires = new Date();
		expires.setDate(expires.getDate() + 30);
		document.cookie = `user_prefs=${encodeURIComponent(JSON.stringify(prefs))}; path=/; expires=${expires.toUTCString()}; SameSite=Strict`;

		setTimeout(() => {
			setIsSaving(false);
			toast.success("Settings saved successfully");
		}, 500);
	};

	return (
		<div className="max-w-2xl space-y-6">
			<Card className="border-border/40 bg-card/30">
				<CardHeader>
					<CardTitle>Display Preferences</CardTitle>
					<CardDescription>
						Choose how you want to view your S3 objects by default.
					</CardDescription>
				</CardHeader>
				<CardContent className="space-y-6">
					<div className="space-y-3">
						<Label>Default View Mode</Label>
						<div className="flex gap-4">
							<button
								type="button"
								onClick={() => setViewMode("list")}
								className={cn(
									"flex-1 flex flex-col items-center gap-3 p-4 rounded-xl border-2 transition-all group",
									viewMode === "list"
										? "border-primary bg-primary/5"
										: "border-border/40 hover:border-border hover:bg-muted/50",
								)}
							>
								<div
									className={cn(
										"p-3 rounded-lg transition-colors",
										viewMode === "list"
											? "bg-primary text-primary-foreground"
											: "bg-muted group-hover:bg-muted-foreground/10",
									)}
								>
									<List size={24} />
								</div>
								<span className="font-medium">List View</span>
							</button>

							<button
								type="button"
								onClick={() => setViewMode("grid")}
								className={cn(
									"flex-1 flex flex-col items-center gap-3 p-4 rounded-xl border-2 transition-all group",
									viewMode === "grid"
										? "border-primary bg-primary/5"
										: "border-border/40 hover:border-border hover:bg-muted/50",
								)}
							>
								<div
									className={cn(
										"p-3 rounded-lg transition-colors",
										viewMode === "grid"
											? "bg-primary text-primary-foreground"
											: "bg-muted group-hover:bg-muted-foreground/10",
									)}
								>
									<Grid size={24} />
								</div>
								<span className="font-medium">Grid View</span>
							</button>
						</div>
					</div>

					<div className="space-y-3">
						<Label htmlFor="pageSize">Items Per Page</Label>
						<select
							id="pageSize"
							value={itemsPerPage}
							onChange={(e) => setItemsPerPage(Number(e.target.value))}
							className="w-full flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
						>
							<option value={10}>10 items</option>
							<option value={20}>20 items</option>
							<option value={50}>50 items</option>
							<option value={100}>100 items</option>
						</select>
						<p className="text-[10px] text-muted-foreground">
							Larger page sizes may affect performance on folders with many
							objects.
						</p>
					</div>
				</CardContent>
			</Card>

			<div className="flex justify-end">
				<Button onClick={handleSave} disabled={isSaving} className="gap-2 px-8">
					{isSaving ? (
						"Saving..."
					) : (
						<>
							<Save size={16} /> Save Changes
						</>
					)}
				</Button>
			</div>
		</div>
	);
}
