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
    <div className={cn("fixed inset-0 z-50 flex bg-black/20 backdrop-blur-sm", side ? "justify-end" : "items-start justify-center overflow-y-auto p-4 sm:items-center")}>
      <div
        className={cn(
          "flex w-full flex-col border border-border bg-white shadow-2xl",
          side
            ? "h-full max-w-xl animate-[slideInRight_180ms_ease-out] overflow-hidden"
            : "max-h-[80vh] max-w-xl overflow-hidden rounded-xl",
        )}
      >
        <div className="flex shrink-0 items-center justify-between border-b border-border p-5">
          <h2 className="text-lg font-semibold">{title}</h2>
          <Button variant="ghost" size="icon" onClick={onClose} aria-label="Close dialog" className="rounded-xl bg-blue-50 text-primary hover:bg-blue-100 hover:text-primary-dark">
            <X className="h-4 w-4" />
          </Button>
        </div>
        <div className="min-h-0 overflow-y-auto p-5">{children}</div>
      </div>
    </div>
  );
}
