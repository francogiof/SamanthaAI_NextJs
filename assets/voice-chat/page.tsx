/* File: src/app/voice-chat/page.tsx */
'use client';

import { useRef } from 'react';
import { useTechInterviewer } from './agents/techInterviewerAgent';
import { useSpeechRecognition } from './agents/speech';
import './voicechat.css';

export default function VoiceChat() {
  const audioRef = useRef<HTMLAudioElement>(null);
  const {
    techAgent,
    interviewMode,
    setInterviewMode,
    assistantText,
    setAssistantText,
    startTechInterview,
    handleTechAnswer,
  } = useTechInterviewer(audioRef);

  const onResult = async (transcript: string) => {
    setAssistantText(prev => `${prev}\n🧍 You: ${transcript}`);
    if (interviewMode && techAgent.lastQuestionId) {
      await handleTechAnswer(transcript);
    } else {
      // If you add more agents, handle them here
    }
  };

  const { isListening, startListening, stopListening } = useSpeechRecognition({
    onResult,
    onStart: () => {
      console.log('✅ Speech recognition started');
    },
    onEnd: () => {
      console.log('🛑 Speech recognition ended');
    },
    onError: (e) => {
      console.error('⚠️ Speech recognition error:', e.error || e);
    },
  });

  return (
    <div className="voicechat-container">
      <h1>🗣️ Virtual Interviewer </h1>
      <div className="participants">
        <div className="user">
          <div className={`avatar ${isListening ? 'talking' : 'idle'}`} />
          <div className="label">You</div>
        </div>
        <div className="user">
          <div className={`avatar ${assistantText.includes('🤖') ? 'talking' : 'idle'}`} />
          <div className="label">LemonFox</div>
        </div>
      </div>
      <div className="cc">
        <pre style={{ whiteSpace: 'pre-wrap', margin: 0 }}>{assistantText}</pre>
      </div>
      <div className="controls">
        <button className="btn" onClick={isListening ? stopListening : startListening}>
          {isListening ? '🛑 Stop Listening' : '🎙️ Start Listening'}
        </button>
        <button className="btn" onClick={startTechInterview} disabled={interviewMode}>
          🧑‍💻 Start Tech Interview
        </button>
      </div>
      <audio ref={audioRef} hidden />
    </div>
  );
}