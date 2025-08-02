import React from 'react';

interface FloatingControlsProps {
  audioEnabled: boolean;
  isListening: boolean;
  isCameraOn: boolean;
  ccEnabled: boolean;
  onToggleAudio: () => void;
  onToggleCamera: () => void;
  onToggleCC: () => void;
  onEndCall: () => void;
}

export const FloatingControls: React.FC<FloatingControlsProps> = ({
  audioEnabled,
  isListening,
  isCameraOn,
  ccEnabled,
  onToggleAudio,
  onToggleCamera,
  onToggleCC,
  onEndCall,
}) => (
  <div className="fixed bottom-8 left-1/2 transform -translate-x-1/2 z-50">
    <div className="bg-gray-800 bg-opacity-90 backdrop-blur-sm rounded-full px-6 py-3 flex items-center space-x-4 shadow-2xl floating-controls">
      {/* ...existing controls code... */}
    </div>
  </div>
);
