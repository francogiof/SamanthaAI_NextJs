import React from 'react';

interface ScreeningChatProgressProps {
  screeningProgress: number;
  allStepsWithStatus: any[];
}

const ScreeningChatProgress: React.FC<ScreeningChatProgressProps> = ({ screeningProgress, allStepsWithStatus }) => (
  <div className="mt-2">
    <div className="w-full bg-gray-700 rounded-full h-2">
      <div 
        className="bg-blue-600 h-2 rounded-full transition-all duration-300"
        style={{ width: `${screeningProgress}%` }}
      ></div>
    </div>
    <p className="text-xs text-gray-400 mt-1">Progress: {screeningProgress.toFixed(1)}%</p>
    {/* Step Completion Indicators */}
    {allStepsWithStatus.length > 0 && (
      <div className="mt-3">
        <p className="text-xs text-gray-400 mb-2">Question Status:</p>
        <div className="flex flex-wrap gap-2">
          {allStepsWithStatus.map((step, index) => (
            <div
              key={index}
              className={`flex items-center justify-center w-6 h-6 rounded-full border-2 text-xs font-bold transition-colors duration-200
                ${step.completed ? 'bg-green-500 border-green-600 text-white' : 'bg-gray-700 border-gray-500 text-gray-300'}
              `}
              title={step.completed ? 'Answered' : 'Unanswered'}
            >
              {index + 1}
            </div>
          ))}
        </div>
      </div>
    )}
  </div>
);

export default ScreeningChatProgress;
