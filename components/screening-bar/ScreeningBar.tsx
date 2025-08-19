import React, { useEffect, useRef, useState } from 'react';
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

// Default CC enabled state (to be imported in parent)
export const defaultCCEnabled = true;

// SubtitlesOverlay component
interface Subtitle {
  sender: 'agent' | 'candidate';
  text: string;
}

interface SubtitlesOverlayProps {
  messages: { sender: 'agent' | 'candidate'; content: string }[];
  ccEnabled: boolean;
}

export const SubtitlesOverlay: React.FC<SubtitlesOverlayProps> = ({ messages, ccEnabled }) => {
  const [displayedAgent, setDisplayedAgent] = useState<string>("");
  const [agentRevealIdx, setAgentRevealIdx] = useState<number>(0);
  const lastAgentMsgRef = useRef<string>("");
  const revealTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  // Find the last 2 messages
  const recent = messages.slice(-2);
  const lastAgentMsg = [...messages].reverse().find(m => m.sender === 'agent');

  // Reveal agent text word by word, with random delay per word (mean ~200ms)
  useEffect(() => {
    if (!ccEnabled || !lastAgentMsg) return;
    if (lastAgentMsg.content !== lastAgentMsgRef.current) {
      // New agent message, start reveal
      setDisplayedAgent("");
      setAgentRevealIdx(0);
      lastAgentMsgRef.current = lastAgentMsg.content;
    }
    const words = lastAgentMsg.content.split(/(\s+)/); // keep spaces
    if (agentRevealIdx < words.length) {
      if (revealTimeoutRef.current) clearTimeout(revealTimeoutRef.current);
      // Random delay between 150ms and 250ms, mean ~200ms
      const delay = 100 + Math.floor(Math.random() * 200); // 135-235ms
      revealTimeoutRef.current = setTimeout(() => {
        setAgentRevealIdx(idx => idx + 1);
        setDisplayedAgent(words.slice(0, agentRevealIdx + 1).join(""));
      }, delay);
    }
    return () => {
      if (revealTimeoutRef.current) clearTimeout(revealTimeoutRef.current);
    };
  }, [lastAgentMsg, agentRevealIdx, ccEnabled]);

  // Compose the lines to show: candidate lines are always full, agent line is revealed
  const lines = recent.map((msg, i) => {
    if (msg.sender === 'agent' && msg === lastAgentMsg) {
      return { ...msg, content: displayedAgent };
    }
    return msg;
  });

  if (!ccEnabled || !messages || messages.length === 0) return null;

  return (
    <div
      className="fixed left-1/2 z-50 flex flex-col items-center w-full pointer-events-none select-none"
      style={{
        transform: 'translateX(-50%)',
        maxWidth: '100vw',
        alignItems: 'center',
        justifyContent: 'flex-end',
        pointerEvents: 'none',
        bottom: '100px',
      }}
    >
      <div
        className="flex flex-col gap-1 items-center w-full"
        style={{ maxWidth: '1600px', minWidth: 0 }}
      >
        {lines.map((msg, i) => (
          <div
            key={i}
            className={`px-6 py-2 rounded-lg text-base md:text-lg font-medium bg-black bg-opacity-70 text-white subtitle-line-minimalist ${
              msg.sender === 'agent' ? 'border-l-2 border-blue-400' : 'border-l-2 border-green-400'
            }`}
            style={{
              maxWidth: '96vw',
              minWidth: 0,
              margin: '0 auto',
              textAlign: 'center',
              wordBreak: 'break-word',
              opacity: 1 - (lines.length - 1 - i) * 0.3,
              boxShadow: '0 2px 8px #0006',
              pointerEvents: 'none',
              marginBottom: 2,
            }}
          >
            <span className={msg.sender === 'agent' ? 'text-blue-200' : 'text-green-200'}>
              {msg.content}
            </span>
          </div>
        ))}
      </div>
      <style jsx global>{`
        .subtitle-line-minimalist {
          animation: subtitle-fade-in 0.3s cubic-bezier(0.4,0,0.2,1);
          max-width: 96vw;
          min-width: 0;
        }
        @keyframes subtitle-fade-in {
          from { opacity: 0; transform: translateY(10px) scale(0.98); }
          to { opacity: 1; transform: translateY(0) scale(1); }
        }
      `}</style>
    </div>
  );
};
