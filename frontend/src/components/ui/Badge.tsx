import React, { HTMLAttributes } from "react";
import { cn } from "@/lib/utils";
import { SeverityLevel } from "@/types";

export interface BadgeProps extends HTMLAttributes<HTMLSpanElement> {
  variant?: "default" | "outline" | "success" | "warning" | "danger" | "info" | "gold";
  severity?: SeverityLevel;
  dot?: boolean;
}

export const Badge: React.FC<BadgeProps> = ({
  className,
  variant = "default",
  severity,
  dot = true, // Default to clean dot status
  children,
  ...props
}) => {
  let styleClasses = "bg-[#101010] text-[#F5F3EE] border-[#242424]";
  let dotColor = "bg-[#C8C8C5]";

  if (severity) {
    switch (severity) {
      case "CRITICAL":
        styleClasses = "bg-[#140808] text-[#B85C5C] border-[#B85C5C]/40";
        dotColor = "bg-[#B85C5C]";
        break;
      case "HIGH":
        styleClasses = "bg-[#141008] text-[#C49A55] border-[#C49A55]/40";
        dotColor = "bg-[#C49A55]";
        break;
      case "MEDIUM":
        styleClasses = "bg-[#101010] text-[#C8C8C5] border-[#303030]";
        dotColor = "bg-[#C8C8C5]";
        break;
      case "LOW":
        styleClasses = "bg-[#0A0A0A] text-[#6F6D68] border-[#242424]";
        dotColor = "bg-[#6F6D68]";
        break;
    }
  } else {
    switch (variant) {
      case "success":
        styleClasses = "bg-[#08120B] text-[#7FAF91] border-[#7FAF91]/30";
        dotColor = "bg-[#7FAF91]";
        break;
      case "warning":
        styleClasses = "bg-[#141008] text-[#C49A55] border-[#C49A55]/30";
        dotColor = "bg-[#C49A55]";
        break;
      case "danger":
        styleClasses = "bg-[#140808] text-[#B85C5C] border-[#B85C5C]/30";
        dotColor = "bg-[#B85C5C]";
        break;
      case "gold":
        styleClasses = "bg-[#171716] text-[#E8E4DC] border-[#E8E4DC]/40";
        dotColor = "bg-[#E8E4DC]";
        break;
      case "outline":
        styleClasses = "bg-transparent text-[#A5A29C] border-[#242424]";
        dotColor = "bg-[#6F6D68]";
        break;
      case "info":
        styleClasses = "bg-[#0D0D0D] text-[#C8C8C5] border-[#242424]";
        dotColor = "bg-[#C8C8C5]";
        break;
      case "default":
      default:
        styleClasses = "bg-[#101010] text-[#F5F3EE] border-[#242424]";
        dotColor = "bg-[#C8C8C5]";
        break;
    }
  }

  return (
    <span
      className={cn(
        "inline-flex items-center gap-1.5 px-2 py-0.5 rounded text-[10px] font-mono font-medium border tracking-wider uppercase",
        styleClasses,
        className
      )}
      {...props}
    >
      {dot && <span className={cn("w-1.5 h-1.5 rounded-full shrink-0", dotColor)} />}
      <span>{children}</span>
    </span>
  );
};
