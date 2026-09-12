import type { Metadata } from "next";
import "./globals.css";
import { Providers } from "@/components/shared/Providers";

export const metadata: Metadata = {
  title: "DHRUV — Integrated Polar Expedition Intelligence",
  description:
    "DHRUV is an integrated platform for planning, tracking and managing India's Antarctic expedition operations. National Centre for Polar and Ocean Research (NCPOR), Ministry of Earth Sciences, Government of India.",
  keywords: [
    "DHRUV",
    "NCPOR",
    "MoES",
    "Antarctica",
    "Polar Expedition",
    "Maitri",
    "Bharati",
    "Indian Scientific Expedition to Antarctica",
    "ISEA",
    "Logistics",
  ],
  authors: [{ name: "NCPOR / Ministry of Earth Sciences" }],
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="dark">
      <body className="bg-polar-navy text-polar-snow font-sans min-h-screen antialiased selection:bg-polar-cyan/30 selection:text-white">
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
