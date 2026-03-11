import { TopicPage } from "@/components/topics/topic-page";

export default async function TopicDetailRoute({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  return <TopicPage slug={slug} />;
}
