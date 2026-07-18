import Header from "@/components/Header";
import Hero from "@/components/Hero";
import Methodology from "@/components/Methodology";
import FeatureGatingList from "@/components/FeatureGatingList";
import ComparisonSection from "@/components/ComparisonSection";
import TrackRecordSection from "@/components/TrackRecordSection";
import OnboardingSection from "@/components/OnboardingSection";
import FaqAccordion from "@/components/FaqAccordion";
import Footer from "@/components/Footer";

export default function Home() {
  return (
    <div className="min-h-screen max-w-md mx-auto relative">
      <Header />
      <main>
        <Hero />
        <Methodology />
        <FeatureGatingList />
        <ComparisonSection />
        <TrackRecordSection />
        <OnboardingSection />
        <FaqAccordion />
      </main>
      <Footer />
    </div>
  );
}
