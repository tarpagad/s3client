import { cookies } from "next/headers";

export interface UserPrefs {
	viewMode: "list" | "grid";
	itemsPerPage: number;
}

export const DEFAULT_PREFS: UserPrefs = {
	viewMode: "list",
	itemsPerPage: 20,
};

export async function getUserPrefs(): Promise<UserPrefs> {
	const cookieStore = await cookies();
	const prefsCookie = cookieStore.get("user_prefs");

	if (!prefsCookie) return DEFAULT_PREFS;

	try {
		const parsed = JSON.parse(decodeURIComponent(prefsCookie.value));
		return {
			viewMode: parsed.viewMode === "grid" ? "grid" : "list",
			itemsPerPage:
				typeof parsed.itemsPerPage === "number" ? parsed.itemsPerPage : 20,
		};
	} catch (e) {
		return DEFAULT_PREFS;
	}
}
