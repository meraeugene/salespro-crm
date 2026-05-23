"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { passwordSettingsSchema, profileSettingsSchema } from "@/validations/crm";

export type SettingsActionState = {
  ok: boolean;
  message: string;
  fieldErrors?: Record<string, string[] | undefined>;
};

const defaultState = {
  ok: false,
  message: "",
} satisfies SettingsActionState;

export async function updateProfileAction(
  _previousState: SettingsActionState,
  formData: FormData,
): Promise<SettingsActionState> {
  const parsed = profileSettingsSchema.safeParse({
    full_name: formData.get("full_name"),
    avatar_url: formData.get("avatar_url"),
  });

  if (!parsed.success) {
    return {
      ...defaultState,
      message: "",
      fieldErrors: parsed.error.flatten().fieldErrors,
    };
  }

  const supabase = await createClient();
  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser();

  if (authError || !user) {
    return { ...defaultState, message: "You need to sign in again." };
  }

  const { error: profileError } = await supabase
    .from("profiles")
    .update({
      full_name: parsed.data.full_name,
      avatar_url: parsed.data.avatar_url,
      updated_at: new Date().toISOString(),
    })
    .eq("id", user.id);

  if (profileError) {
    return { ...defaultState, message: "Unable to update your profile." };
  }

  const { error: userError } = await supabase.auth.updateUser({
    data: {
      full_name: parsed.data.full_name,
      avatar_url: parsed.data.avatar_url,
    },
  });

  if (userError) {
    return { ...defaultState, message: "Profile saved, but auth metadata could not be updated." };
  }

  revalidatePath("/settings");
  revalidatePath("/", "layout");

  return {
    ok: true,
    message: "Profile updated successfully.",
  };
}

export async function updatePasswordAction(
  _previousState: SettingsActionState,
  formData: FormData,
): Promise<SettingsActionState> {
  const parsed = passwordSettingsSchema.safeParse({
    password: formData.get("password"),
    confirmPassword: formData.get("confirmPassword"),
  });

  if (!parsed.success) {
    return {
      ...defaultState,
      message: "",
      fieldErrors: parsed.error.flatten().fieldErrors,
    };
  }

  const supabase = await createClient();
  const { error } = await supabase.auth.updateUser({
    password: parsed.data.password,
  });

  if (error) {
    return { ...defaultState, message: "Unable to update your password." };
  }

  revalidatePath("/settings");

  return {
    ok: true,
    message: "Password updated successfully.",
  };
}
