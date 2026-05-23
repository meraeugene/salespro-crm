import { createClient as createSupabaseAdmin } from "@supabase/supabase-js";
import { AccountAdminPanel } from "@/components/admin/account-admin-panel";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { profiles } from "@/lib/mock-data";
import { createClient } from "@/lib/supabase/server";
import type { Role } from "@/types/crm";
import type { AdminUserRow } from "@/actions/admin";

export default async function TeamPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  const { data: profile } = user
    ? await supabase.from("profiles").select("role").eq("id", user.id).maybeSingle()
    : { data: null };
  const role = (profile?.role ?? user?.user_metadata.role) as Role | undefined;

  if (role === "admin") {
    let users: AdminUserRow[] = profiles.map((item) => ({
      id: item.id,
      fullName: item.full_name,
      email: item.email,
      role: item.role as Role,
      avatarUrl: null,
      managerId: null,
      lastSignInAt: null,
      ipAddress: null,
      location: null,
      network: null,
    }));

    if (process.env.NEXT_PUBLIC_SUPABASE_URL && process.env.SUPABASE_SERVICE_ROLE_KEY) {
      const admin = createSupabaseAdmin(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY, {
        auth: {
          persistSession: false,
          autoRefreshToken: false,
        },
      });
      const [{ data: profileRows }, { data: authUsers }] = await Promise.all([
        admin
          .from("profiles")
          .select("id, full_name, email, role, avatar_url, manager_id, last_login_at, last_login_ip, last_login_location, last_login_network")
          .neq("id", user?.id ?? "")
          .order("created_at", { ascending: false }),
        admin.auth.admin.listUsers({ page: 1, perPage: 200 }),
      ]);
      const authUsersById = new Map((authUsers?.users ?? []).map((authUser) => [authUser.id, authUser]));

      users = (profileRows ?? []).map((item) => {
        const authUser = authUsersById.get(item.id);
        return {
          id: item.id,
          fullName: item.full_name,
          email: item.email,
          role: item.role as Role,
          avatarUrl: item.avatar_url,
          managerId: item.manager_id,
          lastSignInAt: item.last_login_at ?? authUser?.last_sign_in_at ?? null,
          ipAddress: item.last_login_ip ?? null,
          location: item.last_login_location ?? null,
          network: item.last_login_network ?? null,
        };
      });
    }

    return <AccountAdminPanel users={users} />;
  }

  const { data: teamProfiles } = await supabase
    .from("profiles")
    .select("id, full_name, email, role, avatar_url, manager_id")
    .neq("id", user?.id ?? "")
    .order("full_name");
  const rows = teamProfiles?.length ? teamProfiles : profiles.filter((item) => item.id !== user?.id);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-semibold">Team</h1>
        <p className="mt-1 text-muted">Review managers and sales representatives so leads, contacts, deals, and tasks have clear owners.</p>
      </div>
      <Card>
        <CardHeader>
          <CardTitle>Team</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="divide-y divide-border">
            {rows.map((item) => (
              <div key={item.id} className="flex items-center justify-between gap-4 py-4">
                <div className="flex items-center gap-3">
                  {"avatar_url" in item && item.avatar_url ? (
                    <img src={item.avatar_url} alt="" className="h-10 w-10 rounded-full object-cover" />
                  ) : (
                    <span className="flex h-10 w-10 items-center justify-center rounded-full bg-blue-50 text-xs font-semibold text-primary">
                      {item.full_name.slice(0, 2).toUpperCase()}
                    </span>
                  )}
                  <div>
                    <h3 className="font-semibold">{item.full_name}</h3>
                    <p className="text-sm text-muted">{item.email}</p>
                  </div>
                </div>
                <div className="rounded-full bg-blue-50 px-3 py-1 text-sm text-primary">{String(item.role).replace("_", " ")}</div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
