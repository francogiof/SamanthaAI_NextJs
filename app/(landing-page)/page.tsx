import { FeatureGrid } from "@/components/features";
import { Hero } from "@/components/hero";
import { PricingGrid } from "@/components/pricing";
import { stackServerApp } from "@/stack";
import { GitHubLogoIcon } from "@radix-ui/react-icons";
import { ComponentIcon, Users } from "lucide-react";
import Waves from "./waves-client";

export default async function IndexPage() {
  const project = await stackServerApp.getProject();
  if (!project.config.clientTeamCreationEnabled) {
    return (
      <div className="w-full min-h-96 flex items-center justify-center">
        <div className="max-w-xl gap-4">
          <p className="font-bold text-xl">Setup Required</p>
          <p className="">
            {
              "To start using this project, please enable client-side team creation in the Stack Auth dashboard (Project > Team Settings). This message will disappear once the feature is enabled."
            }
          </p>
        </div>
      </div>
    );
  }

  return (
    <>
      <div className="relative">
        <Waves />
        <Hero
          capsuleText="SamanthaAI – Autonomous Hiring for Tech Teams"
          capsuleLink="/"
          title="SamanthaAI: Fast, Fair, and Explainable Technical Hiring."
          subtitle="Automate interviews, scoring, and decisions with modular AI agents."
          primaryCtaText="🚀 Try SamanthaAI Demo"
          primaryCtaLink={stackServerApp.urls.signUp}
          secondaryCtaText="🧠 View on GitHub"
          secondaryCtaLink="https://github.com/stack-auth/stack-template"
          credits={
            <>Purpose-built for engineering recruitment. Open-source, auditable, and developer-first.</>
          }
        />
      </div>

      <div id="features" />
      <FeatureGrid
        title="Revolutionize Technical Hiring with SamanthaAI"
        subtitle="Automate every stage—from CV parsing to technical interviews—with explainable, auditable AI agents."
        items={[
          {
            icon: <span className="text-3xl">🤖</span>,
            title: "Multi-Agent Interview System",
            description: "Specialized agents handle CV parsing, interviews, scoring, and reporting in one pipeline.",
          },
          {
            icon: <span className="text-3xl">📄</span>,
            title: "Automated CV Parsing & Profiling",
            description: "Extract skills and experience from resumes, instantly match to job requirements.",
          },
          {
            icon: <span className="text-3xl">🧪</span>,
            title: "Dynamic Technical Evaluation",
            description: "Ask job-specific questions, auto-grade answers, and compute performance in real time.",
          },
          {
            icon: <span className="text-3xl">📊</span>,
            title: "Transparent Scoring & Reporting",
            description: "Every answer and decision is logged, stored, and fully explainable.",
          },
          {
            icon: <span className="text-3xl">🔍</span>,
            title: "Bias Reduction by Design",
            description: "Agents use only relevant data and ideal answers for fairer outcomes.",
          },
          {
            icon: <span className="text-3xl">🔁</span>,
            title: "Self-Improving System",
            description: "Continuous improvement via feedback loops and model fine-tuning.",
          },
        ]}
      />

      <div id="pricing" />
      <PricingGrid
        title="Pricing"
        subtitle="Simple, scalable plans for every team."
        items={[
          {
            title: "Starter",
            price: "$0/mo",
            description: "For evaluation, pilots, and small-scale hiring automation.",
            features: [
              "Full source code (self-hostable)",
              "1 active job role",
              "Up to 5 candidate evaluations/month",
              "Community support via GitHub",
              "No credit card required",
            ],
            buttonText: "Get Started",
            buttonHref: stackServerApp.urls.signUp,
          },
          {
            title: "Growth",
            price: "Custom",
            description: "For growing teams with consistent hiring needs.",
            features: [
              "Unlimited job roles",
              "Up to 200 candidate evaluations/month",
              "Scoring dashboard & audit logs",
              "Priority email support",
              "API access for ATS/HR integrations",
            ],
            buttonText: "Contact Sales",
            isPopular: true,
            buttonHref: stackServerApp.urls.signUp,
          },
          {
            title: "Enterprise",
            price: "Custom",
            description: "For platforms, consultancies, or large organizations.",
            features: [
              "Everything in Growth tier",
              "Multi-tenant & RBAC",
              "Dedicated support & onboarding",
              "Custom agent workflows & private LLMs",
              "On-premise or VPC deployment",
              "SLA-backed uptime & compliance",
            ],
            buttonText: "Contact Sales",
            buttonHref: stackServerApp.urls.signUp,
          },
        ]}
      />
    </>
  );
}
