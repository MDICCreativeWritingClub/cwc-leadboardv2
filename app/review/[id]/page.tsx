import { ReviewEditPage } from "@/components/ReviewEditPage";

export default async function ReviewEditRoute({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  return <ReviewEditPage id={id} />;
}
