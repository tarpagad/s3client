"use client";

import { Grid, Key, List, Save, Trash2 } from "lucide-react";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import {
	Card,
	CardContent,
	CardDescription,
	CardFooter,
	CardHeader,
	CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { cn } from "@/lib/utils";

export function SettingsForm() {
	const [viewMode, setViewMode] = useState<"list" | "grid">("list");
	const [itemsPerPage, setItemsPerPage] = useState(20);
	const [isSaving, setIsSaving] = useState(false);

	const [hasCookieKey, setHasCookieKey] = useState<boolean | null>(null);
	const [hasEnvKey, setHasEnvKey] = useState(false);
	const [showKeyForm, setShowKeyForm] = useState(false);
	const [showChangeKey, setShowChangeKey] = useState(false);
	const [newKey, setNewKey] = useState("");
	const [currentKey, setCurrentKey] = useState("");
	const [isKeySaving, setIsKeySaving] = useState(false);

	useEffect(() => {
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

		fetchKeyStatus();
	}, []);

	async function fetchKeyStatus() {
		try {
			const { getEncryptionKeyStatus } = await import(
				"@/actions/key-actions"
			);
			const status = await getEncryptionKeyStatus();
			setHasCookieKey(status.hasCookieKey);
			setHasEnvKey(status.hasEnvKey);
		} catch {
			setHasCookieKey(false);
		}
	}

	const handleSave = () => {
		setIsSaving(true);
		const prefs = { viewMode, itemsPerPage };
		const expires = new Date();
		expires.setDate(expires.getDate() + 30);
		document.cookie = `user_prefs=${encodeURIComponent(JSON.stringify(prefs))}; path=/; expires=${expires.toUTCString()}; SameSite=Strict`;

		setTimeout(() => {
			setIsSaving(false);
			toast.success("Settings saved successfully");
		}, 500);
	};

	async function handleSetKey() {
		if (!newKey || newKey.length < 8) {
			toast.error("Encryption key must be at least 8 characters");
			return;
		}
		setIsKeySaving(true);
		try {
			const { setEncryptionKey } = await import("@/actions/key-actions");
			const result = await setEncryptionKey(newKey);
			if (result.error) {
				toast.error(result.error);
			} else {
				toast.success("Encryption key saved");
				setShowKeyForm(false);
				setNewKey("");
				fetchKeyStatus();
			}
		} catch {
			toast.error("Failed to set encryption key");
		} finally {
			setIsKeySaving(false);
		}
	}

	async function handleChangeKey() {
		if (!currentKey) {
			toast.error("Current encryption key is required");
			return;
		}
		if (!newKey || newKey.length < 8) {
			toast.error("New encryption key must be at least 8 characters");
			return;
		}
		setIsKeySaving(true);
		try {
			const { changeEncryptionKey } = await import(
				"@/actions/key-actions"
			);
			const result = await changeEncryptionKey(currentKey, newKey);
			if (result.error) {
				toast.error(result.error);
			} else {
				toast.success("Encryption key changed successfully");
				setShowChangeKey(false);
				setCurrentKey("");
				setNewKey("");
				fetchKeyStatus();
			}
		} catch {
			toast.error("Failed to change encryption key");
		} finally {
			setIsKeySaving(false);
		}
	}

	async function handleRemoveKey() {
		if (
			!confirm(
				"Are you sure? This will prevent access to any encrypted connections stored in your browser."
			)
		) {
			return;
		}
		try {
			const { removeEncryptionKey } = await import(
				"@/actions/key-actions"
			);
			await removeEncryptionKey();
			toast.success("Encryption key removed");
			fetchKeyStatus();
		} catch {
			toast.error("Failed to remove encryption key");
		}
	}

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
							className="w-full flex h-10 rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
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

			<Card className="border-border/40 bg-card/30">
				<CardHeader>
					<div className="flex items-center gap-3">
						<div className="p-2 bg-primary/10 rounded-lg text-primary">
							<Key size={20} />
						</div>
						<div>
							<CardTitle>Encryption Key</CardTitle>
							<CardDescription>
								Your passphrase is used to encrypt credentials before they are
								stored in your browser. Stored in an HTTP-only cookie — never
								accessible to JavaScript.
							</CardDescription>
						</div>
					</div>
				</CardHeader>
				<CardContent>
					{hasCookieKey === null ? (
						<p className="text-sm text-muted-foreground">
							Checking encryption status...
						</p>
					) : hasCookieKey ? (
						<div className="space-y-4">
							<div className="flex items-center gap-2 text-sm">
								<span className="w-2 h-2 rounded-full bg-green-500" />
								<span className="text-green-600 dark:text-green-400 font-medium">
									Encryption key is set
								</span>
							</div>
							{showChangeKey ? (
								<div className="space-y-3 border border-border/40 rounded-xl p-4 bg-muted/20">
									<div className="space-y-2">
										<Label htmlFor="currentKey">Current Key</Label>
										<Input
											id="currentKey"
											type="password"
											value={currentKey}
											onChange={(e) => setCurrentKey(e.target.value)}
											placeholder="Enter current encryption key"
										/>
									</div>
									<div className="space-y-2">
										<Label htmlFor="newKey">New Key</Label>
										<Input
											id="newKey"
											type="password"
											value={newKey}
											onChange={(e) => setNewKey(e.target.value)}
											placeholder="Enter new encryption key (min. 8 characters)"
										/>
									</div>
									<div className="flex gap-2">
										<Button
											onClick={handleChangeKey}
											disabled={isKeySaving}
											size="sm"
										>
											{isKeySaving ? "Changing..." : "Change Key"}
										</Button>
										<Button
											variant="ghost"
											size="sm"
											onClick={() => {
												setShowChangeKey(false);
												setCurrentKey("");
												setNewKey("");
											}}
										>
											Cancel
										</Button>
									</div>
								</div>
							) : (
								<div className="flex gap-2">
									<Button
										variant="outline"
										size="sm"
										onClick={() => setShowChangeKey(true)}
									>
										Change Key
									</Button>
									<Button
										variant="outline"
										size="sm"
										className="text-destructive hover:bg-destructive/10 border-destructive/20"
										onClick={handleRemoveKey}
									>
										<Trash2 size={14} className="mr-1" />
										Remove
									</Button>
								</div>
							)}
						</div>
					) : hasEnvKey ? (
						<div className="space-y-4">
							<div className="flex items-center gap-2 text-sm">
								<span className="w-2 h-2 rounded-full bg-blue-500" />
								<span className="text-blue-600 dark:text-blue-400 font-medium">
									Using server-side encryption key (ENCRYPTION_KEY)
								</span>
							</div>
							{!showKeyForm ? (
								<Button
									variant="outline"
									size="sm"
									onClick={() => setShowKeyForm(true)}
								>
									Set Browser Key Instead
								</Button>
							) : (
								<div className="space-y-3 border border-border/40 rounded-xl p-4 bg-muted/20">
									<div className="space-y-2">
										<Label htmlFor="setKey">Encryption Passphrase</Label>
										<Input
											id="setKey"
											type="password"
											value={newKey}
											onChange={(e) => setNewKey(e.target.value)}
											placeholder="Min. 8 characters"
										/>
									</div>
									<div className="flex gap-2">
										<Button
											onClick={handleSetKey}
											disabled={isKeySaving}
											size="sm"
										>
											{isKeySaving ? "Saving..." : "Save Key"}
										</Button>
										<Button
											variant="ghost"
											size="sm"
											onClick={() => {
												setShowKeyForm(false);
												setNewKey("");
											}}
										>
											Cancel
										</Button>
									</div>
								</div>
							)}
						</div>
					) : (
						<div className="space-y-4">
							<div className="flex items-center gap-2 text-sm">
								<span className="w-2 h-2 rounded-full bg-amber-500" />
								<span className="text-amber-600 dark:text-amber-400 font-medium">
									No encryption key set
								</span>
							</div>
							<p className="text-sm text-muted-foreground">
								Set an encryption passphrase to secure your stored credentials.
								This is only needed if no ENCRYPTION_KEY is configured on the
								server.
							</p>
							{showKeyForm ? (
								<div className="space-y-3 border border-border/40 rounded-xl p-4 bg-muted/20">
									<div className="space-y-2">
										<Label htmlFor="setKey">Encryption Passphrase</Label>
										<Input
											id="setKey"
											type="password"
											value={newKey}
											onChange={(e) => setNewKey(e.target.value)}
											placeholder="Min. 8 characters"
										/>
									</div>
									<div className="flex gap-2">
										<Button
											onClick={handleSetKey}
											disabled={isKeySaving}
											size="sm"
										>
											{isKeySaving ? "Saving..." : "Save Key"}
										</Button>
										<Button
											variant="ghost"
											size="sm"
											onClick={() => {
												setShowKeyForm(false);
												setNewKey("");
											}}
										>
											Cancel
										</Button>
									</div>
								</div>
							) : (
								<Button
									variant="outline"
									size="sm"
									onClick={() => setShowKeyForm(true)}
								>
									Set Encryption Key
								</Button>
							)}
						</div>
					)}
				</CardContent>
				<CardFooter className="border-t border-border/40 px-6 py-3">
					<p className="text-[10px] text-muted-foreground">
						The key is stored in an HTTP-only cookie. If you clear your
						cookies, stored connections will become unrecoverable unless you
						remember this key.
					</p>
				</CardFooter>
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
