import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { LandingNavbar } from "./LandingNavbar";

type MarketingPageProps = {
  eyebrow: string;
  title: string;
  description: string;
  highlights: string[];
};

export function MarketingPage({ eyebrow, title, description, highlights }: MarketingPageProps) {
  return (
    <main className="min-h-screen bg-[#050505] text-[#F5F3EE]">
      <LandingNavbar />
      <section className="mx-auto flex min-h-screen max-w-7xl items-center px-6 pb-16 pt-32 sm:px-12">
        <div className="grid w-full gap-12 lg:grid-cols-[1.1fr_0.9fr] lg:items-end">
          <div>
            <p className="mb-5 font-mono text-xs tracking-[0.25em] text-[#C8A96B] uppercase">{eyebrow}</p>
            <h1 className="max-w-3xl text-4xl font-bold leading-[1.04] tracking-tight sm:text-6xl">{title}</h1>
            <p className="mt-7 max-w-2xl text-base leading-relaxed text-[#A5A29C] sm:text-lg">{description}</p>
            <Link href="/dashboard" className="mt-10 inline-flex items-center gap-3 border border-[#E8E4DC] bg-[#E8E4DC] px-6 py-3 text-xs font-bold tracking-wider text-[#050505] uppercase transition-colors hover:bg-white">
              Launch DHRUV <ArrowRight className="h-4 w-4" />
            </Link>
          </div>
          <div className="border border-[#242424] bg-[#101010] p-6 sm:p-8">
            <p className="mb-5 font-mono text-[10px] tracking-[0.18em] text-[#6F6D68] uppercase">Operational brief</p>
            <ul className="space-y-4">
              {highlights.map((highlight, index) => (
                <li key={highlight} className="flex gap-4 border-b border-[#242424] pb-4 last:border-0 last:pb-0">
                  <span className="font-mono text-xs text-[#C8A96B]">0{index + 1}</span>
                  <span className="text-sm leading-relaxed text-[#C8C8C5]">{highlight}</span>
                </li>
              ))}
            </ul>
          </div>
        </div>
      </section>
    </main>
  );
}
