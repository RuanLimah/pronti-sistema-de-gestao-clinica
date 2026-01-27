import { LandingNav } from "@/components/landing/LandingNav";
import { HeroSection } from "@/components/landing/HeroSection";
import { PainPointsSection } from "@/components/landing/PainPointsSection";
import { SolutionsSection } from "@/components/landing/SolutionsSection";
import { TestimonialsSection } from "@/components/landing/TestimonialsSection";
import { PricingSection } from "@/components/landing/PricingSection";
import { SecuritySection } from "@/components/landing/SecuritySection";
import { FinalCTASection } from "@/components/landing/FinalCTASection";
import { LandingFooter } from "@/components/landing/LandingFooter";

export default function Landing() {
  return (
    <div className="min-h-screen bg-white">
      <LandingNav />
      <HeroSection />
      <PainPointsSection />
      <SolutionsSection />
      <TestimonialsSection />
      <PricingSection />
      <SecuritySection />
      <FinalCTASection />
      <LandingFooter />
    </div>
  );
}
