import { ArticlePage } from "@/components/ArticlePage";

export default async function ArticleRoute({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  return <ArticlePage id={id} />;
}
