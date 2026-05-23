import type { Company, Contact, DashboardMetrics, Deal, Lead, Note, Task } from "@/types/crm";

export const profiles = [
  { id: "00000000-0000-0000-0000-000000000001", full_name: "Sarah Thompson", email: "sarah@salespro.test", role: "admin" },
  { id: "00000000-0000-0000-0000-000000000002", full_name: "Maya Chen", email: "maya@salespro.test", role: "sales_manager" },
  { id: "00000000-0000-0000-0000-000000000003", full_name: "Jordan Lee", email: "rep@salespro.test", role: "sales_representative" },
] as const;

export const companies: Company[] = [
  { id: "c1", name: "Stellar Dynamics", domain: "stellar.example", industry: "Robotics", size: "250-500", created_at: "2026-01-12" },
  { id: "c2", name: "Acme Inc.", domain: "acme.example", industry: "Manufacturing", size: "500-1000", created_at: "2026-02-02" },
  { id: "c3", name: "Globax Corporation", domain: "globax.example", industry: "Logistics", size: "1000+", created_at: "2026-02-26" },
  { id: "c4", name: "Northstar Labs", domain: "northstar.example", industry: "SaaS", size: "50-250", created_at: "2026-03-07" },
];

export const leads: Lead[] = [
  { id: "l1", full_name: "David Wong", company: "Stellar Dynamics", email: "david@stellar.example", phone: "(555) 817-6516", status: "Qualified", lead_source: "Webinar", assigned_to: profiles[1].id, assigned_user: "Maya Chen", last_contacted: "2026-05-18", notes: "Interested in enterprise rollout.", created_at: "2026-04-13" },
  { id: "l2", full_name: "Benjamin Ross", company: "Acme Inc.", email: "ben@acme.example", phone: "(555) 184-6439", status: "Contacted", lead_source: "Referral", assigned_to: profiles[1].id, assigned_user: "Maya Chen", last_contacted: "2026-05-15", notes: "Needs procurement review.", created_at: "2026-04-18" },
  { id: "l3", full_name: "Grace Anderson", company: "Globax Corporation", email: "grace@globax.example", phone: "(555) 684-4391", status: "Proposal", lead_source: "LinkedIn", assigned_to: profiles[1].id, assigned_user: "Maya Chen", last_contacted: "2026-05-19", notes: "Proposal sent for 120 seats.", created_at: "2026-04-21" },
  { id: "l4", full_name: "Alice Chapman", company: "Northstar Labs", email: "alice@northstar.example", phone: "(555) 787-2280", status: "New", lead_source: "Website", assigned_to: profiles[1].id, assigned_user: "Maya Chen", last_contacted: "2026-05-11", notes: "Requested pricing.", created_at: "2026-05-01" },
  { id: "l5", full_name: "Dominic Richards", company: "Helio Metrics", email: "dominic@helio.example", phone: "(555) 980-1480", status: "Won", lead_source: "Event", assigned_to: profiles[1].id, assigned_user: "Maya Chen", last_contacted: "2026-05-20", notes: "Closed pilot package.", created_at: "2026-05-06" },
  { id: "l6", full_name: "Nadia Patel", company: "Kinetic Works", email: "nadia@kinetic.example", phone: "(555) 421-6670", status: "Qualified", lead_source: "Partner", assigned_to: profiles[1].id, assigned_user: "Maya Chen", last_contacted: "2026-05-17", notes: "Security questionnaire pending.", created_at: "2026-05-08" },
];

export const deals: Deal[] = [
  { id: "d1", title: "Stellar Enterprise CRM", company: "Stellar Dynamics", value: 142000, probability: 80, stage: "Negotiation", assigned_to: profiles[1].id, assigned_user: "Maya Chen", expected_close_date: "2026-06-14", created_at: "2026-04-15" },
  { id: "d2", title: "Acme Sales Hub", company: "Acme Inc.", value: 86000, probability: 60, stage: "Proposal Sent", assigned_to: profiles[1].id, assigned_user: "Maya Chen", expected_close_date: "2026-06-28", created_at: "2026-04-23" },
  { id: "d3", title: "Globax Global Rollout", company: "Globax Corporation", value: 228000, probability: 40, stage: "Qualified", assigned_to: profiles[1].id, assigned_user: "Maya Chen", expected_close_date: "2026-07-03", created_at: "2026-04-29" },
  { id: "d4", title: "Northstar Pilot", company: "Northstar Labs", value: 32000, probability: 20, stage: "Contacted", assigned_to: profiles[1].id, assigned_user: "Maya Chen", expected_close_date: "2026-06-10", created_at: "2026-05-04" },
  { id: "d5", title: "Helio Expansion", company: "Helio Metrics", value: 64000, probability: 100, stage: "Won", assigned_to: profiles[1].id, assigned_user: "Maya Chen", expected_close_date: "2026-05-20", created_at: "2026-05-02" },
  { id: "d6", title: "Kinetic Enablement", company: "Kinetic Works", value: 47500, probability: 10, stage: "New Lead", assigned_to: profiles[1].id, assigned_user: "Maya Chen", expected_close_date: "2026-07-18", created_at: "2026-05-10" },
];

