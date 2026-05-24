import { forwardRef, type ButtonHTMLAttributes } from "react";
import { cn } from "@/lib/utils";

type ButtonProps = ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: "primary" | "secondary" | "ghost" | "danger";
  size?: "sm" | "md" | "icon";
};

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(function Button({ className, variant = "primary", size = "md", ...props }, ref) {
  return (
    <button
      ref={ref}
      className={cn(
        "inline-flex cursor-pointer items-center justify-center gap-2 rounded-lg font-medium outline-none focus-visible:ring-2 focus-visible:ring-primary/70 disabled:cursor-not-allowed disabled:opacity-60",
        size === "sm" && "h-10 px-3 text-sm",
        size === "md" && "h-10 px-4 text-sm",
        size === "icon" && "h-10 w-10",
        variant === "primary" && "bg-primary text-white shadow-sm hover:bg-[#2563eb]",
        variant === "secondary" && "border border-border bg-white text-foreground hover:bg-blue-50 hover:text-primary",
        variant === "ghost" && "text-muted hover:bg-blue-50 hover:text-primary",
        variant === "danger" && "bg-red-50 text-red-700 hover:bg-red-100",
        className,
      )}
      {...props}
    />
  );
});
