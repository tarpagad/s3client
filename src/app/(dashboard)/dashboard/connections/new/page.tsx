import { AddConnectionForm } from "./add-connection-form";

export default function AddConnectionPage() {
	return (
		<div className="max-w-2xl mx-auto space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
			<div>
				<h1 className="text-3xl font-bold tracking-tight">Add Connection</h1>
				<p className="text-muted-foreground">Connect your Amazon S3 or Cloudflare R2 account. Your credentials are encrypted and stored only in your browser.</p>
			</div>
			<AddConnectionForm />
		</div>
	);
}
