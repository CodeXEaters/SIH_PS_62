import React, { InputHTMLAttributes } from "react";
import { cn } from "@/lib/utils";

export interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
  icon?: React.ReactNode;
}

export const Input = React.forwardRef<HTMLInputElement, InputProps>(
  ({ className, type, icon, ...props }, ref) => {
    return (
      <div className="relative w-full flex items-center">
        {icon && <div className="absolute left-3 text-[#6F6D68] pointer-events-none">{icon}</div>}
        <input
          type={type}
          className={cn(
            "flex h-8 w-full rounded border border-[#242424] bg-[#0A0A0A] px-3 py-1 text-xs text-[#F5F3EE] placeholder:text-[#6F6D68] focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-[#C8A96B] focus-visible:border-[#C8A96B] disabled:cursor-not-allowed disabled:opacity-40 transition-colors",
            icon && "pl-9",
            className
          )}
          ref={ref}
          {...props}
        />
      </div>
    );
  }
);
Input.displayName = "Input";
