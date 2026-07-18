import { ArrowLeft } from "lucide-react";
import Link from "next/link";
import { notFound } from "next/navigation";
import { getConnection } from "@/actions/credentials-actions";
import { Button } from "@/components/ui/button";
import { EditConnectionForm } from "./edit-connection-form";

interface EditConnectionPageProps {
	params: Promise<{ connectionId: string }>;
}

export default async function EditConnectionPage({ params }: EditConnectionPageProps) {
	const { connectionId } = await params;
	const connection = await getConnection(connectionId);
	if (!connection) { return notFound(); }

	return (
		<div className="max-w-2xl mx-auto space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
			<div className="flex items-center gap-4">
				<Link href={`/dashboard/connections/${connectionId}`}><Button variant="ghost" size="icon" className="rounded-full"><ArrowLeft size={20} /></Button></Link>
				<div>
					<h1 className="text-3xl font-bold tracking-tight">Edit Connection</h1>
					<p className="text-muted-foreground">Update your {connection.type === "s3" ? "S3" : "R2"} connection details.</p>
				</div>
			</div>
			<EditConnectionForm connection={connection} />
		</div>
	);
}
