"use client";

import { useActionState, useRef, useState } from "react";
import { useEffect } from "react";
import type { ChangeEvent } from "react";
import {
  AlertCircle,
  Eye,
  EyeOff,
  ImagePlus,
  Loader2,
  Trash2,
} from "lucide-react";
import { useFormStatus } from "react-dom";
import { toast } from "sonner";
import {
  updatePasswordAction,
  updateProfileAction,
  type SettingsActionState,
} from "@/actions/settings";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

const initialState: SettingsActionState = {
  ok: false,
  message: "",
};

function SubmitButton({
  label,
  className,
}: {
  label: string;
  className?: string;
}) {
  const { pending } = useFormStatus();

  return (
    <Button type="submit" disabled={pending} className={className}>
      {pending ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
      {pending ? "Saving..." : label}
    </Button>
  );
}

function FieldError({ message }: { message?: string }) {
  if (!message) return null;
  return (
    <p className="mt-1.5 flex items-center gap-1.5 text-xs font-medium text-red-600">
      <AlertCircle className="h-3.5 w-3.5" />
      {message}
    </p>
  );
}

function FormMessage({ state }: { state: SettingsActionState }) {
  if (!state.message || state.ok) return null;
  return (
    <p className="mt-2 flex items-center gap-2 rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-700">
      <AlertCircle className="h-4 w-4" />
      {state.message}
    </p>
  );
}

export function ProfileSettingsForm({
  fullName,
  avatarUrl,
}: {
  fullName: string;
  email: string;
  role: string;
  avatarUrl?: string | null;
}) {
  const [state, formAction] = useActionState(updateProfileAction, initialState);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [selectedAvatar, setSelectedAvatar] = useState(avatarUrl ?? "");
  const nameParts = fullName.split(/\s+/).filter(Boolean);
  const [firstName, setFirstName] = useState(nameParts[0] ?? "");
  const [lastName, setLastName] = useState(nameParts.slice(1).join(" "));
  const initials =
    fullName
      .split(/\s+/)
      .filter(Boolean)
      .slice(0, 2)
      .map((part) => part[0]?.toUpperCase() ?? "")
      .join("") || "SU";

  function handleAvatarChange(event: ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = () => {
      if (typeof reader.result === "string") {
        setSelectedAvatar(reader.result);
      }
    };
    reader.readAsDataURL(file);
  }

  useEffect(() => {
    if (state.ok && state.message) toast.success(state.message);
  }, [state]);

  const fullNameValue = `${firstName} ${lastName}`.trim();

  return (
    <section className="rounded-xl border border-border bg-white p-6 shadow-[0_18px_45px_rgba(17,24,39,0.06)]">
      <div>
        <h3 className="text-lg font-semibold">My Profile</h3>
      </div>
      <div className="pt-5">
        <form action={formAction} className="space-y-5">
          <input type="hidden" name="avatar_url" value={selectedAvatar} />
          <input type="hidden" name="full_name" value={fullNameValue} />
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center">
            <div className="relative flex h-16 w-16 shrink-0 items-center justify-center overflow-hidden rounded-full border border-blue-100 bg-blue-50 text-base font-semibold text-primary">
              {selectedAvatar ? (
                <img
                  src={selectedAvatar}
                  alt=""
                  className="h-full w-full object-cover"
                />
              ) : (
                initials
              )}
            </div>
            <div className="flex flex-wrap items-center gap-3">
              <Button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                className="bg-primary text-white hover:bg-primary-dark"
              >
                <ImagePlus className="h-4 w-4" />
                Change Image
              </Button>
              <Button
                type="button"
                variant="secondary"
                onClick={() => setSelectedAvatar("")}
              >
                <Trash2 className="h-4 w-4" />
                Remove Image
              </Button>
              <p className="w-full text-xs text-muted">
                We support PNGs, JPEGs and GIFs under 2MB
              </p>
            </div>
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              className="sr-only"
              onChange={handleAvatarChange}
            />
            <FieldError message={state.fieldErrors?.avatar_url?.[0]} />
          </div>

          <div className="grid gap-4 md:grid-cols-2">
            <label className="text-sm font-medium">
              <span className="mb-2 block">First Name</span>
              <Input
                value={firstName}
                onChange={(event) => setFirstName(event.target.value)}
                className={
                  state.fieldErrors?.full_name?.[0]
                    ? "border-red-500 focus:border-red-500 focus:ring-red-100"
                    : ""
                }
              />
              <FieldError message={state.fieldErrors?.full_name?.[0]} />
            </label>

            <label className="text-sm font-medium">
              <span className="mb-2 block">Last Name</span>
              <Input
                value={lastName}
                onChange={(event) => setLastName(event.target.value)}
              />
            </label>
          </div>

          <FormMessage state={state} />

          <div className="flex justify-end">
            <SubmitButton
              label="Save profile"
              className="bg-primary text-white hover:bg-primary-dark"
            />
          </div>
        </form>
      </div>
    </section>
  );
}

export function PasswordSettingsForm() {
  const [state, formAction] = useActionState(
    updatePasswordAction,
    initialState,
  );
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  useEffect(() => {
    if (state.ok && state.message) toast.success(state.message);
  }, [state]);

  return (
    <section className="rounded-xl border border-border bg-white p-6 shadow-[0_18px_45px_rgba(17,24,39,0.06)]">
      <div>
        <h3 className="text-lg font-semibold">Change Password</h3>
      </div>
      <div className="pt-5">
        <form action={formAction} className="grid gap-4 md:grid-cols-2">
          <label className="text-sm font-medium">
            <span className="mb-2 block">New password</span>
            <div className="relative">
              <Input
                name="password"
                type={showPassword ? "text" : "password"}
                placeholder="Enter a strong password"
                className={`pr-11 ${state.fieldErrors?.password?.[0] ? "border-red-500 focus:border-red-500 focus:ring-red-100" : ""}`}
              />
              <button
                type="button"
                onClick={() => setShowPassword((value) => !value)}
                className="absolute right-3 top-1/2 -translate-y-1/2 rounded-md p-1 text-muted hover:bg-blue-50 hover:text-primary"
                aria-label={showPassword ? "Hide password" : "Show password"}
              >
                {showPassword ? (
                  <EyeOff className="h-4 w-4" />
                ) : (
                  <Eye className="h-4 w-4" />
                )}
              </button>
            </div>
            <FieldError message={state.fieldErrors?.password?.[0]} />
          </label>

          <label className="text-sm font-medium">
            <span className="mb-2 block">Confirm password</span>
            <div className="relative">
              <Input
                name="confirmPassword"
                type={showConfirmPassword ? "text" : "password"}
                placeholder="Repeat the new password"
                className={`pr-11 ${state.fieldErrors?.confirmPassword?.[0] ? "border-red-500 focus:border-red-500 focus:ring-red-100" : ""}`}
              />
              <button
                type="button"
                onClick={() => setShowConfirmPassword((value) => !value)}
                className="absolute right-3 top-1/2 -translate-y-1/2 rounded-md p-1 text-muted hover:bg-blue-50 hover:text-primary"
                aria-label={
                  showConfirmPassword ? "Hide password" : "Show password"
                }
              >
                {showConfirmPassword ? (
                  <EyeOff className="h-4 w-4" />
                ) : (
                  <Eye className="h-4 w-4" />
                )}
              </button>
            </div>
            <FieldError message={state.fieldErrors?.confirmPassword?.[0]} />
          </label>

          <div className="md:col-span-2">
            <FormMessage state={state} />
            <SubmitButton
              label="Update password"
              className="mt-2 bg-primary text-white hover:bg-primary-dark"
            />
          </div>
        </form>
      </div>
    </section>
  );
}
