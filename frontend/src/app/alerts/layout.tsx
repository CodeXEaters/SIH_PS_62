import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Operational Alerts & Notices | DHRUV",
  description:
    "Real-time operational alerts, hazard notices, and equipment telemetry warnings across Indian Antarctic research stations.",
  alternates: {
    canonical: "https://dhruv-frontend.onrender.com/alerts",
  },
};

export default function AlertsLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <>{children}</>;
}
