import { redirect } from "next/navigation";

interface OldBucketPageProps {
	params: Promise<{
		bucketName: string;
	}>;
}

export default async function OldBucketRedirect({ params }: OldBucketPageProps) {
	const { bucketName } = await params;
	redirect(`/dashboard`);
}
