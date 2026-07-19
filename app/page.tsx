import Header from "@/components/Header";
import HeroClassic from "@/components/HeroClassic";
import HeroFeatures from "@/components/HeroFeatures";
import MarketIntel from "@/components/MarketIntel";
import Methodology from "@/components/Methodology";
import FeatureGatingList from "@/components/FeatureGatingList";
import ComparisonSection from "@/components/ComparisonSection";
import TrackRecordSection from "@/components/TrackRecordSection";
import LotContestSection from "@/components/LotContestSection";
import OnboardingSection from "@/components/OnboardingSection";
import FaqAccordion from "@/components/FaqAccordion";
import Footer from "@/components/Footer";

export default function Home() {
  return (
    <div className="min-h-screen max-w-md mx-auto relative">
      <Header />
      <main>
        <HeroClassic />
        <HeroFeatures />
        <MarketIntel />
        <Methodology />
        <FeatureGatingList />
        <ComparisonSection />
        <TrackRecordSection />
        <LotContestSection />
        <OnboardingSection />
        <FaqAccordion />
      </main>
      <Footer />
    </div>
  );
}
