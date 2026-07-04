import { Cloud } from "lucide-react";

export default function AuthLayout({
	children,
}: {
	children: React.ReactNode;
}) {
	return (
		<div className="flex min-h-screen flex-col bg-[radial-gradient(ellipse_at_top,var(--tw-gradient-stops))] from-primary/5 via-background to-background">
			<header className="border-b border-border/40 backdrop-blur-md bg-background/80">
				<div className="container flex h-16 items-center">
					<div className="flex items-center gap-2 font-bold text-xl tracking-tight">
						<div className="bg-primary text-primary-foreground p-1 rounded">
							<Cloud size={20} />
						</div>
						<span>S3 Client</span>
					</div>
				</div>
			</header>
			<main className="flex-1 flex items-center justify-center p-6">
				{children}
			</main>
		</div>
	);
}
