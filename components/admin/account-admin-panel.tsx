"use client";

import { useActionState, useEffect, useState } from "react";
import { AlertCircle, CheckCircle2, Clock3, KeyRound, Loader2, RefreshCcw, Save, Trash2, UserPlus, Users, Wrench } from "lucide-react";
import { useFormStatus } from "react-dom";
import { toast } from "sonner";
import {
  createAccountAction,
  deleteAccountAction,
  recoverAccountAction,
  updateAccountAction,
  type AdminActionState,
  type AdminUserRow,
} from "@/actions/admin";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input, Select } from "@/components/ui/input";
import { roleLabels } from "@/lib/auth";
import type { LucideIcon } from "lucide-react";

const initialState: AdminActionState = {
  ok: false,
  message: "",
};

const adminTabs: Array<{ value: "users" | "accounts" | "logs"; label: string; icon: LucideIcon }> = [
  { value: "users", label: "Users", icon: Users },
  { value: "accounts", label: "Account Tools", icon: Wrench },
  { value: "logs", label: "Login Logs", icon: Clock3 },
];

function AdminSubmitButton({ label }: { label: string }) {
  const { pending } = useFormStatus();

  return (
    <Button type="submit" disabled={pending}>
      {pending ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
      {pending ? "Working..." : label}
    </Button>
  );
}

function IconSubmitButton({ label, icon: Icon, formId, variant = "secondary", pending: externalPending }: { label: string; icon: LucideIcon; formId?: string; variant?: "secondary" | "danger"; pending?: boolean }) {
  const { pending } = useFormStatus();
  const isPending = externalPending ?? pending;

  return (
    <Button form={formId} type="submit" size="sm" variant={variant} disabled={isPending} aria-label={label}>
      {isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Icon className="h-4 w-4" />}
    </Button>
  );
}

function RequiredLabel({ children }: { children: string }) {
  return (
    <span className="mb-2 block">
      {children} <span className="text-red-500">*</span>
    </span>
  );
}

function ResultMessage({ state }: { state: AdminActionState }) {
  if (!state.message || state.ok) return null;

  return (
    <div className={state.ok ? "mt-2 rounded-lg border border-border bg-white p-3 text-sm text-muted" : "mt-2 flex gap-2 rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-700"}>
      {state.ok ? <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-emerald-600" /> : <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" />}
      <div>
        <p>{state.message}</p>
      {state.tempPassword ? <p className="mt-1 font-mono text-xs">Temporary password: {state.tempPassword}</p> : null}
      {state.recoveryLink ? <p className="mt-1 break-all font-mono text-xs">{state.recoveryLink}</p> : null}
      </div>
    </div>
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

function AccountRow({ user }: { user: AdminUserRow }) {
  const [updateState, updateAction, updatePending] = useActionState(updateAccountAction, initialState);
  const [deleteState, deleteAction, deletePending] = useActionState(deleteAccountAction, initialState);

  useEffect(() => {
    if (updateState.ok && updateState.message) toast.success(updateState.message);
  }, [updateState]);

  useEffect(() => {
    if (deleteState.ok && deleteState.message) toast.success(deleteState.message);
  }, [deleteState]);

  return (
    <tr>
      <td className="px-3 py-3 align-top">
        {user.avatarUrl ? (
          <img src={user.avatarUrl} alt="" className="h-9 w-9 rounded-full object-cover" />
        ) : (
          <span className="flex h-9 w-9 items-center justify-center rounded-full bg-blue-50 text-xs font-semibold text-primary">
            {user.fullName.slice(0, 2).toUpperCase()}
          </span>
        )}
      </td>
      <td className="px-3 py-3 align-top">
        <form id={`update-${user.id}`} action={updateAction}>
          <input type="hidden" name="id" value={user.id} />
          <input type="hidden" name="email" value={user.email} />
          <Input name="full_name" defaultValue={user.fullName} className={`h-9 ${updateState.fieldErrors?.full_name?.[0] ? "border-red-500 focus:border-red-500 focus:ring-red-100" : ""}`} />
          <FieldError message={updateState.fieldErrors?.full_name?.[0]} />
        </form>
        <ResultMessage state={updateState.message ? updateState : deleteState} />
      </td>
      <td className="px-3 py-3 align-top">
        <Input value={user.email} disabled className="h-9 bg-slate-50 text-muted" />
      </td>
      <td className="px-3 py-3 align-top">
        <Select form={`update-${user.id}`} name="role" defaultValue={user.role} className={`h-9 ${updateState.fieldErrors?.role?.[0] ? "border-red-500 focus:border-red-500 focus:ring-red-100" : ""}`}>
          <option value="admin">{roleLabels.admin}</option>
          <option value="sales_manager">{roleLabels.sales_manager}</option>
          <option value="sales_representative">{roleLabels.sales_representative}</option>
        </Select>
        <FieldError message={updateState.fieldErrors?.role?.[0]} />
      </td>
      <td className="px-3 py-3 align-top">
        <div className="flex gap-2">
          <IconSubmitButton label={`Save ${user.email}`} icon={Save} formId={`update-${user.id}`} pending={updatePending} />
          <form action={deleteAction}>
            <input type="hidden" name="id" value={user.id} />
            <IconSubmitButton label={`Delete ${user.email}`} icon={Trash2} variant="danger" pending={deletePending} />
          </form>
        </div>
      </td>
    </tr>
  );
}

function formatLoginTime(value: string | null) {
  if (!value) return "Never";
  return new Intl.DateTimeFormat("en", {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(new Date(value));
}

export function AccountAdminPanel({ users }: { users: AdminUserRow[] }) {
  const [tab, setTab] = useState<"users" | "accounts" | "logs">("users");
  const [createState, createAction] = useActionState(createAccountAction, initialState);
  const [recoverState, recoverAction] = useActionState(recoverAccountAction, initialState);
  const [tempPassword, setTempPassword] = useState("");
  const recoverHasError = Boolean(recoverState.message && !recoverState.ok);

  function generateStrongPassword() {
    const alphabet = "ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnopqrstuvwxyz23456789";
    const symbols = "!@#$%";
    const bytes = crypto.getRandomValues(new Uint32Array(14));
    const body = Array.from(bytes, (value) => alphabet[value % alphabet.length]).join("");
    setTempPassword(`${body}${symbols[bytes[0] % symbols.length]}9`);
  }

  useEffect(() => {
    if (!createState.ok || !createState.message) return;
    toast.success(createState.message, {
      description: createState.tempPassword ? `Temporary password: ${createState.tempPassword}` : undefined,
    });
  }, [createState]);

  useEffect(() => {
    if (!recoverState.ok || !recoverState.message) return;
    toast.success(recoverState.message, {
      description: recoverState.recoveryLink ?? undefined,
    });
  }, [recoverState]);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-semibold">Admin</h1>
        <p className="mt-1 text-muted">Add managers and sales representatives, recover access, and keep role assignments ready for CRM ownership.</p>
      </div>

      <div className="flex flex-wrap gap-2">
        {adminTabs.map(({ value, label, icon: Icon }) => (
          <button
            key={value}
            type="button"
            onClick={() => setTab(value as "users" | "accounts" | "logs")}
            className={tab === value ? "inline-flex h-10 cursor-pointer items-center gap-2 rounded-lg bg-primary px-4 text-sm font-medium text-white" : "inline-flex h-10 cursor-pointer items-center gap-2 rounded-lg border border-border bg-white px-4 text-sm font-medium text-muted hover:bg-blue-50 hover:text-primary"}
          >
            <Icon className="h-4 w-4" />
            {label}
          </button>
        ))}
      </div>

      {tab === "accounts" ? <div className="grid gap-6 xl:grid-cols-[1.1fr_.9fr]">
        <Card>
          <CardHeader className="items-start py-6">
            <div className="flex items-center gap-3">
              <span className="flex h-11 w-11 items-center justify-center rounded-xl bg-blue-50 text-primary">
                <UserPlus className="h-5 w-5" />
              </span>
              <div>
                <CardTitle>Create Account</CardTitle>
                <p className="mt-1 text-sm text-muted">Provision a user with a role and temporary password.</p>
              </div>
            </div>
          </CardHeader>
          <CardContent className="pb-6">
            <form action={createAction} className="space-y-5" noValidate>
              <div className="grid gap-5 md:grid-cols-2">
                <label className="text-sm font-medium">
                  <RequiredLabel>Full name</RequiredLabel>
                  <Input name="full_name" placeholder="Maya Chen" className={createState.fieldErrors?.full_name?.[0] ? "border-red-500 focus:border-red-500 focus:ring-red-100" : ""} required />
                  <FieldError message={createState.fieldErrors?.full_name?.[0]} />
                </label>
                <label className="text-sm font-medium">
                  <RequiredLabel>Email</RequiredLabel>
                  <Input name="email" type="email" placeholder="user@salespro.test" className={createState.fieldErrors?.email?.[0] ? "border-red-500 focus:border-red-500 focus:ring-red-100" : ""} required />
                  <FieldError message={createState.fieldErrors?.email?.[0]} />
                </label>
              </div>
              <div className="grid gap-5 md:grid-cols-2">
                <label className="text-sm font-medium">
                  <RequiredLabel>Role</RequiredLabel>
                  <Select name="role" defaultValue="sales_manager" className={createState.fieldErrors?.role?.[0] ? "border-red-500 focus:border-red-500 focus:ring-red-100" : ""} required>
                    <option value="sales_manager">Sales Manager</option>
                    <option value="sales_representative">Sales Representative</option>
                    <option value="admin">Admin</option>
                  </Select>
                  <FieldError message={createState.fieldErrors?.role?.[0]} />
                </label>
                <label className="text-sm font-medium">
                  <RequiredLabel>Temporary password</RequiredLabel>
                  <Input
                    name="temp_password"
                    value={tempPassword}
                    onChange={(event) => setTempPassword(event.target.value)}
                    placeholder="Enter or generate a password"
                    className={createState.fieldErrors?.temp_password?.[0] ? "border-red-500 focus:border-red-500 focus:ring-red-100" : ""}
                    required
                  />
                  <button
                    type="button"
                    onClick={generateStrongPassword}
                    className="mt-2 inline-flex cursor-pointer items-center gap-1.5 text-xs font-medium text-primary hover:text-blue-700"
                  >
                    <RefreshCcw className="h-3.5 w-3.5" />
                    Generate strong password
                  </button>
                  <FieldError message={createState.fieldErrors?.temp_password?.[0]} />
                </label>
              </div>
              <ResultMessage state={createState} />
              <AdminSubmitButton label="Create account" />
            </form>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="items-start py-6">
            <div className="flex items-center gap-3">
              <span className="flex h-11 w-11 items-center justify-center rounded-xl bg-blue-50 text-primary">
                <KeyRound className="h-5 w-5" />
              </span>
              <div>
                <CardTitle>Recover Account</CardTitle>
                <p className="mt-1 text-sm text-muted">Generate a password recovery link for a user.</p>
              </div>
            </div>
          </CardHeader>
          <CardContent className="pb-6">
            <form action={recoverAction} className="space-y-5" noValidate>
              <label className="text-sm font-medium">
                  <RequiredLabel>Account email</RequiredLabel>
                <Input name="email" type="email" placeholder="manager@salespro.test" className={recoverState.fieldErrors?.email?.[0] || recoverHasError ? "border-red-500 focus:border-red-500 focus:ring-red-100" : ""} required />
                <FieldError message={recoverState.fieldErrors?.email?.[0]} />
              </label>
              <ResultMessage state={recoverState} />
              <div className="mt-4">
                <AdminSubmitButton label="Generate recovery link" />
              </div>
            </form>
          </CardContent>
        </Card>
      </div> : null}

      {tab === "users" ? <Card>
        <CardHeader className="items-start py-6">
          <div>
            <CardTitle>Users</CardTitle>
            <p className="mt-1 text-sm text-muted">Review accounts, roles, and available login metadata.</p>
          </div>
          <Button type="button" size="sm" onClick={() => setTab("accounts")}>
            <UserPlus className="h-4 w-4" />
            Add User
          </Button>
        </CardHeader>
        <CardContent className="overflow-x-auto pb-6">
          <table className="w-full min-w-[1040px] text-left text-sm">
            <thead>
              <tr className="border-b border-border text-xs uppercase tracking-wide text-muted">
                <th className="px-3 py-3 font-semibold">Profile</th>
                <th className="px-3 py-3 font-semibold">Name</th>
                <th className="px-3 py-3 font-semibold">Email</th>
                <th className="px-3 py-3 font-semibold">Role</th>
                <th className="px-3 py-3 font-semibold">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {users.map((user) => (
                <AccountRow key={user.id} user={user} />
              ))}
            </tbody>
          </table>
        </CardContent>
      </Card> : null}

      {tab === "logs" ? (
        <Card>
          <CardHeader className="items-start py-6">
            <div className="flex items-center gap-3">
              <span className="flex h-11 w-11 items-center justify-center rounded-xl bg-blue-50 text-primary">
                <Clock3 className="h-5 w-5" />
              </span>
              <div>
                <CardTitle>Login Logs</CardTitle>
                <p className="mt-1 text-sm text-muted">Last sign-in times from Supabase Auth.</p>
              </div>
            </div>
          </CardHeader>
          <CardContent className="pb-6">
            <div className="divide-y divide-border">
              <div className="grid grid-cols-[1fr_180px_160px_160px_160px] gap-4 border-b border-border py-3 text-xs font-semibold uppercase tracking-wide text-muted">
                <span>User</span>
                <span>Last login</span>
                <span>IP address</span>
                <span>Location</span>
                <span>Network</span>
              </div>
              {users.map((user) => (
                <div key={user.id} className="grid grid-cols-[1fr_180px_160px_160px_160px] items-center gap-4 py-4">
                  <div className="flex items-center gap-3">
                    {user.avatarUrl ? <img src={user.avatarUrl} alt="" className="h-9 w-9 rounded-full object-cover" /> : <span className="flex h-9 w-9 items-center justify-center rounded-full bg-blue-50 text-xs font-semibold text-primary">{user.fullName.slice(0, 2).toUpperCase()}</span>}
                    <div>
                      <div className="font-medium">{user.fullName}</div>
                      <div className="text-sm text-muted">{user.email}</div>
                    </div>
                  </div>
                  <div className="text-sm text-muted">{formatLoginTime(user.lastSignInAt)}</div>
                  <div className="text-sm text-muted">{user.ipAddress ?? "Not tracked"}</div>
                  <div className="text-sm text-muted">{user.location ?? "Not tracked"}</div>
                  <div className="text-sm text-muted">{user.network ?? "Not tracked"}</div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      ) : null}
    </div>
  );
}
