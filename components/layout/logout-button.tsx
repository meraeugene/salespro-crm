"use client";

import { Loader2, LogOut } from "lucide-react";
import { useFormStatus } from "react-dom";
import { Button } from "@/components/ui/button";

export function LogoutButton() {
  const { pending } = useFormStatus();

  return (
    <Button
      type="submit"
      variant="secondary"
      size="icon"
      aria-label="Logout"
      disabled={pending}
      className="shrink-0 border-red-200 text-red-700 hover:bg-red-50 hover:text-red-700 active:bg-red-100"
    >
      {pending ? <Loader2 className="h-4 w-4 animate-spin" /> : <LogOut className="h-4 w-4" />}
    </Button>
  );
}
