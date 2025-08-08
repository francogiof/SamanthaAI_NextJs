import React from 'react';
import { Volume2, VolumeX, MoreVertical, Phone, PanelRightClose, PanelRightOpen, Captions, Mic, MicOff, Video, VideoOff } from 'lucide-react';

interface ScreeningBarProps {
  audioEnabled: boolean;
  isListening: boolean;
  isCameraOn: boolean;
  micDevices: MediaDeviceInfo[];
  cameraDevices: MediaDeviceInfo[];
  showMicDropdown: boolean;
  showCameraDropdown: boolean;
  onToggleAudio: () => void;
  onMicButton: () => void;
  onToggleCamera: () => void;
  onShowMicDropdown: () => void;
  onShowCameraDropdown: () => void;
  onEndCall: () => void;
  onToggleCC: () => void;
  ccEnabled: boolean;
}

export const ScreeningBar: React.FC<ScreeningBarProps> = ({
  audioEnabled,
  isListening,
  isCameraOn,
  micDevices,
  cameraDevices,
  showMicDropdown,
  showCameraDropdown,
  onToggleAudio,
  onMicButton,
  onToggleCamera,
  onShowMicDropdown,
  onShowCameraDropdown,
  onEndCall,
  onToggleCC,
  ccEnabled,
}) => {
  return (
    <div className="fixed bottom-8 left-1/2 transform -translate-x-1/2 z-50">
      <div className="bg-gray-800 bg-opacity-90 backdrop-blur-sm rounded-full px-6 py-3 flex items-center space-x-4 shadow-2xl">
        <button
          onClick={onToggleAudio}
          className={`p-3 rounded-full transition-all duration-200 ${!audioEnabled ? 'bg-red-600 text-white' : 'bg-gray-700 text-white hover:bg-gray-600'}`}
          title={!audioEnabled ? 'Enable Audio' : 'Disable Audio'}
        >
          {!audioEnabled ? <VolumeX className="w-5 h-5" /> : <Volume2 className="w-5 h-5" />}
        </button>
        {/* Microphone group */}
        <div className="flex items-center relative group">
          <button
            className="mr-0.5 p-3 bg-gray-900 rounded-full border border-gray-800 shadow-md hover:bg-gray-800 focus:outline-none flex items-center justify-center group-hover:bg-gray-800"
            style={{width: '70px', height: '48px', marginRight: '-16px', zIndex: 0, position: 'absolute', left: 0, top: '50%', transform: 'translateY(-50%)'}} 
            onClick={onShowMicDropdown}
            tabIndex={0}
          >
            <MoreVertical className="w-5 h-5 text-gray-400" style={{marginLeft: '-9px'}} />
          </button>
          <button
            onClick={onMicButton}
            className={`p-3 rounded-full transition-all duration-200 border-2 ${isListening ? 'border-[#22c55e]' : 'border-gray-700'} bg-gray-700 text-white hover:bg-gray-600`}
            title={isListening ? 'Turn Off Microphone' : 'Turn On Microphone'}
            style={{position: 'relative', zIndex: 1, marginLeft: '40px'}}
          >
            {isListening
              ? <Mic className="w-5 h-5" style={{ color: '#22c55e' }} />
              : <MicOff className="w-5 h-5 text-white" />}
          </button>
          {showMicDropdown && micDevices.length > 0 && (
            <div className="absolute left-full top-1/2 -translate-y-1/2 ml-2 bg-gray-800 border border-gray-600 rounded shadow-lg z-50 min-w-[160px]">
              {micDevices.map((dev) => (
                <div key={dev.deviceId} className="px-4 py-2 text-white hover:bg-gray-700 cursor-pointer text-sm border-b border-gray-700 last:border-b-0">{dev.label || 'Microphone'}</div>
              ))}
            </div>
          )}
        </div>
        {/* Camera group */}
        <div className="flex items-center relative group">
          <button
            className="mr-0.5 p-3 bg-gray-900 rounded-full border border-gray-800 shadow-md hover:bg-gray-800 focus:outline-none flex items-center justify-center group-hover:bg-gray-800"
            style={{width: '70px', height: '48px', marginRight: '-16px', zIndex: 0, position: 'absolute', left: 0, top: '50%', transform: 'translateY(-50%)'}}
            onClick={onShowCameraDropdown}
            tabIndex={0}
          >
            <MoreVertical className="w-5 h-5 text-gray-400" style={{marginLeft: '-9px'}} />
          </button>
          <button
            onClick={onToggleCamera}
            className={`p-3 rounded-full transition-all duration-200 ${!isCameraOn ? 'bg-red-600 text-white' : 'bg-gray-700 text-white hover:bg-gray-600'}`}
            title={!isCameraOn ? 'Turn On Camera' : 'Turn Off Camera'}
            style={{position: 'relative', zIndex: 1, marginLeft: '40px'}}
          >
            {!isCameraOn ? <VideoOff className="w-5 h-5" /> : <Video className="w-5 h-5" />}
          </button>
          {showCameraDropdown && cameraDevices.length > 0 && (
            <div className="absolute left-full top-1/2 -translate-y-1/2 ml-2 bg-gray-800 border border-gray-600 rounded shadow-lg z-50 min-w-[160px]">
              {cameraDevices.map((dev) => (
                <div key={dev.deviceId} className="px-4 py-2 text-white hover:bg-gray-700 cursor-pointer text-sm border-b border-gray-700 last:border-b-0">{dev.label || 'Camera'}</div>
              ))}
            </div>
          )}
        </div>
        {/* CC Button for subtitles */}
        <button
          onClick={onToggleCC}
          className={`p-3 rounded-full transition-all duration-200 border-2 ${ccEnabled ? 'border-blue-500 bg-blue-700 text-white' : 'border-gray-700 bg-gray-700 text-white hover:bg-gray-600'}`}
          title={ccEnabled ? 'Hide Subtitles' : 'Show Subtitles'}
        >
          <Captions className="w-5 h-5" />
        </button>
        <button
          onClick={onEndCall}
          className="p-3 rounded-full bg-red-600 text-white hover:bg-red-700 transition-all duration-200"
          title="End Call"
        >
          <Phone className="w-5 h-5" />
        </button>
      </div>
    </div>
  );
};

// Sidebar toggle button logic (but not rendered in the bar)
export const ScreeningSidebarToggle: React.FC<{ showSidebar: boolean; onToggleSidebar: () => void }> = ({ showSidebar, onToggleSidebar }) => (
  <button
    className="fixed bottom-8 right-8 z-50 bg-gray-800 hover:bg-gray-700 text-white rounded-full p-4 shadow-lg transition-all duration-200 flex items-center justify-center focus:outline-none"
    style={{ boxShadow: '0 2px 12px rgba(0,0,0,0.25)' }}
    onClick={onToggleSidebar}
    aria-label={showSidebar ? 'Hide chat panel' : 'Show chat panel'}
  >
    {showSidebar ? <PanelRightClose className="w-6 h-6" /> : <PanelRightOpen className="w-6 h-6" />}
  </button>
);
