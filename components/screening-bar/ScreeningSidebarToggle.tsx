import React from 'react';
import { PanelRightClose, PanelRightOpen } from 'lucide-react';

interface ScreeningSidebarToggleProps {
  showSidebar: boolean;
  onToggleSidebar: () => void;
}

const ScreeningSidebarToggle: React.FC<ScreeningSidebarToggleProps> = ({ showSidebar, onToggleSidebar }) => (
  <button
    className="fixed bottom-8 right-8 z-50 bg-gray-800 hover:bg-gray-700 text-white rounded-full p-4 shadow-lg transition-all duration-200 flex items-center justify-center focus:outline-none"
    style={{ boxShadow: '0 2px 12px rgba(0,0,0,0.25)' }}
    onClick={onToggleSidebar}
    aria-label={showSidebar ? 'Hide chat panel' : 'Show chat panel'}
  >
    {showSidebar ? <PanelRightClose className="w-6 h-6" /> : <PanelRightOpen className="w-6 h-6" />}
  </button>
);

export default ScreeningSidebarToggle;
