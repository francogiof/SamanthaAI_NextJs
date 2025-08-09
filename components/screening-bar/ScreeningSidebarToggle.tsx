import React from 'react';
import { PanelRightClose, PanelRightOpen } from 'lucide-react';
import { VerticalStepProgressBar } from './VerticalStepProgressBar';

interface ScreeningSidebarToggleProps {
  showSidebar: boolean;
  onToggleSidebar: () => void;
}

const ScreeningSidebarToggle: React.FC<ScreeningSidebarToggleProps> = ({ showSidebar, onToggleSidebar }) => {
  // Scroll to the current step in the vertical bar when sidebar opens or step changes
  const progressBarRef = React.useRef<HTMLDivElement>(null);
  const [currentStep, setCurrentStep] = React.useState<number>(0);

  // Expose a way to update currentStep from parent if needed (optional, for future extensibility)

  React.useEffect(() => {
    if (showSidebar && progressBarRef.current) {
      // Find the active step button and scroll it into view
      const active = progressBarRef.current.querySelector('.vertical-step-active');
      if (active && 'scrollIntoView' in active) {
        (active as HTMLElement).scrollIntoView({ behavior: 'smooth', block: 'center' });
      }
    }
  }, [showSidebar, currentStep]);

  return (
    <>
      <button
        className="fixed bottom-8 right-8 z-50 bg-gray-800 hover:bg-gray-700 text-white rounded-full p-4 shadow-lg transition-all duration-200 flex items-center justify-center focus:outline-none"
        style={{ boxShadow: '0 2px 12px rgba(0,0,0,0.25)' }}
        onClick={onToggleSidebar}
        aria-label={showSidebar ? 'Hide chat panel' : 'Show chat panel'}
      >
        {showSidebar ? <PanelRightClose className="w-6 h-6" /> : <PanelRightOpen className="w-6 h-6" />}
      </button>
      {/* Render the vertical progress bar inside the sidebar when open */}
      {showSidebar && (
        <div ref={progressBarRef} className="fixed top-24 right-0 h-[calc(100vh-6rem)] w-32 flex flex-col items-center bg-gray-900/95 border-l border-gray-800 z-40 shadow-2xl pt-8 overflow-y-auto scrollbar-thin scrollbar-thumb-gray-700 scrollbar-track-gray-900">
          <VerticalStepProgressBar currentStep={currentStep} onStepClick={setCurrentStep} />
        </div>
      )}
    </>
  );
};

export default ScreeningSidebarToggle;
