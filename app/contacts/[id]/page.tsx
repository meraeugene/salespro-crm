import { RecordDetailClient } from "@/components/details/record-detail-client";

export default async function ContactDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  return <RecordDetailClient kind="contacts" id={id} />;
}
