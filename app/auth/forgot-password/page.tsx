import { Suspense } from "react";
import { AuthFormFallback } from "@/components/forms/auth-form-fallback";
import { AuthForm } from "@/components/forms/auth-form";

export default function ForgotPasswordPage() {
  return (
    <Suspense fallback={<AuthFormFallback />}>
      <AuthForm mode="forgot" />
    </Suspense>
  );
}
