"use client";
import { cn } from "@/lib/utils";
import { ButtonHTMLAttributes, forwardRef } from "react";

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: "primary" | "secondary" | "ghost" | "danger";
  size?: "sm" | "md" | "lg";
}

const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant = "primary", size = "md", children, ...props }, ref) => {
    return (
      <button
        ref={ref}
        className={cn(
          "inline-flex items-center justify-center gap-2 font-semibold rounded-lg transition-colors duration-150 disabled:opacity-50 disabled:cursor-not-allowed",
          {
            "bg-brand-500 hover:bg-brand-700 text-white": variant === "primary",
            "bg-white hover:bg-brand-50 text-brand-600 border border-brand-300 hover:border-brand-500": variant === "secondary",
            "bg-transparent hover:bg-slate-100 text-slate-700": variant === "ghost",
            "bg-red-700 hover:bg-red-800 text-white": variant === "danger",
            "px-3.5 py-1.5 text-sm min-h-[36px]": size === "sm",
            "px-5 py-2.5 text-sm min-h-[44px]": size === "md",
            "px-6 py-3 text-base min-h-[48px]": size === "lg",
          },
          className
        )}
        {...props}
      >
        {children}
      </button>
    );
  }
);
Button.displayName = "Button";
export default Button;
