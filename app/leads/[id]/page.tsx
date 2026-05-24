import { RecordDetailClient } from "@/components/details/record-detail-client";

export default async function LeadDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  return <RecordDetailClient kind="leads" id={id} />;
}
