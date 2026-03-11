import { SourceReaderPage } from "@/components/sources/source-reader-page";

export default async function SourceReaderRoute({
  params,
}: {
  params: Promise<{ sourceId: string }>;
}) {
  const { sourceId } = await params;
  return <SourceReaderPage sourceId={sourceId} />;
}
