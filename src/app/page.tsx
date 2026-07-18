import { Cloud, Shield, Zap } from "lucide-react";
import Link from "next/link";
import { Button } from "@/components/ui/button";

export default function Home() {
	return (
		<div className="flex flex-col min-h-screen">
			<header className="border-b border-border/40 backdrop-blur-md sticky top-0 z-50 bg-background/80">
				<div className="container flex h-16 items-center justify-between">
					<div className="flex items-center gap-2 font-bold text-xl tracking-tight">
						<div className="bg-primary text-primary-foreground p-1 rounded"><Cloud size={20} /></div>
						<span>S3 Client</span>
					</div>
					<nav className="flex items-center gap-4">
						<Link href="/dashboard"><Button size="sm" className="gap-2">Dashboard</Button></Link>
					</nav>
				</div>
			</header>
			<main className="flex-1 flex flex-col items-center justify-center p-6 md:p-24 bg-[radial-gradient(ellipse_at_top,var(--tw-gradient-stops))] from-primary/5 via-background to-background">
				<div className="max-w-4xl w-full text-center space-y-8">
					<div className="space-y-4">
						<h1 className="text-4xl md:text-6xl font-extrabold tracking-tighter leading-tight">
							Manage your S3 and R2 buckets <span className="text-primary">securely</span> and <span className="text-primary">efficiently</span>.
						</h1>
						<p className="text-muted-foreground text-lg md:text-xl max-w-2xl mx-auto">
							A premium web client for Amazon S3 and Cloudflare R2. Your credentials are encrypted and stored only in your browser — never in a database.
						</p>
					</div>
					<div className="flex items-center justify-center gap-4 pt-4">
						<Link href="/dashboard"><Button size="lg" className="gap-2 text-base px-8">Go to Dashboard</Button></Link>
					</div>
					<div className="grid grid-cols-1 md:grid-cols-3 gap-6 pt-12 max-w-3xl mx-auto">
						<div className="flex flex-col items-center gap-3 p-6 rounded-xl border border-border/40 bg-card/50">
							<Shield className="text-primary" size={28} />
							<h3 className="font-semibold">Encrypted in Browser</h3>
							<p className="text-xs text-muted-foreground text-center">AES-256-GCM encryption stored in a secure cookie. No database, no leaks.</p>
						</div>
						<div className="flex flex-col items-center gap-3 p-6 rounded-xl border border-border/40 bg-card/50">
							<Zap className="text-primary" size={28} />
							<h3 className="font-semibold">S3 & R2 Support</h3>
							<p className="text-xs text-muted-foreground text-center">Manage both Amazon S3 and Cloudflare R2 in one place.</p>
						</div>
						<div className="flex flex-col items-center gap-3 p-6 rounded-xl border border-border/40 bg-card/50">
							<Cloud className="text-primary" size={28} />
							<h3 className="font-semibold">Multiple Connections</h3>
							<p className="text-xs text-muted-foreground text-center">Add and switch between multiple bucket connections.</p>
						</div>
					</div>
				</div>
			</main>
			<footer className="border-t border-border/40 py-8 bg-background/50">
				<div className="container flex flex-col md:flex-row items-center justify-between gap-4 text-center md:text-left">
					<p className="text-sm text-muted-foreground">&copy; {new Date().getFullYear()} S3 Client. Built with Next.js and Cloudflare.</p>
					<div className="flex items-center gap-4 text-sm text-muted-foreground">
						<Link href="/privacy" className="hover:text-primary transition-colors">Privacy</Link>
						<Link href="/terms" className="hover:text-primary transition-colors">Terms</Link>
					</div>
				</div>
			</footer>
		</div>
	);
}
