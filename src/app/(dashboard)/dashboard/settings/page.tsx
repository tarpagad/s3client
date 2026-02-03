import { SettingsForm } from "@/components/s3/settings-form";

export const metadata = {
	title: "Settings | S3 Client",
};

export default function SettingsPage() {
	return (
		<div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
			<div>
				<h1 className="text-3xl font-bold tracking-tight">Settings</h1>
				<p className="text-muted-foreground">
					Customize your dashboard and S3 explorer experience.
				</p>
			</div>

			<SettingsForm />
		</div>
	);
}
