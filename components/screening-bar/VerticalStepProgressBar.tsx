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
    'border-blue-500 bg-blue-600 text-white shadow-lg scale-110'; // Removed animate-pulse
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
          // Birthday celebration effect for each step when moved on
          const celebrationClass = isActive ? 'animate-birthday' : '';
          const transitionClass = isActive || isCompleted ? 'transition-transform duration-300 scale-105' : 'transition-transform duration-200';
          return (
            <li
              key={step.step_name + idx}
              className={`flex flex-col items-center relative z-10 ${isActive ? 'vertical-step-active' : ''}`}
              style={{ minHeight: 64 }}
            >
              <button
                className={`flex items-center justify-center rounded-full border-2 w-11 h-11 text-base font-bold shadow-lg ${
                  isActive
                    ? activeCircleClass
                    : isCompleted
                    ? completedCircleClass
                    : inactiveCircleClass
                } ${transitionClass} ${celebrationClass}`}
                style={{ outline: 'none', transition: 'transform 0.3s cubic-bezier(.4,0,.2,1), box-shadow 0.2s', position: 'relative' }}
                aria-label={step.structure || step.step_name}
                onClick={() => onStepClick && onStepClick(idx)}
                disabled={typeof onStepClick !== 'function'}
              >
                {step.icon ? step.icon : idx + 1}
                {/* Birthday confetti effect for active step */}
                {isActive && (
                  <span className="absolute inset-0 flex items-center justify-center pointer-events-none">
                    <svg width="44" height="44" viewBox="0 0 44 44" fill="none" className="z-10">
                      <g>
                        <circle cx="12" cy="12" r="2.5" fill="#fbbf24" />
                        <circle cx="32" cy="12" r="2.5" fill="#60a5fa" />
                        <circle cx="12" cy="32" r="2.5" fill="#f472b6" />
                        <circle cx="32" cy="32" r="2.5" fill="#34d399" />
                        <rect x="20" y="4" width="4" height="8" rx="2" fill="#fbbf24" />
                        <rect x="4" y="20" width="8" height="4" rx="2" fill="#60a5fa" />
                        <rect x="32" y="20" width="8" height="4" rx="2" fill="#f472b6" />
                        <rect x="20" y="32" width="4" height="8" rx="2" fill="#34d399" />
                      </g>
                    </svg>
                  </span>
                )}
              </button>
              <span
                className={`mt-2 text-xs font-semibold tracking-wide ${
                  isActive ? 'text-blue-400' : isCompleted ? 'text-green-400' : 'text-gray-500'
                }`}
                style={{ transition: 'color 0.3s cubic-bezier(.4,0,.2,1)', letterSpacing: '0.04em' }}
              >
                {step.structure || step.step_name}
              </span>
            </li>
          );
        })}
      </ol>
      {/* Add minimal achievement and celebration animations */}
      <style jsx>{`
        @keyframes achievement {
          0% { box-shadow: 0 0 0 0 #34d399; }
          60% { box-shadow: 0 0 0 8px #34d39933; }
          100% { box-shadow: 0 0 0 0 #34d399; }
        }
        .animate-achievement {
          animation: achievement 0.8s ease;
        }
        @keyframes celebration {
          0% { transform: scale(1) rotate(0deg); }
          20% { transform: scale(1.15) rotate(-8deg); }
          40% { transform: scale(1.1) rotate(8deg); }
          60% { transform: scale(1.2) rotate(-8deg); }
          80% { transform: scale(1.1) rotate(8deg); }
          100% { transform: scale(1) rotate(0deg); }
        }
        .animate-celebration {
          animation: celebration 1.2s cubic-bezier(.4,0,.2,1);
        }
        @keyframes birthday {
          0% { transform: scale(1) rotate(0deg); opacity: 1; }
          20% { transform: scale(1.15) rotate(-8deg); opacity: 1; }
          40% { transform: scale(1.1) rotate(8deg); opacity: 1; }
          60% { transform: scale(1.2) rotate(-8deg); opacity: 1; }
          80% { transform: scale(1.1) rotate(8deg); opacity: 1; }
          100% { transform: scale(1) rotate(0deg); opacity: 1; }
        }
        .animate-birthday {
          animation: birthday 1.2s cubic-bezier(.4,0,.2,1);
        }
      `}</style>
    </div>
  );
}
