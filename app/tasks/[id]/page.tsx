import { RecordDetailClient } from "@/components/details/record-detail-client";

export default async function TaskDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  return <RecordDetailClient kind="tasks" id={id} />;
}
