import {
  BarChart3,
  Bell,
  Building2,
  BriefcaseBusiness,
  CheckSquare,
  Gauge,
  NotebookPen,
  Settings,
  ShieldCheck,
  StickyNote,
  Users,
  type LucideIcon,
} from "lucide-react";
import type { Role } from "@/types/crm";

type NavItem = {
  label: string;
  href: string;
  icon: LucideIcon;
  roles: Role[];
};

type NavSection = {
  label: string;
  items: NavItem[];
};

export const navSections: NavSection[] = [
  {
    label: "Workspace",
    items: [
      { label: "Dashboard", href: "/dashboard", icon: Gauge, roles: ["sales_manager", "sales_representative"] },
      { label: "Notifications", href: "/activities", icon: Bell, roles: ["sales_manager", "sales_representative"] },
    ],
  },
  {
    label: "Sales",
    items: [
      { label: "Companies", href: "/companies", icon: Building2, roles: ["sales_manager", "sales_representative"] },
      { label: "Leads", href: "/leads", icon: Users, roles: ["sales_manager", "sales_representative"] },
      { label: "Deals", href: "/deals", icon: BriefcaseBusiness, roles: ["sales_manager", "sales_representative"] },
      { label: "Contacts", href: "/contacts", icon: NotebookPen, roles: ["sales_manager", "sales_representative"] },
    ],
  },
  {
    label: "Follow-up",
    items: [
      { label: "Tasks", href: "/tasks", icon: CheckSquare, roles: ["sales_manager", "sales_representative"] },
      { label: "Notes", href: "/notes", icon: StickyNote, roles: ["sales_manager", "sales_representative"] },
    ],
  },
  {
    label: "Management",
    items: [
      { label: "Analytics", href: "/analytics", icon: BarChart3, roles: ["sales_manager"] },
      { label: "Admin", href: "/team", icon: ShieldCheck, roles: ["admin"] },
    ],
  },
  {
    label: "Account",
    items: [{ label: "Settings", href: "/settings", icon: Settings, roles: ["admin", "sales_manager", "sales_representative"] }],
  },
];

export const navItems = navSections.flatMap((section) => section.items);

export const protectedRoutes = [
  "/dashboard",
  "/leads",
  "/deals",
  "/contacts",
  "/companies",
  "/tasks",
  "/notes",
  "/activities",
  "/analytics",
  "/team",
  "/settings",
] as const;
