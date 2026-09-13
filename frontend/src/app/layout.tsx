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
    <html lang="en" className="dark" suppressHydrationWarning>
      <head>
        <script
          dangerouslySetInnerHTML={{
            __html: `
              (function() {
                try {
                  var t = localStorage.getItem('dhruv_theme');
                  if (t === 'light') {
                    document.documentElement.classList.remove('dark');
                    document.documentElement.classList.add('light');
                    document.documentElement.setAttribute('data-theme', 'light');
                  } else {
                    document.documentElement.classList.remove('light');
                    document.documentElement.classList.add('dark');
                    document.documentElement.setAttribute('data-theme', 'dark');
                  }
                } catch (e) {}
              })();
            `,
          }}
        />
      </head>
      <body className="bg-[#050505] text-[#F5F3EE] font-sans min-h-screen antialiased selection:bg-polar-cyan/30 selection:text-white">
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}

