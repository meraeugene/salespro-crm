import type { DealStage, LeadStatus } from "@/types/crm";

export const leadStatusOptions = ["New", "Contacted", "Qualified", "Proposal", "Won", "Lost"] as const satisfies readonly LeadStatus[];

export const dealStageOptions = ["New Lead", "Contacted", "Qualified", "Proposal Sent", "Negotiation", "Won", "Lost"] as const satisfies readonly DealStage[];

export const leadStatusToDealStage: Record<LeadStatus, DealStage> = {
  New: "New Lead",
  Contacted: "Contacted",
  Qualified: "Qualified",
  Proposal: "Proposal Sent",
  Won: "Won",
  Lost: "Lost",
};

export function leadStatusForDealStage(stage: DealStage | string): LeadStatus | null {
  if (stage === "New Lead") return "New";
  if (stage === "Contacted") return "Contacted";
  if (stage === "Qualified") return "Qualified";
  if (stage === "Proposal Sent" || stage === "Negotiation") return "Proposal";
  if (stage === "Won") return "Won";
  if (stage === "Lost") return "Lost";
  return null;
}
