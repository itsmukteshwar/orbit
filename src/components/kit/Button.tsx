"use client";

/**
 * Button — the canon button recipes from the reference pages, as a component.
 * Variants map 1:1 to THEME-GUIDE §4. No new styles.
 */

import { forwardRef } from "react";
import type { LucideIcon } from "lucide-react";
import { cn } from "@/lib/utils";

type ButtonVariant = "primary" | "secondary" | "ghost" | "danger";

const VARIANT_CLASSES: Record<ButtonVariant, string> = {
  primary: "bg-orbit-500 text-white shadow-sm hover:bg-orbit-600",
  secondary: "border border-slate-200 bg-white text-slate-600 shadow-card hover:bg-slate-50",
  ghost: "text-slate-500 hover:bg-slate-100",
  danger: "bg-red-500 text-white shadow-sm hover:bg-red-600",
};

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: ButtonVariant;
  icon?: LucideIcon;
  /** Renders a square icon-only button (w-9). Provide aria-label. */
  iconOnly?: boolean;
}

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(function Button(
  { variant = "secondary", icon: Icon, iconOnly, className, children, type = "button", disabled, ...props },
  ref,
) {
  return (
    <button
      ref={ref}
      type={type}
      disabled={disabled}
      className={cn(
        "flex h-9 items-center gap-2 rounded-lg text-sm font-medium transition-colors",
        "focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-orbit-500",
        iconOnly ? "w-9 justify-center" : "px-3.5",
        VARIANT_CLASSES[variant],
        disabled && "cursor-not-allowed opacity-50",
        className,
      )}
      {...props}
    >
      {Icon && <Icon className="h-4 w-4" />}
      {!iconOnly && children}
    </button>
  );
});
