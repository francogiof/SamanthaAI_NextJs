import React from 'react';
import { PanelRightClose, PanelRightOpen } from 'lucide-react';
import { VerticalStepProgressBar } from './VerticalStepProgressBar';

interface ScreeningSidebarToggleProps {
  showSidebar: boolean;
  onToggleSidebar: () => void;
}

const ScreeningSidebarToggle: React.FC<ScreeningSidebarToggleProps> = ({ showSidebar, onToggleSidebar }) => {
  const progressBarRef = React.useRef<HTMLDivElement>(null);
  const [currentStep, setCurrentStep] = React.useState<number>(
    typeof window !== 'undefined' && localStorage.getItem('currentStep')
      ? parseInt(localStorage.getItem('currentStep') || '0', 10)
      : 0
  );

  React.useEffect(() => {
    if (showSidebar && progressBarRef.current) {
      const active = progressBarRef.current.querySelector('.vertical-step-active');
      if (active && 'scrollIntoView' in active) {
        (active as HTMLElement).scrollIntoView({ behavior: 'smooth', block: 'center' });
      }
    }
  }, [showSidebar, currentStep]);

  // Use a modern slide icon from lucide-react
  const ArrowIcon = showSidebar
    ? <PanelRightClose className="w-6 h-6" />
    : <PanelRightOpen className="w-6 h-6" />;

  return (
    <>
      {/* Toggle button, always visible at the edge of the sidebar or screen */}
      <button
        className={`fixed top-8 z-50 bg-gray-800 hover:bg-gray-700 text-white rounded-l-full rounded-r-none p-4 shadow-lg transition-all duration-200 flex items-center justify-center focus:outline-none border-l border-gray-700`}
        style={{
          boxShadow: '0 2px 12px rgba(0,0,0,0.25)',
          borderTopRightRadius: 0,
          borderBottomRightRadius: 0,
          borderTopLeftRadius: '2rem',
          borderBottomLeftRadius: '2rem',
          right: showSidebar ? '16rem' : 0, // match sidebar width
          top: 32,
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
              currentStep={currentStep}
              onStepClick={setCurrentStep}
            />
          </div>
        </div>
      )}
    </>
  );
};

export default ScreeningSidebarToggle;
