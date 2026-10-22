import { ArchitectureSection } from "@/components/sections/architecture-section";
import { BenefitsSection, ReportMappingSection } from "@/components/sections/benefits-report";
import { ComponentLibrary } from "@/components/sections/component-library";
import { DigitalTwinSection } from "@/components/sections/digital-twin-section";
import { FaultCenter } from "@/components/sections/fault-center";
import { HeroSection } from "@/components/sections/hero-section";
import { OverviewSection } from "@/components/sections/overview-section";
import { SensorsSection } from "@/components/sections/sensors-section";
import { TechStackSection } from "@/components/sections/tech-stack-section";
import { TelegramSimSection } from "@/components/sections/telegram-sim-section";
import { ThingspeakDashboard } from "@/components/sections/thingspeak-dashboard";
import { WorkflowSection } from "@/components/sections/workflow-section";

export default function HomePage() {
  return (
    <main>
      <HeroSection />
      <OverviewSection />
      <ComponentLibrary />
      <DigitalTwinSection />
      <SensorsSection />
      <ArchitectureSection />
      <ThingspeakDashboard />
      <TelegramSimSection />
      <FaultCenter />
      <WorkflowSection />
      <BenefitsSection />
      <ReportMappingSection />
      <TechStackSection />
    </main>
  );
}
