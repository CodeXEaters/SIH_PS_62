import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Expedition Command Center | DHRUV",
  description:
    "A live operational picture across people, cargo, assets and missions. National Centre for Polar and Ocean Research (NCPOR), Ministry of Earth Sciences, Government of India.",
  alternates: {
    canonical: "https://dhruv-frontend.onrender.com/dashboard",
  },
};

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <>{children}</>;
}
