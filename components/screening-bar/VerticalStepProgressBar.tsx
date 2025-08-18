import React from "react";

export function VerticalStepProgressBar({
  steps = [], // Array of steps from backend, each with step_name, structure, and optional icon
  currentStructure = '', // The structure of the current question
  allStepsWithStatus = [], // Array of all step statuses from backend
  onStepClick,
}: {
  steps: Array<{ step_name: string; structure: string; icon?: React.ReactNode }>;
  currentStructure?: string;
  allStepsWithStatus?: Array<{ step_id: number; step_name: string; status: string; structure?: string }>;
  onStepClick?: (step: number) => void;
}) {
  // Find the index of the first step whose structure matches the current question's structure
  // If multiple questions map to the same structure, highlight the first occurrence
  const activeIdx = steps.findIndex(step => step.structure === currentStructure);

  // Track completion: if any question with a given structure is completed, mark that structure as completed
  const completedStructures = steps.map(step => {
    // Find all steps/questions in allStepsWithStatus that match this structure and are completed
    const isCompleted = allStepsWithStatus?.some(s => s.structure === step.structure && s.status === 'completed');
    return isCompleted ? step.structure : null;
  }).filter(Boolean);

  // Animation classes
  const activeCircleClass =
    'border-blue-500 bg-blue-600 text-white shadow-lg animate-pulse scale-110';
  const completedCircleClass =
    'border-green-500 bg-green-600 text-white';
  const inactiveCircleClass =
    'border-gray-500 bg-gray-800 text-gray-300';

  return (
    <div className="flex flex-col items-center h-full py-8">
      <ol className="relative flex flex-col items-center h-full justify-between min-h-[340px] max-h-full">
        {/* Vertical line */}
        <div
          className="absolute left-1/2 -translate-x-1/2 top-0 bottom-0 w-1 bg-gradient-to-b from-gray-700 via-gray-600 to-gray-800 opacity-60 z-0"
          style={{ width: 4, borderRadius: 2 }}
        />
        {steps.map((step, idx) => {
          const isActive = idx === activeIdx;
          const isCompleted = completedStructures.includes(step.structure);
          return (
            <li
              key={step.step_name + idx}
              className={`flex flex-col items-center relative z-10 ${isActive ? 'vertical-step-active' : ''}`}
              style={{ minHeight: 64 }}
            >
              <button
                className={`flex items-center justify-center rounded-full border-2 transition-all duration-300 w-10 h-10 text-base font-bold ${
                  isActive
                    ? activeCircleClass
                    : isCompleted
                    ? completedCircleClass
                    : inactiveCircleClass
                }`}
                style={{ outline: 'none', transition: 'transform 0.3s cubic-bezier(.4,0,.2,1), box-shadow 0.2s' }}
                aria-label={step.structure || step.step_name}
                onClick={() => onStepClick && onStepClick(idx)}
                disabled={typeof onStepClick !== 'function'}
              >
                {step.icon ? step.icon : idx + 1}
              </button>
              <span
                className={`mt-2 text-xs font-semibold ${
                  isActive ? 'text-blue-400 animate-pulse' : isCompleted ? 'text-green-400' : 'text-gray-400'
                }`}
                style={{ transition: 'color 0.3s cubic-bezier(.4,0,.2,1)' }}
              >
                {step.structure || step.step_name}
              </span>
            </li>
          );
        })}
      </ol>
    </div>
  );
}