export const contacts: Contact[] = leads.map((lead) => ({
  id: `ct-${lead.id}`,
  full_name: lead.full_name,
  company: lead.company,
  email: lead.email,
  phone: lead.phone,
  title: "Revenue Operations",
  assigned_to: lead.assigned_to,
  created_at: lead.created_at,
}));

export const tasks: Task[] = [
  { id: "t1", title: "Send revised Stellar pricing", description: "Include annual prepay discount.", status: "In Progress", due_date: "2026-05-24", related_type: "deal", related_id: "d1", assigned_to: profiles[1].id, created_at: "2026-05-18" },
  { id: "t2", title: "Call Acme procurement", description: "Confirm legal owner.", status: "Todo", due_date: "2026-05-25", related_type: "lead", related_id: "l2", assigned_to: profiles[1].id, created_at: "2026-05-19" },
  { id: "t3", title: "Prepare Globax stakeholder map", description: "Add buying committee notes.", status: "Done", due_date: "2026-05-21", related_type: "deal", related_id: "d3", assigned_to: profiles[1].id, created_at: "2026-05-15" },
];

export const notes: Note[] = [
  { id: "n1", body: "Stellar wants a June procurement close and multi-region reporting.", related_type: "deal", related_id: "d1", created_by: profiles[1].id, created_at: "2026-05-18" },
  { id: "n2", body: "Acme is comparing SalesPro against two incumbents.", related_type: "lead", related_id: "l2", created_by: profiles[1].id, created_at: "2026-05-16" },
];

export const metrics: DashboardMetrics = {
  totalDealsClosed: 2242,
  revenueGenerated: 842000,
  conversionRate: 25,
  topSalesRep: "Sarah T",
  revenueSeries: [
    { month: "Jan", revenue: 410000, target: 460000 },
    { month: "Mar", revenue: 520000, target: 500000 },
    { month: "Apr", revenue: 330000, target: 380000 },
    { month: "May", revenue: 420000, target: 440000 },
    { month: "Jun", revenue: 334000, target: 520000 },
    { month: "Jul", revenue: 600000, target: 560000 },
    { month: "Aug", revenue: 510000, target: 610000 },
    { month: "Sep", revenue: 500000, target: 540000 },
    { month: "Oct", revenue: 470000, target: 520000 },
    { month: "Nov", revenue: 465000, target: 510000 },
  ],
  sourceSeries: [
    { name: "Website", value: 34 },
    { name: "Referral", value: 26 },
    { name: "Events", value: 22 },
    { name: "Outbound", value: 18 },
  ],
  pipelineProgress: [
    { name: "Completed", value: 41, color: "#1d4ed8" },
    { name: "In Progress", value: 37, color: "#3b82f6" },
    { name: "Pending", value: 22, color: "#dbeafe" },
  ],
  teamPerformance: [
    { name: "Maya", deals: 32, revenue: 434000 },
    { name: "Jordan", deals: 24, revenue: 286000 },
    { name: "Sarah", deals: 42, revenue: 522000 },
    { name: "Noah", deals: 18, revenue: 173000 },
  ],
  forecastSeries: [
    { month: "Jan", committed: 320000, forecast: 360000 },
    { month: "Feb", committed: 350000, forecast: 390000 },
    { month: "Mar", committed: 410000, forecast: 450000 },
    { month: "Apr", committed: 380000, forecast: 420000 },
    { month: "May", committed: 440000, forecast: 500000 },
    { month: "Jun", committed: 470000, forecast: 540000 },
  ],
  velocitySeries: [
    { stage: "New Lead", days: 4 },
    { stage: "Contacted", days: 8 },
    { stage: "Qualified", days: 11 },
    { stage: "Proposal", days: 14 },
    { stage: "Negotiation", days: 9 },
    { stage: "Won", days: 5 },
  ],
  quotaSeries: [
    { name: "Maya", quota: 480000, revenue: 434000 },
    { name: "Jordan", quota: 320000, revenue: 286000 },
    { name: "Sarah", quota: 560000, revenue: 522000 },
    { name: "Noah", quota: 220000, revenue: 173000 },
  ],
  activitySeries: [
    { week: "W1", calls: 48, demos: 12 },
    { week: "W2", calls: 54, demos: 15 },
    { week: "W3", calls: 46, demos: 11 },
    { week: "W4", calls: 62, demos: 18 },
    { week: "W5", calls: 58, demos: 16 },
  ],
};

