"use client";

import type { ReactNode } from "react";
import { X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

export function Modal({
  open,
  title,
  children,
  onClose,
  side = false,
}: {
  open: boolean;
  title: string;
  children: ReactNode;
  onClose: () => void;
  side?: boolean;
}) {
  if (!open) return null;

  return (
    <div className={cn("fixed inset-0 z-50 flex bg-black/20 backdrop-blur-sm", side ? "justify-end" : "items-center justify-center p-4")}>
      <div
        className={cn(
          "w-full border border-border bg-white shadow-2xl",
          side ? "h-full max-w-xl animate-[slideInRight_180ms_ease-out] overflow-y-auto" : "max-w-xl rounded-xl",
        )}
      >
        <div className="flex items-center justify-between border-b border-border p-5">
          <h2 className="text-lg font-semibold">{title}</h2>
          <Button variant="ghost" size="icon" onClick={onClose} aria-label="Close dialog" className="rounded-xl bg-blue-50 text-primary hover:bg-blue-100 hover:text-primary-dark">
            <X className="h-4 w-4" />
          </Button>
        </div>
        <div className="p-5">{children}</div>
      </div>
    </div>
  );
}
