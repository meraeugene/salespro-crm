import { RecordDetailClient } from "@/components/details/record-detail-client";

export default async function CompanyDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  return <RecordDetailClient kind="companies" id={id} />;
}
