import { BRAND } from "./brand";

export const THEME = {
  statusColors: {
    operational: {
      bg: "rgba(84, 245, 138, 0.12)",
      text: "#54F58A",
      border: "rgba(84, 245, 138, 0.3)",
      dot: "#54F58A",
    },
    warning: {
      bg: "rgba(230, 162, 60, 0.12)",
      text: "#FFB84D",
      border: "rgba(255, 184, 77, 0.3)",
      dot: "#FFB84D",
    },
    danger: {
      bg: "rgba(228, 91, 91, 0.15)",
      text: "#FF5C70",
      border: "rgba(255, 92, 112, 0.35)",
      dot: "#FF5C70",
    },
    info: {
      bg: "rgba(232, 228, 220, 0.12)",
      text: "#E8E4DC",
      border: "rgba(232, 228, 220, 0.3)",
      dot: "#E8E4DC",
    },
    neutral: {
      bg: "rgba(200, 200, 197, 0.12)",
      text: "#C8C8C5",
      border: "rgba(200, 200, 197, 0.25)",
      dot: "#C8C8C5",
    },
  },
  severityBadge: {
    LOW: {
      label: "Low",
      bg: "rgba(200, 200, 197, 0.1)",
      text: "#C8C8C5",
      border: "rgba(200, 200, 197, 0.3)",
    },
    MEDIUM: {
      label: "Medium",
      bg: "rgba(230, 162, 60, 0.12)",
      text: "#FFB84D",
      border: "rgba(255, 184, 77, 0.3)",
    },
    HIGH: {
      label: "High",
      bg: "rgba(228, 91, 91, 0.15)",
      text: "#FF5C70",
      border: "rgba(255, 92, 112, 0.35)",
    },
    CRITICAL: {
      label: "Critical",
      bg: "rgba(228, 91, 91, 0.25)",
      text: "#FF5C70",
      border: "rgba(255, 92, 112, 0.6)",
    },
  },
  chartPalette: [
    BRAND.colors.signal,
    BRAND.colors.silver,
    BRAND.colors.warning,
    BRAND.colors.success,
  ],
  sidebarWidth: 264,
  sidebarCollapsedWidth: 72,
  topbarHeight: 64,
} as const;
