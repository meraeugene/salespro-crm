import type { Role } from "@/types/crm";

export const roleLabels: Record<Role, string> = {
  admin: "Admin",
  sales_manager: "Sales Manager",
  sales_representative: "Sales Representative",
};

export const permissions = {
  admin: ["manage_users", "manage_roles", "account_recovery", "settings"],
  sales_manager: ["manage_team", "view_analytics", "assign_leads", "manage_deals", "settings"],
  sales_representative: ["manage_assigned_sales", "settings"],
} as const;

export const routeAccess: Record<string, Role[]> = {
  "/dashboard": ["sales_manager", "sales_representative"],
  "/activities": ["sales_manager", "sales_representative"],
  "/companies": ["sales_manager"],
  "/notes": ["sales_manager", "sales_representative"],
  "/tasks": ["sales_manager", "sales_representative"],
  "/leads": ["sales_manager", "sales_representative"],
  "/deals": ["sales_manager", "sales_representative"],
  "/contacts": ["sales_manager", "sales_representative"],
  "/analytics": ["sales_manager"],
  "/team": ["admin"],
  "/settings": ["admin", "sales_manager", "sales_representative"],
};

export function can(role: Role | undefined, permission: string) {
  if (!role) return false;
  return (permissions[role] as readonly string[]).includes(permission);
}

export function defaultRouteForRole(role?: Role) {
  if (role === "admin") return "/team";
  return "/dashboard";
}

export function canAccessRoute(role: Role | undefined, pathname: string) {
  if (!role) return false;
  const route = Object.keys(routeAccess)
    .sort((a, b) => b.length - a.length)
    .find((item) => pathname.startsWith(item));

  if (!route) return true;
  return routeAccess[route].includes(role);
}
