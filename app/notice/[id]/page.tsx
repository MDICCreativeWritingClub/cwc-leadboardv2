import { NoticePage } from "@/components/NoticePage";

export default async function NoticeRoute({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  return <NoticePage id={id} />;
}
