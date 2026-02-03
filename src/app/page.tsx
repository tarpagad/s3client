import { Cloud, Shield, Zap } from "lucide-react";
import { ConnectForm } from "@/components/s3/connect-form";

export default function Home() {
	return (
		<div className="flex flex-col min-h-screen">
			{/* Header */}
			<header className="border-b border-border/40 backdrop-blur-md sticky top-0 z-50 bg-background/80">
				<div className="container flex h-16 items-center justify-between">
					<div className="flex items-center gap-2 font-bold text-xl tracking-tight">
						<div className="bg-primary text-primary-foreground p-1 rounded">
							<Cloud size={20} />
						</div>
						<span>S3 Client</span>
					</div>
					<nav className="flex items-center gap-6">
						<a
							href="https://github.com/jean/s3client"
							className="text-sm font-medium hover:text-primary transition-colors"
						>
							GitHub
						</a>
					</nav>
				</div>
			</header>

			<main className="flex-1 flex flex-col items-center justify-center p-6 md:p-24 bg-[radial-gradient(ellipse_at_top,var(--tw-gradient-stops))] from-primary/5 via-background to-background">
				<div className="max-w-4xl w-full grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
					<div className="space-y-6">
						<h1 className="text-4xl md:text-6xl font-extrabold tracking-tighter leading-tight">
							Manage your S3 buckets{" "}
							<span className="text-primary">securely</span> and{" "}
							<span className="text-primary">statelessly</span>.
						</h1>
						<p className="text-muted-foreground text-lg md:text-xl max-w-[600px]">
							A premium, lightweight web client for Amazon S3. No database, no
							storage of your secrets. Everything stays in your browser's
							encrypted cookies.
						</p>

						<div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-4">
							<div className="flex items-start gap-3 p-4 rounded-xl border border-border/40 bg-card/50">
								<Shield className="text-primary shrink-0" size={24} />
								<div>
									<h3 className="font-semibold text-sm">Military Grade</h3>
									<p className="text-xs text-muted-foreground">
										AES-256-GCM encryption for your AWS credentials.
									</p>
								</div>
							</div>
							<div className="flex items-start gap-3 p-4 rounded-xl border border-border/40 bg-card/50">
								<Zap className="text-primary shrink-0" size={24} />
								<div>
									<h3 className="font-semibold text-sm">Ultra Fast</h3>
									<p className="text-xs text-muted-foreground">
										Built on Next.js and Cloudflare Workers for global
										performance.
									</p>
								</div>
							</div>
						</div>
					</div>

					<div className="relative group">
						<div className="absolute -inset-1 bg-linear-to-r from-primary to-primary/50 rounded-2xl blur opacity-25 group-hover:opacity-40 transition duration-1000 group-hover:duration-200"></div>
						<div className="relative">
							<ConnectForm />
						</div>
					</div>
				</div>
			</main>

			{/* Footer */}
			<footer className="border-t border-border/40 py-8 bg-background/50">
				<div className="container flex flex-col md:flex-row items-center justify-between gap-4 text-center md:text-left">
					<p className="text-sm text-muted-foreground">
						&copy; {new Date().getFullYear()} S3 Client. Built with Next.js,
						Cloudflare, and Better-Auth.
					</p>
					<div className="flex items-center gap-4 text-sm text-muted-foreground">
						<a href="#" className="hover:text-primary transition-colors">
							Privacy
						</a>
						<a href="#" className="hover:text-primary transition-colors">
							Terms
						</a>
					</div>
				</div>
			</footer>
		</div>
	);
}
