import React from "react";

export function VerticalStepProgressBar({
  steps = [], // Array of steps from backend, each with step_name, structure, and optional icon
  currentStep = 0,
  onStepClick,
}: {
  steps: Array<{ step_name: string; structure: string; icon?: React.ReactNode }>;
  currentStep?: number;
  onStepClick?: (step: number) => void;
}) {
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
            key={step.step_name + idx}
            className={`flex flex-col items-center relative z-10 ${
              idx === currentStep ? "vertical-step-active" : ""
            }`}
            style={{ minHeight: 64 }}
          >
            <button
              className={`flex items-center justify-center rounded-full border-2 transition-all duration-200 w-10 h-10 text-base font-bold ${
                idx === currentStep
                  ? "border-blue-500 bg-blue-600 text-white shadow-lg"
                  : "border-gray-500 bg-gray-800 text-gray-300"
              }`}
              style={{ outline: "none" }}
              aria-label={step.structure || step.step_name}
              onClick={() => onStepClick && onStepClick(idx)}
              disabled={typeof onStepClick !== "function"}
            >
              {step.icon ? step.icon : idx + 1}
            </button>
            <span
              className={`mt-2 text-xs font-semibold ${
                idx === currentStep ? "text-blue-400" : "text-gray-400"
              }`}
            >
              {step.structure || step.step_name}
            </span>
          </li>
        ))}
      </ol>
    </div>
  );
}
