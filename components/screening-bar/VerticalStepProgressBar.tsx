import React from "react";
import { CheckCircle, FileText, Info, Users, Code, Award } from "lucide-react";

const steps = [
  {
    label: "CV Upload & Profile Creation",
    icon: <FileText className="w-5 h-5" />,
  },
  {
    label: "Screening & Role Introduction",
    icon: <Info className="w-5 h-5" />,
  },
  {
    label: "Behavioral Interview",
    icon: <Users className="w-5 h-5" />,
  },
  {
    label: "Technical Interview",
    icon: <Code className="w-5 h-5" />,
  },
  {
    label: "Mini Project Challenge",
    icon: <Award className="w-5 h-5" />,
  },
];

export function VerticalStepProgressBar({
  currentStep = 0,
  onStepClick,
}: {
  currentStep?: number;
  onStepClick?: (step: number) => void;
}) {
  const circleDiameter = 40; // px
  const stepCount = steps.length;
  return (
    <div className="flex flex-col items-center h-full py-8">
      <ol className="relative flex flex-col items-center h-full justify-between min-h-[340px] max-h-full">
        {/* Vertical line */}
        <div
          className="absolute left-1/2 -translate-x-1/2 top-0 bottom-0 w-1 bg-gradient-to-b from-gray-700 via-gray-600 to-gray-800 opacity-60 z-0"
          style={{ width: 4, borderRadius: 2 }}
        />
        {steps.map((step, idx) => (
          <li
            key={step.label}
            className="flex flex-col items-center relative z-10"
            style={{ minHeight: 64 }}
          >
            <button
              className={`rounded-full w-10 h-10 flex items-center justify-center border-2 transition-all duration-200 shadow-md mb-1
                ${idx < currentStep
                  ? "bg-green-500 text-white border-green-500"
                  : idx === currentStep
                  ? "bg-[#444950] text-white border-[#888c94] border-opacity-60 animate-pulse"
                  : "bg-gray-800 text-gray-400 border-gray-600"}
              `}
              onClick={() => onStepClick?.(idx)}
              aria-label={step.label}
              style={{ zIndex: 2 }}
            >
              {idx < currentStep ? (
                <CheckCircle className="w-6 h-6" />
              ) : (
                step.icon
              )}
            </button>
            <span className="text-xs text-center max-w-[6rem] font-medium text-gray-300 mb-2">
              {step.label}
            </span>
            {/* Draw connector line except after last step */}
            {idx < steps.length - 1 && (
              <div className="w-1 bg-gradient-to-b from-green-400/80 to-gray-600/40" style={{ height: 40, borderRadius: 2 }} />
            )}
          </li>
        ))}
      </ol>
    </div>
  );
}
