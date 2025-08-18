import React from 'react';
import { PanelRightClose, PanelRightOpen } from 'lucide-react';
import { VerticalStepProgressBar } from './VerticalStepProgressBar';
import { FileText, Info, Users, Code, Award, User, CheckCircle } from 'lucide-react';

interface ScreeningSidebarToggleProps {
  showSidebar: boolean;
  onToggleSidebar: () => void;
  steps: Array<{ step_name: string; structure: string; icon?: React.ReactNode }>;
  currentStep: number;
  onStepClick: (step: number) => void;
}

const structureIcons: Record<string, React.ReactNode> = {
  'Quick start': <FileText className="w-5 h-5" />,
  'Role explanation': <Info className="w-5 h-5" />,
  'About you': <User className="w-5 h-5" />,
  'Qualifications': <Award className="w-5 h-5" />,
  'Finishing and next steps': <CheckCircle className="w-5 h-5" />,
};

const structureSteps = [
  'Quick start',
  'Role explanation',
  'About you',
  'Qualifications',
  'Finishing and next steps',
];

const ScreeningSidebarToggle: React.FC<Omit<ScreeningSidebarToggleProps, 'steps'> & {
  steps?: Array<{ step_name: string; structure: string; icon?: React.ReactNode }>,
  currentStructure?: string,
  allStepsWithStatus?: Array<{ step_id: number; step_name: string; status: string; structure?: string }>
}> = ({ showSidebar, onToggleSidebar, steps, currentStep, currentStructure, allStepsWithStatus, onStepClick }) => {
  const progressBarRef = React.useRef<HTMLDivElement>(null);

  const stepsWithIcons = structureSteps.map((structure, idx) => ({
    step_name: structure,
    structure,
    icon: structureIcons[structure] || idx + 1
  }));

  // Find which structure is currently active and which are completed
  const completedStructures = allStepsWithStatus
    ? allStepsWithStatus.filter(s => s.status === 'completed').map(s => s.structure)
    : [];

  const activeStructure = currentStructure;

  React.useEffect(() => {
    if (showSidebar && progressBarRef.current) {
      const active = progressBarRef.current.querySelector('.vertical-step-active');
      if (active && 'scrollIntoView' in active) {
        (active as HTMLElement).scrollIntoView({ behavior: 'smooth', block: 'center' });
      }
    }
  }, [showSidebar, currentStep]);

  const ArrowIcon = showSidebar ? <PanelRightClose size={24} /> : <PanelRightOpen size={24} />;

  return (
    <>
      <button
        className={`fixed top-1/2 right-0 z-50 p-2 rounded-l-lg bg-gray-900 border border-gray-800 shadow-lg hover:bg-gray-800 focus:outline-none focus:ring-2 focus:ring-blue-500`}
        style={{
          transform: 'translateY(-50%)',
          transition: 'right 0.3s cubic-bezier(.4,0,.2,1), background 0.2s',
        }}
        onClick={onToggleSidebar}
        aria-label={showSidebar ? 'Hide progress panel' : 'Show progress panel'}
      >
        {ArrowIcon}
      </button>
      {showSidebar && (
        <div
          ref={progressBarRef}
          className="fixed top-0 right-0 h-full w-64 flex flex-col items-center bg-gray-900/95 border-l border-gray-800 z-40 shadow-2xl pt-16 pb-8 overflow-y-auto scrollbar-thin scrollbar-thumb-gray-700 scrollbar-track-gray-900"
        >
          <div className="w-full h-full flex-1 px-6 flex items-center justify-center">
            <VerticalStepProgressBar
              steps={stepsWithIcons}
              currentStructure={activeStructure}
              allStepsWithStatus={allStepsWithStatus}
              onStepClick={onStepClick}
            />
          </div>
        </div>
      )}
    </>
  );
};

export default ScreeningSidebarToggle;
