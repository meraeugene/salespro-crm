export type Role = "admin" | "sales_manager" | "sales_representative";

export type LeadStatus = "New" | "Contacted" | "Qualified" | "Proposal" | "Won" | "Lost";
export type DealStage =
  | "New Lead"
  | "Contacted"
  | "Qualified"
  | "Proposal Sent"
  | "Negotiation"
  | "Won"
  | "Lost";
export type TaskStatus = "Todo" | "In Progress" | "Done";

export type Profile = {
  id: string;
  full_name: string;
  email: string;
  avatar_url?: string | null;
  role: Role;
  manager_id?: string | null;
};

export type Company = {
  id: string;
  name: string;
  domain?: string | null;
  industry?: string | null;
  size?: string | null;
  created_at: string;
};

export type Lead = {
  id: string;
  full_name: string;
  company: string;
  company_id?: string | null;
  email: string;
  phone: string;
  status: LeadStatus;
  lead_source: string;
  assigned_to?: string | null;
  assigned_user?: string | null;
  last_contacted?: string | null;
  notes?: string | null;
  created_at: string;
};

export type Contact = {
  id: string;
  full_name: string;
  company: string;
  email: string;
  phone: string;
  title?: string | null;
  avatar_url?: string | null;
  assigned_to?: string | null;
  created_at: string;
};

export type Deal = {
  id: string;
  title: string;
  company: string;
  value: number;
  probability: number;
  stage: DealStage;
  assigned_to?: string | null;
  assigned_user?: string | null;
  expected_close_date: string;
  created_at: string;
};

export type Task = {
  id: string;
  title: string;
  description?: string | null;
  status: TaskStatus;
  due_date?: string | null;
  related_type?: string | null;
  related_id?: string | null;
  assigned_to?: string | null;
  created_at: string;
};

export type Note = {
  id: string;
  body: string;
  related_type: string;
  related_id: string;
  created_by?: string | null;
  created_at: string;
};

export type Activity = {
  id: string;
  action: string;
  entity_type: string;
  entity_id?: string | null;
  metadata?: Record<string, unknown> | null;
  created_by?: string | null;
  created_at: string;
};

export type DashboardMetrics = {
  totalDealsClosed: number;
  revenueGenerated: number;
  conversionRate: number;
  topSalesRep: string;
  revenueSeries: Array<{ month: string; revenue: number; target: number }>;
  sourceSeries: Array<{ name: string; value: number }>;
  pipelineProgress: Array<{ name: string; value: number; color: string }>;
  teamPerformance: Array<{ name: string; deals: number; revenue: number }>;
  forecastSeries: Array<{ month: string; committed: number; forecast: number }>;
  velocitySeries: Array<{ stage: string; days: number }>;
  quotaSeries: Array<{ name: string; quota: number; revenue: number }>;
  activitySeries: Array<{ week: string; calls: number; demos: number }>;
};
