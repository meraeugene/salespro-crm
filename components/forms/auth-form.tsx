"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import type { z } from "zod";
import {
  AlertCircle,
  ArrowLeft,
  BadgeDollarSign,
  Eye,
  EyeOff,
  Loader2,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { resetPasswordAction, signInWithPasswordAction } from "@/actions/auth";
import { defaultRouteForRole } from "@/lib/auth";
import { authSchema, forgotPasswordSchema } from "@/validations/crm";
import type { Role } from "@/types/crm";

type AuthValues = z.infer<typeof authSchema>;
type ForgotValues = z.infer<typeof forgotPasswordSchema>;

export function AuthForm({ mode }: { mode: "login" | "forgot" }) {
  const [message, setMessage] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const router = useRouter();
  const params = useSearchParams();
  const form = useForm<AuthValues | ForgotValues>({
    resolver: zodResolver(
      mode === "forgot" ? forgotPasswordSchema : authSchema,
    ),
    defaultValues: { email: "", password: "" },
  });

  async function onSubmit(values: AuthValues | ForgotValues) {
    setMessage("");
    if (mode === "login") {
      const result = await signInWithPasswordAction(values);
      if (!result.ok) {
        const error =
          result.error ?? "The email or password you entered is incorrect.";
        form.setError("root", { message: error });
        return setMessage(error);
      }
      await fetch("/api/login-metadata", { method: "POST" }).catch(() => null);
      router.push(
        params.get("next") ??
          defaultRouteForRole(result.role as Role | undefined),
      );
      router.refresh();
    }

    if (mode === "forgot") {
      const result = await resetPasswordAction(values, location.origin);
      if (!result.ok) {
        const error = result.error ?? "Unable to send password reset email.";
        form.setError("root", { message: error });
        return setMessage(error);
      }
      setMessage("Password reset link sent.");
    }
  }

  const title = mode === "login" ? "Sign in to SalesPro" : "Reset password";
  const isSubmitting = form.formState.isSubmitting;
  const emailError = form.formState.errors.email?.message;
  const passwordError = "password" in form.formState.errors ? form.formState.errors.password?.message : undefined;

  return (
    <div className="flex min-h-screen items-center bg-[linear-gradient(180deg,#f8fbff_0%,#eef5ff_100%)] p-4 text-foreground sm:p-6">
      <div className="mx-auto grid max-w-6xl overflow-hidden rounded-[28px] border border-[#dbe8ff] bg-white shadow-[0_30px_80px_rgba(37,99,235,0.12)] lg:grid-cols-[0.96fr_1.04fr]">
        <section className="flex items-center justify-center bg-white px-6 py-10 sm:px-12 lg:px-16">
          <div className="mx-auto w-full max-w-lg">
            <div className="mb-10 flex items-center gap-3">
              <span className="flex h-11 w-11 items-center justify-center rounded-xl bg-primary text-white shadow-[0_12px_30px_rgba(59,130,246,0.28)]">
                <BadgeDollarSign className="h-5 w-5" />
              </span>
              <div>
                <h1 className="text-xl font-normal text-blue-600">
                  SalesPro CRM
                </h1>
                <p className="text-sm text-muted">Secure sales workspace</p>
              </div>
            </div>

            <h2 className="text-3xl  text-blue-600 tracking-tight">{title}</h2>
            <p className="mt-3 max-w-md text-base leading-8 text-muted">
              Manage leads, deals, revenue forecasts, and team performance from
              one focused CRM command center.
            </p>

            <form
              className="mt-9 space-y-4"
              onSubmit={form.handleSubmit(onSubmit)}
            >
              <label className="block text-sm font-medium text-foreground">
                Email address
                <Input
                  placeholder="Email address"
                  type="email"
                  aria-invalid={Boolean(emailError)}
                  className={`mt-2 bg-[#fbfdff] placeholder:text-[#8392a8] ${
                    emailError
                      ? "border-red-300 focus:border-red-500 focus:ring-red-100"
                      : "border-[#d7e3f5] focus:border-primary"
                  }`}
                  {...form.register("email")}
                />
                {emailError ? (
                  <span className="mt-1.5 flex items-center gap-1.5 text-xs font-medium text-red-600">
                    <AlertCircle className="h-3.5 w-3.5" />
                    {emailError}
                  </span>
                ) : null}
              </label>

              {mode !== "forgot" ? (
                <label className="block text-sm font-medium text-foreground">
                  Password
                  <div className="relative mt-2">
                    <Input
                      placeholder="Enter your password"
                      type={showPassword ? "text" : "password"}
                      aria-invalid={Boolean(passwordError)}
                      className={`bg-[#fbfdff] pr-11 placeholder:text-[#8392a8] ${
                        passwordError
                          ? "border-red-300 focus:border-red-500 focus:ring-red-100"
                          : "border-[#d7e3f5] focus:border-primary"
                      }`}
                      {...form.register("password")}
                    />
                    <button
                      type="button"
                      className="absolute cursor-pointer right-3 top-1/2 -translate-y-1/2 rounded-md p-1 text-muted hover:bg-blue-50 hover:text-primary"
                      onClick={() => setShowPassword((value) => !value)}
                      aria-label={
                        showPassword ? "Hide password" : "Show password"
                      }
                    >
                      {showPassword ? (
                        <EyeOff className="h-4 w-4" />
                      ) : (
                        <Eye className="h-4 w-4" />
                      )}
                    </button>
                  </div>
                  {passwordError ? (
                    <span className="mt-1.5 flex items-center gap-1.5 text-xs font-medium text-red-600">
                      <AlertCircle className="h-3.5 w-3.5" />
                      {passwordError}
                    </span>
                  ) : null}
                </label>
              ) : null}
              {message ? (
                <div
                  role="alert"
                  className="flex items-start gap-3 rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-700"
                >
                  <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" />
                  <p>{message}</p>
                </div>
              ) : null}
              <Button
                className="h-12 cursor-pointer w-full shadow-[0_16px_30px_rgba(59,130,246,0.24)]"
                type="submit"
                disabled={isSubmitting}
              >
                {isSubmitting ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin" />
                    {mode === "login" ? "Signing in" : "Sending reset link"}
                  </>
                ) : mode === "login" ? (
                  "Sign in"
                ) : (
                  "Send reset link"
                )}
              </Button>
            </form>

            <div className="mt-6 flex justify-between text-sm text-muted">
              {mode !== "forgot" ? (
                <Link
                  href="/auth/forgot-password"
                  className="transition-colors hover:text-foreground"
                >
                  Forgot password?
                </Link>
              ) : (
                <Link
                  href="/auth/login"
                  className="inline-flex items-center gap-2 font-medium text-primary transition-colors hover:text-primary-dark"
                >
                  <ArrowLeft className="h-4 w-4" />
                  Back to login
                </Link>
              )}
            </div>
          </div>
        </section>

        <section className="relative hidden overflow-hidden border-l border-blue-200/50 bg-gradient-to-tr from-blue-50 via-blue-50/40 to-white p-10 lg:block">
          {/* Precision Structural Ambient Lighting */}
          <div className="absolute top-0 left-1/4 right-1/4 h-px bg-gradient-to-r from-transparent via-blue-300/50 to-transparent" />

          {/* Clean, Minimalist Architectural Grid Overlay */}
          <div className="absolute inset-0 bg-[linear-gradient(to_right,#3b82f603_1px,transparent_1px),linear-gradient(to_bottom,#3b82f603_1px,transparent_1px)] bg-[size:32px_32px]" />

          <div className="relative z-10 flex flex-col items-center justify-center gap-12 py-10">
            <div className="relative flex w-full max-w-[560px] justify-center pt-4">
              {/* Top Card: Revenue Win Rate (Frosted Glass) */}
              <div className="relative z-10 w-[320px] rounded-[24px] border border-white/60 bg-white/20 p-6 shadow-[0_25px_50px_rgba(148,163,184,0.12)] backdrop-blur-md">
                <div className="text-xs font-semibold tracking-wider uppercase text-blue-900/50">
                  Revenue win rate
                </div>

                <div className="mt-2 text-3xl font-light tracking-tight text-blue-950">
                  126.6%
                </div>

                {/* Enhanced Blue Bars (Top Card) */}
                <div className="mt-6 flex h-24 items-end gap-3">
                  {[34, 46, 32, 55, 42, 61, 78].map((height, index) => (
                    <span
                      key={index}
                      className="w-7 rounded-t-lg bg-gradient-to-t from-blue-500 to-blue-600 shadow-sm transition-all duration-300 hover:from-blue-600 hover:to-blue-700"
                      style={{ height: `${height}%` }}
                    />
                  ))}
                </div>
              </div>

              {/* Bottom Overlapping Card: Pipeline Trend (Frosted Glass) */}
              <div className="absolute left-1/2 top-52 z-20 w-[500px] -translate-x-1/2 rounded-[24px] border border-white/60 bg-white/20 p-5 shadow-[0_22px_45px_rgba(148,163,184,0.12)] backdrop-blur-md">
                <div className="mb-4 flex items-center justify-between text-xs font-medium tracking-tight text-blue-900/50">
                  <span>Pipeline trend</span>
                  <span className="font-mono  ">May 2026</span>
                </div>

                {/* Enhanced Blue Bars (Bottom Card) */}
                <div className="grid h-28 grid-cols-12 items-end gap-2">
                  {[18, 24, 29, 40, 36, 48, 34, 45, 52, 50, 61, 72].map(
                    (height, index) => (
                      <span
                        key={index}
                        className="rounded-t bg-blue-400/90 transition-all duration-300 hover:bg-blue-500"
                        style={{ height: `${height}%` }}
                      />
                    ),
                  )}
                </div>
              </div>
            </div>

            {/* Content Block Layout */}
            <div className="max-w-xl px-6 pt-32 text-center">
              <h2 className="text-center text-3xl font-normal text-blue-600 tracking-tight">
                Smarter Financial Decisions
              </h2>

              <p className="mt-4 text-center text-base font-normal leading-relaxed text-blue-900/60">
                SalesPro brings pipeline health, lead activity, and revenue
                analytics into enterprise dashboard.
              </p>
            </div>
          </div>
        </section>
      </div>
    </div>
  );
}
