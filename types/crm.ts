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
export type ForecastCategory = "Commit" | "Best Case" | "Pipeline";
export type ReviewStatus = "Not Required" | "Pending Review" | "Approved" | "Changes Requested";

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
  created_by?: string | null;
  created_by_user?: string | null;
  created_at: string;
  updated_at?: string | null;
};

export type Contact = {
  id: string;
  full_name: string;
  company: string;
  company_id?: string | null;
  email: string;
  phone: string;
  title?: string | null;
  avatar_url?: string | null;
  preferred_contact_method?: "Email" | "Phone" | "No preference" | null;
  timezone?: string | null;
  best_time_to_contact?: string | null;
  assigned_to?: string | null;
  assigned_user?: string | null;
  created_by?: string | null;
  created_by_user?: string | null;
  created_at: string;
  updated_at?: string | null;
};

export type Deal = {
  id: string;
  title: string;
  company: string;
  company_id?: string | null;
  products_services?: string | null;
  value: number;
  probability: number;
  stage: DealStage;
  loss_reason?: string | null;
  next_step?: string | null;
  next_step_date?: string | null;
  forecast_category?: ForecastCategory | null;
  review_status?: ReviewStatus | null;
  reviewed_by?: string | null;
  reviewed_at?: string | null;
  stage_changed_at?: string | null;
  assigned_to?: string | null;
  assigned_user?: string | null;
  expected_close_date: string;
  created_by?: string | null;
  created_by_user?: string | null;
  created_at: string;
  updated_at?: string | null;
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
  assigned_user?: string | null;
  created_by?: string | null;
  created_by_user?: string | null;
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
  topSalesRepStats?: { name: string; assignedLeads: number; activeDeals: number; wonDeals: number; revenue: number };
  revenueSeries: Array<{ month: string; revenue: number; target: number }>;
  sourceSeries: Array<{ name: string; value: number }>;
  pipelineProgress: Array<{ name: string; value: number; color: string }>;
  teamPerformance: Array<{ name: string; assignedLeads: number; activeDeals: number; wonDeals: number; lostDeals: number; winRate: number; overdueTasks: number; revenue: number }>;
  forecastSeries: Array<{ month: string; commit: number; bestCase: number; pipeline: number }>;
  velocitySeries: Array<{ stage: string; days: number }>;
  quotaSeries: Array<{ name: string; monthlyQuota: number; quarterlyQuota: number; revenue: number; attainment: number }>;
  activitySeries: Array<{ week: string; calls: number; demos: number }>;
};
