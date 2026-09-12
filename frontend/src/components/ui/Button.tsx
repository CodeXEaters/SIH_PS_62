import React, { ButtonHTMLAttributes } from "react";
import { cn } from "@/lib/utils";

export interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: "primary" | "secondary" | "outline" | "ghost" | "danger" | "gold";
  size?: "sm" | "md" | "lg" | "icon";
  isLoading?: boolean;
}

export const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  (
    {
      className,
      variant = "primary",
      size = "md",
      isLoading = false,
      children,
      disabled,
      ...props
    },
    ref
  ) => {
    const baseStyles =
      "inline-flex items-center justify-center font-medium transition-all duration-150 focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-dhruv-signal focus-visible:ring-offset-1 focus-visible:ring-offset-[#050505] disabled:pointer-events-none disabled:opacity-40 select-none rounded tracking-wide";

    const variants = {
      // Primary: Off-white background, black text, subtle hover transition
      primary:
        "bg-[#F5F3EE] text-[#050505] hover:bg-[#FFFFFF] font-semibold border border-[#E7E0D2] active:scale-[0.99] shadow-sm",
      // Secondary: Transparent background, off-white/silver border
      secondary:
        "bg-transparent hover:bg-[#101010] text-[#F5F3EE] border border-[#303030] hover:border-[#444444] active:scale-[0.99]",
      // Outline: Hairline border
      outline:
        "bg-transparent hover:bg-[#101010] text-[#A5A29C] hover:text-[#F5F3EE] border border-[#242424] hover:border-[#383838] active:scale-[0.99]",
      // Ghost: Text only
      ghost:
        "bg-transparent hover:bg-[#101010] text-[#A5A29C] hover:text-[#F5F3EE] active:scale-[0.99]",
      // Danger: Black background, muted red border and text
      danger:
        "bg-[#0A0A0A] hover:bg-[#140808] text-[#B85C5C] border border-[#B85C5C]/50 hover:border-[#B85C5C] active:scale-[0.99]",
      // Signal: high-visibility beacon accent for critical recommendations & confirmations
      gold:
        "bg-[#171716] hover:bg-[#22221F] text-[#E8E4DC] border border-[#E8E4DC]/50 hover:border-[#E8E4DC] font-semibold active:scale-[0.99] shadow-[0_0_18px_rgba(232,228,220,0.1)]",
    };

    const sizes = {
      sm: "h-7 px-2.5 text-xs gap-1.5",
      md: "h-8 px-3.5 text-xs gap-2",
      lg: "h-10 px-5 text-sm gap-2.5",
      icon: "h-8 w-8 p-0",
    };

    return (
      <button
        ref={ref}
        disabled={disabled || isLoading}
        className={cn(baseStyles, variants[variant], sizes[size], className)}
        {...props}
      >
        {isLoading && (
          <svg
            className="animate-spin -ml-1 mr-2 h-3.5 w-3.5 text-current"
            fill="none"
            viewBox="0 0 24 24"
          >
            <circle
              className="opacity-25"
              cx="12"
              cy="12"
              r="10"
              stroke="currentColor"
              strokeWidth="4"
            />
            <path
              className="opacity-75"
              fill="currentColor"
              d="M4 12a8 8 0 018-8v8H4z"
            />
          </svg>
        )}
        {children}
      </button>
    );
  }
);
Button.displayName = "Button";
