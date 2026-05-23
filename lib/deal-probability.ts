import type { DealStage } from "@/types/crm";

export const dealStageProbability: Record<DealStage, number> = {
  "New Lead": 10,
  Contacted: 20,
  Qualified: 40,
  "Proposal Sent": 60,
  Negotiation: 80,
  Won: 100,
  Lost: 0,
};

export function probabilityForStage(stage: DealStage) {
  return dealStageProbability[stage];
}

