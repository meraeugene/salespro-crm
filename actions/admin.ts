"use server";

import { createClient as createSupabaseAdmin } from "@supabase/supabase-js";
import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import type { Role } from "@/types/crm";

export type AdminActionState = {
  ok: boolean;
  message: string;
  recoveryLink?: string;
  tempPassword?: string;
  fieldErrors?: Record<string, string[] | undefined>;
};

export type AdminUserRow = {
  id: string;
  fullName: string;
  email: string;
  role: Role;
  avatarUrl: string | null;
  managerId: string | null;
  lastSignInAt: string | null;
  ipAddress: string | null;
  location: string | null;
  network: string | null;
};

const defaultState: AdminActionState = {
  ok: false,
  message: "",
};

const adminAssignableRoles = new Set<Role>(["admin", "sales_manager", "sales_representative"]);

async function requireAdminClient() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return { error: "You need to sign in again." };
  }

  const { data: profile } = await supabase.from("profiles").select("role").eq("id", user.id).maybeSingle();
  if (profile?.role !== "admin") {
    return { error: "Only admins can manage accounts." };
  }

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!supabaseUrl || !serviceRoleKey) {
    return { error: "Add SUPABASE_SERVICE_ROLE_KEY to enable admin account actions." };
  }

  return {
    admin: createSupabaseAdmin(supabaseUrl, serviceRoleKey, {
      auth: {
        persistSession: false,
        autoRefreshToken: false,
      },
    }),
  };
}

export async function createAccountAction(
  _previousState: AdminActionState,
  formData: FormData,
): Promise<AdminActionState> {
  const fullName = String(formData.get("full_name") ?? "").trim();
  const email = String(formData.get("email") ?? "").trim().toLowerCase();
  const role = String(formData.get("role") ?? "").trim() as Role;
  const tempPassword = String(formData.get("temp_password") ?? "").trim();

  if (fullName.length < 2 || !email.includes("@") || !adminAssignableRoles.has(role) || tempPassword.length < 12) {
    return {
      ...defaultState,
      message: "",
      fieldErrors: {
        full_name: fullName.length < 2 ? ["Enter a name."] : undefined,
        email: !email.includes("@") ? ["Enter a valid email."] : undefined,
        role: !adminAssignableRoles.has(role) ? ["Choose a role."] : undefined,
        temp_password: tempPassword.length < 12 ? ["Use 12+ characters."] : undefined,
      },
    };
  }

  const { admin, error } = await requireAdminClient();
  if (error || !admin) return { ...defaultState, message: error ?? "Unable to open admin client." };

  const { data, error: createError } = await admin.auth.admin.createUser({
    email,
    password: tempPassword,
    email_confirm: true,
    user_metadata: {
      full_name: fullName,
      role,
    },
  });

  if (createError || !data.user) {
    return { ...defaultState, message: createError?.message ?? "Unable to create account." };
  }

  const { error: profileError } = await admin.from("profiles").upsert(
    {
      id: data.user.id,
      full_name: fullName,
      email,
      role,
      avatar_url: null,
      manager_id: null,
    },
    { onConflict: "id" },
  );

  if (profileError) {
    return { ...defaultState, message: `Account created, but profile sync failed: ${profileError.message}` };
  }

  revalidatePath("/team");
  return {
    ok: true,
    message: `Created ${email}.`,
    tempPassword,
  };
}

export async function recoverAccountAction(
  _previousState: AdminActionState,
  formData: FormData,
): Promise<AdminActionState> {
  const email = String(formData.get("email") ?? "").trim().toLowerCase();

  if (!email.includes("@")) {
    return { ...defaultState, message: "", fieldErrors: { email: ["Enter a valid email."] } };
  }

  const { admin, error } = await requireAdminClient();
  if (error || !admin) return { ...defaultState, message: error ?? "Unable to open admin client." };

  const { data, error: recoveryError } = await admin.auth.admin.generateLink({
    type: "recovery",
    email,
  });

  if (recoveryError) {
    return { ...defaultState, message: recoveryError.message };
  }

  return {
    ok: true,
    message: `Generated recovery link for ${email}.`,
    recoveryLink: data.properties?.action_link,
  };
}

export async function updateAccountAction(
  _previousState: AdminActionState,
  formData: FormData,
): Promise<AdminActionState> {
  const id = String(formData.get("id") ?? "").trim();
  const fullName = String(formData.get("full_name") ?? "").trim();
  const email = String(formData.get("email") ?? "").trim().toLowerCase();
  const role = String(formData.get("role") ?? "").trim() as Role;

  if (!id || fullName.length < 2 || !email.includes("@") || !adminAssignableRoles.has(role)) {
    return {
      ...defaultState,
      message: "",
      fieldErrors: {
        full_name: fullName.length < 2 ? ["Enter a name."] : undefined,
        role: !adminAssignableRoles.has(role) ? ["Choose a role."] : undefined,
      },
    };
  }

  const { admin, error } = await requireAdminClient();
  if (error || !admin) return { ...defaultState, message: error ?? "Unable to open admin client." };

  const { error: authError } = await admin.auth.admin.updateUserById(id, {
    user_metadata: {
      full_name: fullName,
      role,
    },
  });

  if (authError) return { ...defaultState, message: authError.message };

  const { error: profileError } = await admin
    .from("profiles")
    .update({ full_name: fullName, email, role, updated_at: new Date().toISOString() })
    .eq("id", id);

  if (profileError) return { ...defaultState, message: profileError.message };

  revalidatePath("/team");
  return { ok: true, message: `Updated ${email}.` };
}

export async function deleteAccountAction(
  _previousState: AdminActionState,
  formData: FormData,
): Promise<AdminActionState> {
  const id = String(formData.get("id") ?? "").trim();
  if (!id) return { ...defaultState, message: "Missing user id." };

  const { admin, error } = await requireAdminClient();
  if (error || !admin) return { ...defaultState, message: error ?? "Unable to open admin client." };

  const { error: deleteError } = await admin.auth.admin.deleteUser(id);
  if (deleteError) return { ...defaultState, message: deleteError.message };

  revalidatePath("/team");
  return { ok: true, message: "Deleted account." };
}
