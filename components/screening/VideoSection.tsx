import React from 'react';
import { User } from 'lucide-react';

interface VideoSectionProps {
  isCameraOn: boolean;
  isVideoOn: boolean;
  isListening: boolean;
  isSpeaking: boolean;
  speakingTimer: number | null;
  autoMicrophoneEnabled: boolean;
  autoRecordCountdown: number | null;
  videoRef: React.RefObject<HTMLVideoElement>;
  shouldMorphBlob: boolean;
  isBlobResetting: boolean;
  photosTaken: number;
}

export const VideoSection: React.FC<VideoSectionProps> = ({
  isCameraOn,
  isVideoOn,
  isListening,
  isSpeaking,
  speakingTimer,
  autoMicrophoneEnabled,
  autoRecordCountdown,
  videoRef,
  shouldMorphBlob,
  isBlobResetting,
  photosTaken,
}) => (
  <div className="grid grid-cols-2 h-full">
    {/* Agent Video */}
    <div className="bg-gray-800 flex flex-col items-center justify-center relative">
      <div className={`blob mb-4 transition-all duration-[2000ms] ${shouldMorphBlob ? 'blob-animate' : ''} ${isBlobResetting ? 'blob-resetting' : ''}`}></div>
      <h3 className="text-white font-semibold">Sarah (Interviewer)</h3>
      <p className="text-gray-400 text-sm">Screening Agent</p>
    </div>
    {/* Candidate Video */}
    <div className="bg-gray-800 flex flex-col items-center justify-center relative overflow-hidden candidate-video-container">
      {autoMicrophoneEnabled && (
        <div className="auto-microphone-indicator">🎤 Auto-enabled</div>
      )}
      <video
        ref={videoRef}
        className={`absolute inset-0 w-full h-full object-cover transition-opacity duration-300 ${isCameraOn ? 'opacity-100' : 'opacity-0 pointer-events-none'}`}
        autoPlay
        muted
        playsInline
        style={{ display: isCameraOn ? 'block' : 'none' }}
      />
      {/* Show avatar when camera is off */}
      {!isCameraOn && (
        <>
          <div className={`w-24 h-24 rounded-full flex items-center justify-center mb-4 transition-all duration-300 ${isListening ? 'avatar-listening' : isVideoOn ? 'bg-green-600' : 'bg-gray-600'}`}>
            <User className="w-12 h-12 text-white" />
          </div>
          {/* Add more UI as needed */}
        </>
      )}
    </div>
  </div>
);
