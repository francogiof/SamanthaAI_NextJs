"use client";
import React, { useState } from "react";
import { CheckCircle, FileText, Info, Users, Code, Award, Loader2 } from "lucide-react";

const steps = [
  {
    label: "CV Upload & Profile Creation",
    icon: <FileText className="w-6 h-6" />,
  },
  {
    label: "Screening & Role Introduction",
    icon: <Info className="w-6 h-6" />,
  },
  {
    label: "Behavioral Interview",
    icon: <Users className="w-6 h-6" />,
  },
  {
    label: "Technical Interview",
    icon: <Code className="w-6 h-6" />,
  },
  {
    label: "Mini Project Challenge",
    icon: <Award className="w-6 h-6" />,
  },
  {
    label: "Summary & Wait",
    icon: <Loader2 className="w-6 h-6 animate-spin" />,
  },
];

export function StepProgressBar({ currentStep = 0, onStepClick }: { currentStep?: number; onStepClick?: (step: number) => void }) {
  return (
    <div className="flex flex-col items-center w-full">
      <ol className="flex flex-row justify-between w-full max-w-4xl mx-auto mb-8">
        {steps.map((step, idx) => (
          <li key={step.label} className="flex-1 flex flex-col items-center relative">
            <button
              className={`rounded-full w-10 h-10 flex items-center justify-center border-2 transition-all duration-200 ${
                idx < currentStep
                  ? "bg-primary text-primary-foreground border-primary"
                  : idx === currentStep
                  ? "bg-primary/80 text-white border-primary"
                  : "bg-muted text-muted-foreground border-muted-foreground/30"
              }`}
              onClick={() => onStepClick?.(idx)}
              aria-label={step.label}
            >
              {idx < currentStep ? <CheckCircle className="w-6 h-6" /> : step.icon}
            </button>
            <span className="mt-2 text-xs text-center max-w-[7rem] font-medium">
              {step.label}
            </span>
            {idx < steps.length - 1 && (
              <span
                className={`absolute top-5 left-1/2 w-full h-1 -z-10 ${
                  idx < currentStep
                    ? "bg-primary"
                    : "bg-muted-foreground/30"
                }`}
                style={{ width: "100%", height: 4, transform: "translateX(50%)" }}
              />
            )}
          </li>
        ))}
      </ol>
    </div>
  );
}
