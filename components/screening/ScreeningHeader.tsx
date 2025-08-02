import React from 'react';
import { Clock } from 'lucide-react';
import { Message } from './types';

interface ScreeningHeaderProps {
  screeningContext: any;
  timer: number;
  screeningComplete: boolean;
  screeningScore: number | null;
  totalSteps: number;
  currentStep: number;
  completionRate: number;
  photosTaken: number;
  stepCompleted: boolean;
  stepsWithNoResponse: number;
}

export const ScreeningHeader: React.FC<ScreeningHeaderProps> = ({
  screeningContext,
  timer,
  screeningComplete,
  screeningScore,
  totalSteps,
  currentStep,
  completionRate,
  photosTaken,
  stepCompleted,
  stepsWithNoResponse,
}) => (
  <div className="bg-gray-800 text-white p-4 flex items-center justify-between relative">
    <div className="flex items-center space-x-4">
      <div className="w-10 h-10 bg-blue-600 rounded-full flex items-center justify-center">
        {/* User icon here */}
      </div>
      <div>
        <h1 className="font-semibold">Screening Interview</h1>
        <p className="text-sm text-gray-300">
          {screeningContext?.requirement?.role_name} - {screeningContext?.requirement?.creator_role}
        </p>
      </div>
    </div>
    {/* Timer Centered */}
    <div className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 flex items-center gap-2 bg-gray-800 bg-opacity-80 px-4 py-2 rounded-full shadow text-white font-semibold text-lg" style={{minWidth:'160px', justifyContent:'center'}}>
      <Clock className="w-5 h-5 text-white" />
      <span>{Math.floor(timer / 60).toString().padStart(2, '0')}:{(timer % 60).toString().padStart(2, '0')}</span>
      <span className="text-xs ml-2">min</span>
    </div>
    <div className="flex items-center space-x-2">
      <span className="text-sm text-gray-300">
        {screeningComplete && (
          <span className="font-semibold">
            Score: {screeningScore}/100
          </span>
        )}
        {!screeningComplete && totalSteps > 0 && (
          <span className="font-semibold">
            Step {currentStep + 1} of {totalSteps} • {completionRate.toFixed(1)}% Complete
          </span>
        )}
      </span>
      {photosTaken > 0 && (
        <div className="flex items-center space-x-1 text-yellow-400">
          <div className="w-2 h-2 bg-yellow-400 rounded-full animate-pulse"></div>
          <span className="text-xs">📸 {photosTaken}/2 photos captured</span>
        </div>
      )}
      {stepCompleted && (
        <div className="flex items-center space-x-1 text-green-400">
          <div className="w-2 h-2 bg-green-400 rounded-full"></div>
          <span className="text-xs">✅ Step completed</span>
        </div>
      )}
      {stepsWithNoResponse > 0 && (
        <div className="flex items-center space-x-1 text-gray-400">
          <div className="w-2 h-2 bg-gray-400 rounded-full"></div>
          <span className="text-xs">❌ {stepsWithNoResponse} unanswered</span>
        </div>
      )}
    </div>
    {/* This is a stub. Insert header UI and logic here as you modularize */}
  </div>
);
