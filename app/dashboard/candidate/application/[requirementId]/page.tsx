"use client";
import { useState } from "react";
import { StepProgressBar } from "@/components/step-progress-bar";
import SidebarLayout, { SidebarItem } from "@/components/sidebar-layout";
import { Briefcase, PlusCircle, Star, User } from "lucide-react";

const navigationItems: SidebarItem[] = [
  {
    name: "My Applications",
    href: "/dashboard/candidate",
    icon: Briefcase,
    type: "item",
  },
  {
    type: "label",
    name: "Practice & Premium",
  },
  {
    name: "Simulate Job Offer",
    href: "/dashboard/candidate/simulate",
    icon: PlusCircle,
    type: "item",
  },
  {
    name: "Premium Examples",
    href: "/dashboard/candidate/examples",
    icon: Star,
    type: "item",
  },
  {
    type: "label",
    name: "Profile",
  },
  {
    name: "My Profile",
    href: "/dashboard/candidate/profile",
    icon: User,
    type: "item",
  },
];

export default function CandidateApplicationSubdashboard() {
  const [currentStep, setCurrentStep] = useState(0);

  return (
    <SidebarLayout basePath="/dashboard/candidate" items={navigationItems}>
      <div className="max-w-4xl mx-auto py-10">
        <h1 className="text-2xl font-bold mb-6">Hiring Process Progress</h1>
        <StepProgressBar currentStep={currentStep} onStepClick={setCurrentStep} />
        <div className="mt-10 p-6 bg-card rounded-xl shadow">
          <h2 className="text-lg font-semibold mb-2">Step {currentStep + 1}: {[
            "CV Upload & Profile Creation",
            "Screening & Role Introduction",
            "Behavioral Interview",
            "Technical Interview",
            "Mini Project Challenge",
            "Summary & Wait",
          ][currentStep]}</h2>
          <p className="text-muted-foreground">(Step content placeholder. In future stages, this will show the interactive UI for each step.)</p>
        </div>
      </div>
    </SidebarLayout>
  );
}
