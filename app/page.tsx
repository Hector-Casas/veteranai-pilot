import Nav from "@/components/landing/Nav";
import Hero from "@/components/landing/Hero";
import TrustStrip from "@/components/landing/TrustStrip";
import WhatWeDo from "@/components/landing/WhatWeDo";
import DemosShowcase from "@/components/landing/DemosShowcase";
import FinalCta from "@/components/landing/FinalCta";
import Footer from "@/components/landing/Footer";
import ChatBubble from "@/components/ChatBubble";

export default function Home() {
  return (
    <div className="flex flex-1 flex-col bg-page-base text-text-primary">
      <Nav />
      <main className="flex flex-1 flex-col">
        <Hero />
        <TrustStrip />
        <WhatWeDo />
        <DemosShowcase />
        <FinalCta />
      </main>
      <Footer />
      <ChatBubble />
    </div>
  );
}
