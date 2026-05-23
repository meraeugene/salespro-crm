"use client";

import { useState } from "react";
import { LockKeyhole, UserRound } from "lucide-react";
import {
  PasswordSettingsForm,
  ProfileSettingsForm,
} from "@/components/forms/settings-forms";
import { cn } from "@/lib/utils";

type AccountSettingsPanelProps = {
  fullName: string;
  email: string;
  role: string;
  avatarUrl?: string | null;
};

export function AccountSettingsPanel({
  fullName,
  email,
  role,
  avatarUrl,
}: AccountSettingsPanelProps) {
  const [tab, setTab] = useState<"profile" | "password">("profile");

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap gap-2">
          <button
            type="button"
            onClick={() => setTab("profile")}
            className={cn(
              "inline-flex h-10 items-center gap-2 rounded-lg px-4 text-sm font-medium",
              tab === "profile"
                ? "bg-primary text-white"
                : "border border-border bg-white text-muted hover:bg-blue-50 hover:text-primary",
            )}
          >
            <UserRound className="h-4 w-4" />
            Profile info
          </button>
          <button
            type="button"
            onClick={() => setTab("password")}
            className={cn(
              "inline-flex h-10 items-center gap-2 rounded-lg px-4 text-sm font-medium",
              tab === "password"
                ? "bg-primary text-white"
                : "border border-border bg-white text-muted hover:bg-blue-50 hover:text-primary",
            )}
          >
            <LockKeyhole className="h-4 w-4" />
            Password
          </button>
      </div>
      {tab === "profile" ? (
        <ProfileSettingsForm
          fullName={fullName}
          email={email}
          role={role}
          avatarUrl={avatarUrl}
        />
      ) : (
        <PasswordSettingsForm />
      )}
    </div>
  );
}
