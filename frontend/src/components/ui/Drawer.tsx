import React, { useEffect } from "react";
import { X } from "lucide-react";
import { cn } from "@/lib/utils";

interface DrawerProps {
  isOpen: boolean;
  onClose: () => void;
  title?: string;
  subtitle?: string;
  children: React.ReactNode;
  side?: "right" | "left";
  width?: string;
}

export const Drawer: React.FC<DrawerProps> = ({
  isOpen,
  onClose,
  title,
  subtitle,
  children,
  side = "right",
  width = "w-96 md:w-[420px]",
}) => {
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    if (isOpen) {
      window.addEventListener("keydown", handleKeyDown);
    }
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex">
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-black/80 backdrop-blur-sm transition-opacity"
        onClick={onClose}
      />

      {/* Drawer Panel */}
      <div
        className={cn(
          "relative z-10 h-full bg-[#0A0A0A] border-[#242424] shadow-2xl flex flex-col overflow-hidden transition-transform duration-300",
          side === "right" ? "ml-auto border-l" : "mr-auto border-r",
          width
        )}
      >
        <div className="flex items-center justify-between px-5 py-4 border-b border-[#242424] bg-[#070707]">
          <div>
            {title && <h3 className="text-xs font-mono font-bold text-[#F5F3EE] uppercase tracking-wider">{title}</h3>}
            {subtitle && <p className="text-[11px] text-[#A5A29C] mt-0.5">{subtitle}</p>}
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded text-[#6F6D68] hover:text-[#F5F3EE] hover:bg-[#151515] transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
        <div className="p-5 overflow-y-auto flex-1 text-[#F5F3EE]">{children}</div>
      </div>
    </div>
  );
};
