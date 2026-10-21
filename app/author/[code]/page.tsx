import { AuthorProfile } from "@/components/AuthorProfile";

export default async function AuthorProfileRoute({
  params,
}: {
  params: Promise<{ code: string }>;
}) {
  const { code } = await params;
  return <AuthorProfile studentCode={code} />;
}
