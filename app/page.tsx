import Header from "@/components/Header";
import Hero from "@/components/Hero";
import MarketIntel from "@/components/MarketIntel";
import Ecosystem from "@/components/Ecosystem";
import EliteCTA from "@/components/EliteCTA";
import Footer from "@/components/Footer";

export default function Home() {
  return (
    <div className="min-h-screen max-w-md mx-auto relative">
      <Header />
      <main>
        <Hero />
        <MarketIntel />
        <Ecosystem />
        <EliteCTA />
      </main>
      <Footer />
    </div>
  );
}
