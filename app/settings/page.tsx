import { createClient } from "@/lib/supabase/server";
import { AccountSettingsPanel } from "@/components/settings/account-settings-panel";

export default async function SettingsPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  const { data: profile } = user
    ? await supabase
        .from("profiles")
        .select("full_name, email, role, avatar_url")
        .eq("id", user.id)
        .maybeSingle()
    : { data: null };

  const fullName = profile?.full_name ?? user?.user_metadata.full_name ?? user?.email?.split("@")[0] ?? "Sales User";
  const email = profile?.email ?? user?.email ?? "";
  const role = profile?.role ?? "sales_manager";

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-semibold">Account Settings</h1>
        <p className="mt-1 text-muted">Manage your profile details and sign-in security from one place.</p>
      </div>
      <AccountSettingsPanel fullName={fullName} email={email} role={role} avatarUrl={profile?.avatar_url} />
    </div>
  );
}
