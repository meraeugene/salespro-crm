"use server";

import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import { authSchema, forgotPasswordSchema } from "@/validations/crm";

const CREDENTIALS_ERROR = "The email or password you entered is incorrect.";

export type AuthActionResult = {
  ok: boolean;
  error?: string;
  role?: string;
};

export async function signInWithPasswordAction(values: unknown): Promise<AuthActionResult> {
  console.log("[auth] signInWithPasswordAction:start");
  const parsed = authSchema.safeParse(values);
  if (!parsed.success) {
    console.log("[auth] signInWithPasswordAction:validation_failed", parsed.error.flatten().fieldErrors);
    return { ok: false, error: CREDENTIALS_ERROR };
  }

  console.log("[auth] signInWithPasswordAction:attempt", {
    email: parsed.data.email,
  });

  const supabase = await createClient();
  const {
    data: { user },
    error,
  } = await supabase.auth.signInWithPassword({
    email: parsed.data.email,
    password: parsed.data.password,
  });

  if (error || !user) {
    console.log("[auth] signInWithPasswordAction:auth_failed", {
      email: parsed.data.email,
      error: error?.message,
    });
    if (error?.message === "Database error querying schema") {
      return {
        ok: false,
        error: "Supabase Auth is not seeded correctly. Recreate the demo users, then try again.",
      };
    }
    return { ok: false, error: CREDENTIALS_ERROR };
  }

  console.log("[auth] signInWithPasswordAction:auth_success", {
    userId: user.id,
    email: user.email,
  });

  const { data: profile, error: profileError } = await supabase
    .from("profiles")
    .select("role")
    .eq("id", user.id)
    .single();

  if (profileError) {
    console.log("[auth] signInWithPasswordAction:profile_failed", {
      userId: user.id,
      error: profileError.message,
    });
    return { ok: false, error: CREDENTIALS_ERROR };
  }

  console.log("[auth] signInWithPasswordAction:profile_success", {
    userId: user.id,
    role: profile?.role,
  });

  return { ok: true, role: profile?.role };
}

export async function resetPasswordAction(values: unknown, origin: string): Promise<AuthActionResult> {
  console.log("[auth] resetPasswordAction:start");
  const parsed = forgotPasswordSchema.safeParse(values);
  if (!parsed.success) {
    console.log("[auth] resetPasswordAction:validation_failed", parsed.error.flatten().fieldErrors);
    return { ok: false, error: "Enter a valid email address." };
  }

  console.log("[auth] resetPasswordAction:attempt", {
    email: parsed.data.email,
  });

  const supabase = await createClient();
  const { error } = await supabase.auth.resetPasswordForEmail(parsed.data.email, {
    redirectTo: `${origin}/auth/login`,
  });

  if (error) {
    console.log("[auth] resetPasswordAction:failed", {
      email: parsed.data.email,
      error: error.message,
    });
    return { ok: false, error: "Unable to send password reset email." };
  }

  console.log("[auth] resetPasswordAction:success", {
    email: parsed.data.email,
  });

  return { ok: true };
}

export async function signOutAction() {
  const supabase = await createClient();
  await supabase.auth.signOut();
  redirect("/auth/login");
}
