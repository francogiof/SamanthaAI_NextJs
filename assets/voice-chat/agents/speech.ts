// File: src/app/voice-chat/agents/speech.ts
import { useRef, useState } from 'react';

export function useSpeechRecognition({
  onResult,
  onStart,
  onEnd,
  onError,
  lang = 'en-US',
}: {
  onResult: (transcript: string) => void;
  onStart?: () => void;
  onEnd?: () => void;
  onError?: (e: any) => void;
  lang?: string;
}) {
  const recognitionRef = useRef<any>(null);
  const [isListening, setIsListening] = useState(false);

  const startListening = () => {
    const SpeechRecognition =
      (window as any).webkitSpeechRecognition || (window as any).SpeechRecognition;
    if (!SpeechRecognition) {
      alert('Your browser does not support Speech Recognition.');
      return;
    }
    const recognition = new SpeechRecognition();
    recognitionRef.current = recognition;
    recognition.continuous = false;
    recognition.interimResults = false;
    recognition.lang = lang;
    recognition.onstart = () => {
      setIsListening(true);
      onStart && onStart();
    };
    recognition.onend = () => {
      setIsListening(false);
      onEnd && onEnd();
    };
    recognition.onerror = (e: any) => {
      onError && onError(e);
    };
    recognition.onresult = (event: any) => {
      const transcript = event.results[0][0].transcript;
      onResult(transcript);
    };
    try {
      recognition.start();
      setIsListening(true);
    } catch (err) {
      onError && onError(err);
    }
  };

  const stopListening = () => {
    if (recognitionRef.current) {
      recognitionRef.current.stop();
      setIsListening(false);
    }
  };

  return { isListening, startListening, stopListening };
}

export async function playTTS(text: string, audioRef: React.RefObject<HTMLAudioElement>) {
  try {
    if (audioRef.current) {
      audioRef.current.pause();
      audioRef.current.currentTime = 0;
    }
    const audioRes = await fetch('/api/tts', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ text }),
    });
    if (!audioRes.ok) throw new Error('TTS API error');
    const audioBlob = await audioRes.blob();
    const audioUrl = URL.createObjectURL(audioBlob);
    if (audioRef.current) {
      audioRef.current.src = audioUrl;
      await audioRef.current.play();
    }
  } catch (err) {
    // eslint-disable-next-line no-console
    console.error('❌ Error playing TTS audio:', err);
  }
}
