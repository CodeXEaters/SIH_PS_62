import { MarketingPage } from "@/components/landing/MarketingPage";

export default function TechnologyPage() {
  return <MarketingPage eyebrow="Technology" title="Resilient by design, ready for integration." description="The frontend is structured for operational data services and local-first workflows without overstating automation." highlights={["Offline-capable local storage and queued synchronization.", "Typed service boundaries ready for backend APIs.", "Operational map, analytics and intelligence presented as assessments—not magic."]} />;
}
