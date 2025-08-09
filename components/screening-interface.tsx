"use client";

import { useState, useEffect, useRef } from 'react';
import { User, MessageCircle, Share2, Mic, MicOff, Video, VideoOff, Phone, Volume2, VolumeX, MoreVertical, Clock, PanelRightOpen, PanelRightClose } from 'lucide-react';
import './screening-interface.css';
import { Card } from "./ui/card";
import { ScreeningBar, ScreeningSidebarToggle, SubtitlesOverlay, defaultCCEnabled } from './screening-bar/ScreeningBar';

interface ScreeningInterfaceProps {
  requirementId: string;
  userId: number;
  onComplete: (score: number, passes: boolean) => void;
  previewStream?: MediaStream | null;
  previewCameraOn?: boolean;
  previewMicrophoneOn?: boolean;
  previewMicDevices?: MediaDeviceInfo[];
  previewCameraDevices?: MediaDeviceInfo[];
}

interface Message {
  id: string;
  sender: 'agent' | 'candidate';
  content: string;
  timestamp: Date;
}

interface AgentSlide {
  id: string;
  type: 'introduction' | 'requirements' | 'questions' | 'feedback';
  content: any;
}

export default function ScreeningInterface({ requirementId, userId, onComplete, previewStream, previewCameraOn, previewMicrophoneOn, previewMicDevices = [], previewCameraDevices = [] }: ScreeningInterfaceProps) {
  const [isConnected, setIsConnected] = useState(false);
  const [isMuted, setIsMuted] = useState(false);
  const [isVideoOn, setIsVideoOn] = useState(true);
  const [isCameraOn, setIsCameraOn] = useState(false);
  const [currentSlide, setCurrentSlide] = useState(0);
  const [messages, setMessages] = useState<Message[]>([]);
  const [screeningContext, setScreeningContext] = useState<any>(null);
  const [agentTyping, setAgentTyping] = useState(false);
  const [currentQuestion, setCurrentQuestion] = useState<string>('');
  const [candidateResponse, setCandidateResponse] = useState<string>('');
  const [screeningProgress, setScreeningProgress] = useState(0);
  const [screeningComplete, setScreeningComplete] = useState(false);
  const [screeningScore, setScreeningScore] = useState<number | null>(null);
  const [passesScreening, setPassesScreening] = useState<boolean | null>(null);

  // LangGraph interview state
  const [currentStep, setCurrentStep] = useState(0);
  const [totalSteps, setTotalSteps] = useState(0);
  const [interviewMemory, setInterviewMemory] = useState<any>({
    keyPoints: [],
    followUpQuestions: [],
    candidateStrengths: [],
    areasOfConcern: []
  });

  // Step-by-step interview state
  const [sessionId, setSessionId] = useState<string | null>(null);
  const [completionRate, setCompletionRate] = useState(0);
  const [stepCompleted, setStepCompleted] = useState(false);
  const [needsFollowUp, setNeedsFollowUp] = useState(false);
  const [allStepsWithStatus, setAllStepsWithStatus] = useState<any[]>([]);
  const [stepsWithNoResponse, setStepsWithNoResponse] = useState(0);
  const [isInitialized, setIsInitialized] = useState(false);

  // Speech functionality states
  const [isListening, setIsListening] = useState(false);
  const [isPlayingAudio, setIsPlayingAudio] = useState(false);
  const [audioEnabled, setAudioEnabled] = useState(true);
  const [microphonePermission, setMicrophonePermission] = useState<'granted' | 'denied' | 'prompt' | 'unknown'>('unknown');
  const [autoRecordCountdown, setAutoRecordCountdown] = useState<number | null>(null);
  const [speakingTimer, setSpeakingTimer] = useState<number | null>(null);
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [autoMicrophoneEnabled, setAutoMicrophoneEnabled] = useState(false);
  const blobMorphTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  // Photo capture for transparency
  const [photosTaken, setPhotosTaken] = useState(0);
  const [photoCaptureInterval, setPhotoCaptureInterval] = useState<NodeJS.Timeout | null>(null);

  const chatEndRef = useRef<HTMLDivElement>(null);
  const responseInputRef = useRef<HTMLInputElement>(null);
  const audioRef = useRef<HTMLAudioElement>(null);
  const videoRef = useRef<HTMLVideoElement>(null);
  const countdownRef = useRef<NodeJS.Timeout | null>(null);
  const recognitionRef = useRef<any>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const sessionIdRef = useRef<string | null>(null);
  const firstAgentMessageAdded = useRef(false);

  // Remove agentSlides array and all slide navigation/rendering code

  useEffect(() => {
    console.log('[ScreeningInterface] Component mounted with props:', { requirementId, userId });
    console.log('[ScreeningInterface] Preview permissions:', { previewCameraOn, previewMicrophoneOn, previewStream });
    
    // If preview permissions are granted, use them
    if (previewStream && previewCameraOn && previewMicrophoneOn) {
      console.log('[ScreeningInterface] Using preview streams and permissions');
      setMicrophonePermission('granted');
      setIsCameraOn(true);
      setAutoMicrophoneEnabled(true);
      streamRef.current = previewStream;
      
      // Set up video element with existing stream
      if (videoRef.current) {
        videoRef.current.srcObject = previewStream;
        videoRef.current.play().then(() => {
          console.log('[ScreeningInterface] ✅ Video playing with preview stream');
        }).catch((error) => {
          console.error('[ScreeningInterface] ❌ Error playing preview video:', error);
        });
      }
    } else {
      console.log('[ScreeningInterface] No preview permissions, checking microphone permission');
      checkMicrophonePermission();
    }
    
    // Initialize screening and photo capture
    if (!isInitialized) {
      initializeScreening();
      setIsInitialized(true);
    }
    startPhotoCapture();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [requirementId, userId, previewStream, previewCameraOn, previewMicrophoneOn, isInitialized]);

  useEffect(() => {
    console.log('[ScreeningInterface] Screening progress updated:', screeningProgress);
    if (screeningProgress >= 100) {
      console.log('[ScreeningInterface] Screening completed, calculating final score...');
      completeScreening();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [screeningProgress]);

  useEffect(() => {
    console.log('[ScreeningInterface] Messages updated, scrolling to bottom');
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  // Cleanup countdown timer on unmount
  useEffect(() => {
    return () => {
      if (countdownRef.current) {
        clearInterval(countdownRef.current);
      }
      if (recognitionRef.current) {
        recognitionRef.current.stop();
      }
      // Cleanup camera stream (only if it's not the preview stream)
      if (streamRef.current && streamRef.current !== previewStream) {
        streamRef.current.getTracks().forEach(track => track.stop());
      }
      // Cleanup photo capture
      stopPhotoCapture();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [previewStream]);

  // Handle video element setup when preview stream is available
  useEffect(() => {
    if (previewStream && previewCameraOn && videoRef.current) {
      console.log('[ScreeningInterface] Setting up video element with preview stream');
      videoRef.current.srcObject = previewStream;
      videoRef.current.play().then(() => {
        console.log('[ScreeningInterface] ✅ Video playing with preview stream');
      }).catch((error) => {
        console.error('[ScreeningInterface] ❌ Error playing preview video:', error);
      });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [previewStream, previewCameraOn, videoRef.current]);

  // Initialize video element when component mounts
  useEffect(() => {
    console.log('[ScreeningInterface] 🏗️ Component mounted, video ref:', !!videoRef.current);
    if (videoRef.current) {
      console.log('[ScreeningInterface] 🎬 Video element found, setting up event listeners');
      console.log('[ScreeningInterface] 🎬 Video element initial state:', {
        srcObject: videoRef.current.srcObject,
        readyState: videoRef.current.readyState,
        currentTime: videoRef.current.currentTime,
        videoWidth: videoRef.current.videoWidth,
        videoHeight: videoRef.current.videoHeight
      });
      
      videoRef.current.onloadedmetadata = () => {
        console.log('[ScreeningInterface] 📐 Video metadata loaded');
        console.log('[ScreeningInterface] 📐 Video dimensions after metadata:', videoRef.current?.videoWidth, 'x', videoRef.current?.videoHeight);
      };
      videoRef.current.oncanplay = () => {
        console.log('[ScreeningInterface] ✅ Video can play');
        console.log('[ScreeningInterface] 🎬 Video readyState on canplay:', videoRef.current?.readyState);
      };
      videoRef.current.onerror = (error) => {
        console.error('[ScreeningInterface] ❌ Video error:', error);
        console.error('[ScreeningInterface] ❌ Video error details:', videoRef.current?.error);
      };
    }
  }, []);

  // Monitor camera state changes
  useEffect(() => {
    console.log('[ScreeningInterface] 🔄 Camera state changed:', isCameraOn);
    console.log('[ScreeningInterface] 🎬 Video ref exists:', !!videoRef.current);
    console.log('[ScreeningInterface] 📹 Stream ref exists:', !!streamRef.current);
    
    if (isCameraOn && videoRef.current && streamRef.current) {
      console.log('[ScreeningInterface] ✅ Camera is on, video ref exists, stream exists');
      console.log('[ScreeningInterface] 🎬 Video element current state:', {
        srcObject: videoRef.current.srcObject,
        readyState: videoRef.current.readyState,
        currentTime: videoRef.current.currentTime,
        videoWidth: videoRef.current.videoWidth,
        videoHeight: videoRef.current.videoHeight,
        paused: videoRef.current.paused,
        ended: videoRef.current.ended
      });
      
      // If video element exists but srcObject is not set, set it now
      if (!videoRef.current.srcObject && streamRef.current) {
        console.log('[ScreeningInterface] 🔧 Setting srcObject after state change...');
        videoRef.current.srcObject = streamRef.current;
        
        videoRef.current.onloadedmetadata = () => {
          console.log('[ScreeningInterface] 📐 Video metadata loaded (after state change)');
          console.log('[ScreeningInterface] 📐 Video dimensions:', videoRef.current?.videoWidth, 'x', videoRef.current?.videoHeight);
          console.log('[ScreeningInterface] 🎬 Attempting to play video...');
          
          videoRef.current?.play().then(() => {
            console.log('[ScreeningInterface] ✅ Video playing successfully (after state change)');
          }).catch((error) => {
            console.error('[ScreeningInterface] ❌ Error playing video (after state change):', error);
          });
        };
      }
    }
  }, [isCameraOn]);

  // Monitor video rendering
  useEffect(() => {
    console.log('[ScreeningInterface] 🎨 Rendering decision - isCameraOn:', isCameraOn);
    console.log('[ScreeningInterface] 🎨 Should show video:', isCameraOn);
    console.log('[ScreeningInterface] 🎨 Video ref available:', !!videoRef.current);
  }, [isCameraOn]);

  const checkMicrophonePermission = async () => {
    try {
      console.log('[ScreeningInterface] Checking microphone permission...');
      const permission = await navigator.permissions.query({ name: 'microphone' as PermissionName });
      setMicrophonePermission(permission.state);
      
      permission.onchange = () => {
        console.log('[ScreeningInterface] Microphone permission changed:', permission.state);
        setMicrophonePermission(permission.state);
      };
      
      console.log('[ScreeningInterface] Initial microphone permission:', permission.state);
    } catch (error) {
      console.error('[ScreeningInterface] Error checking microphone permission:', error);
      setMicrophonePermission('unknown');
    }
  };

  const requestMicrophonePermission = async () => {
    try {
      console.log('[ScreeningInterface] Requesting microphone permission...');
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      setMicrophonePermission('granted');
      console.log('[ScreeningInterface] Microphone permission granted');
      
      // Stop the stream immediately - we just needed permission
      stream.getTracks().forEach(track => track.stop());
      
      return true;
    } catch (error) {
      console.error('[ScreeningInterface] Microphone permission denied:', error);
      setMicrophonePermission('denied');
      return false;
    }
  };

  const startSpeechRecognition = () => {
    if (microphonePermission !== 'granted') {
      console.log('[ScreeningInterface] Microphone permission not granted, cannot start speech recognition');
      addAgentMessage("Speech recognition is not supported in your browser. Please type your responses.");
      return;
    }

    const SpeechRecognition = (window as any).webkitSpeechRecognition || (window as any).SpeechRecognition;
    if (!SpeechRecognition) {
      console.error('[ScreeningInterface] Speech Recognition not supported in this browser');
      addAgentMessage("Speech recognition is not supported in your browser. Please type your responses.");
      return;
    }

    const recognition = new SpeechRecognition();
    recognitionRef.current = recognition;
    recognition.continuous = false;
    recognition.interimResults = false;
    recognition.lang = 'en-US';

    recognition.onstart = () => {
      console.log('[ScreeningInterface] Speech recognition started');
      setIsListening(true);
      // Start 15-second speaking timer
      startSpeakingTimer();
    };

    recognition.onend = () => {
      console.log('[ScreeningInterface] Speech recognition ended');
      setIsListening(false);
      setIsSpeaking(false);
      setSpeakingTimer(null);
    };

    recognition.onerror = (event: any) => {
      console.error('[ScreeningInterface] Speech recognition error:', event.error);
      setIsListening(false);
      setIsSpeaking(false);
      setSpeakingTimer(null);
      
      if (event.error === 'not-allowed') {
        setMicrophonePermission('denied');
        addAgentMessage("Microphone access was denied. Please enable microphone permissions and try again.");
      }
    };

    recognition.onresult = (event: any) => {
      const transcript = event.results[0][0].transcript;
      console.log('[ScreeningInterface] Speech transcribed:', transcript);
      setCandidateResponse(transcript);
      handleSendMessage(transcript);
    };

    try {
      recognition.start();
      setIsListening(true);
    } catch (error) {
      console.error('[ScreeningInterface] Error starting speech recognition:', error);
    }
  };

  const stopSpeechRecognition = () => {
    if (recognitionRef.current) {
      recognitionRef.current.stop();
      setIsListening(false);
    }
  };

  const startAutoRecordingCountdown = () => {
    if (screeningComplete || isListening || microphonePermission !== 'granted') return;
    
    console.log('[ScreeningInterface] Starting auto-recording countdown...');
    setAutoRecordCountdown(1); // Reduced from 3 to 1 second
    
    countdownRef.current = setInterval(() => {
      setAutoRecordCountdown(prev => {
        if (prev === null || prev <= 1) {
          if (countdownRef.current) {
            clearInterval(countdownRef.current);
            countdownRef.current = null;
          }
          setAutoRecordCountdown(null);
          if (!screeningComplete && !isListening && microphonePermission === 'granted') {
            console.log('[ScreeningInterface] Auto-starting speech recognition after countdown...');
            startSpeechRecognition();
          }
          return null;
        }
        return prev - 1;
      });
    }, 1000);
  };

  const startSpeakingTimer = () => {
    if (screeningComplete || !isListening) return;
    
    console.log('[ScreeningInterface] Starting 15-second speaking timer...');
    setSpeakingTimer(15);
    setIsSpeaking(true);
    
    const speakingInterval = setInterval(() => {
      setSpeakingTimer(prev => {
        if (prev === null || prev <= 1) {
          clearInterval(speakingInterval);
          setSpeakingTimer(null);
          setIsSpeaking(false);
          console.log('[ScreeningInterface] Speaking timer completed, stopping recognition...');
          stopSpeechRecognition();
          return null;
        }
        return prev - 1;
      });
    }, 1000);
  };

  const playAgentSpeech = async (text: string) => {
    if (!audioEnabled) {
      setTimeout(() => {
        if (!screeningComplete && !isListening && microphonePermission === 'granted') {
          startAutoRecordingCountdown();
        }
        if (!firstAgentTTSFinished) setShowMicAssist(true);
        setFirstAgentTTSFinished(true);
      }, 1000);
      return;
    }
    try {
      console.log('[ScreeningInterface] Generating speech for:', text);
      if (blobMorphTimeoutRef.current) {
        clearTimeout(blobMorphTimeoutRef.current);
      }
      setIsPlayingAudio(false);
      const response = await fetch('/api/speech/tts', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ text, voiceId: 'Joanna' }),
      });
      if (response.ok) {
        const arrayBuffer = await response.arrayBuffer();
        // Web Audio API: decode and play PCM
        const audioContext = new (window.AudioContext || (window as any).webkitAudioContext)({ sampleRate: 16000 });
        // PCM is 16-bit signed little-endian mono
        const pcm16 = new Int16Array(arrayBuffer);
        const float32 = new Float32Array(pcm16.length);
        for (let i = 0; i < pcm16.length; i++) {
          float32[i] = pcm16[i] / 32768;
        }
        const buffer = audioContext.createBuffer(1, float32.length, 16000);
        buffer.getChannelData(0).set(float32);
        const source = audioContext.createBufferSource();
        source.buffer = buffer;
        source.connect(audioContext.destination);
        source.onended = () => {
          setIsPlayingAudio(false);
          if (blobMorphTimeoutRef.current) {
            clearTimeout(blobMorphTimeoutRef.current);
          }
          setTimeout(() => {
            if (!screeningComplete && !isListening && microphonePermission === 'granted') {
              startAutoRecordingCountdown();
            }
            if (!firstAgentTTSFinished) setShowMicAssist(true);
            setFirstAgentTTSFinished(true);
          }, 1000);
        };
        blobMorphTimeoutRef.current = setTimeout(() => {
          setIsPlayingAudio(true);
        }, 300);
        source.start();
      } else {
        console.error('[ScreeningInterface] TTS failed:', response.status);
        setIsPlayingAudio(false);
        if (blobMorphTimeoutRef.current) {
          clearTimeout(blobMorphTimeoutRef.current);
        }
        setTimeout(() => {
          if (!screeningComplete && !isListening && microphonePermission === 'granted') {
            startAutoRecordingCountdown();
          }
          if (!firstAgentTTSFinished) setShowMicAssist(true);
          setFirstAgentTTSFinished(true);
        }, 3000);
      }
    } catch (error) {
      console.error('[ScreeningInterface] Error playing speech:', error);
      setIsPlayingAudio(false);
      if (blobMorphTimeoutRef.current) {
        clearTimeout(blobMorphTimeoutRef.current);
      }
      setTimeout(() => {
        if (!screeningComplete && !isListening && microphonePermission === 'granted') {
          startAutoRecordingCountdown();
        }
        if (!firstAgentTTSFinished) setShowMicAssist(true);
        setFirstAgentTTSFinished(true);
      }, 1000);
    }
  };

  const initializeScreening = async () => {
    try {
      console.log('[ScreeningInterface] Starting screening initialization...');
      const response = await fetch('/api/screening/start', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ requirementId, userId })
      });

      const data = await response.json();
      console.log('[ScreeningInterface] Screening start response:', data);

      if (data.success) {
        setScreeningContext(data.screeningContext);
        setIsConnected(true);
        console.log('[ScreeningInterface] Screening context loaded:', data.screeningContext);

        // Initialize step-by-step interview session
        try {
          const sessionResponse = await fetch('/api/screening/step-by-step', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              candidateMessage: '',
              candidateId: data.screeningContext?.candidate?.candidate_id,
              requirementId: parseInt(requirementId),
              sessionId: null,
              isNewSession: true
            })
          });

          const sessionData = await sessionResponse.json();
          if (sessionData.success) {
            setSessionId(sessionData.sessionId);
            sessionIdRef.current = sessionData.sessionId; // Store in ref
            if (sessionData.progress) {
              setTotalSteps(sessionData.progress.totalSteps);
              setCurrentStep(sessionData.progress.currentStep);
              setScreeningProgress(sessionData.progress.completionRate);
            }
            // Only add the first agent message if there are no messages yet
            if (sessionData.response && !firstAgentMessageAdded.current) {
              addAgentMessage(sessionData.response);
              playAgentSpeech(sessionData.response);
              firstAgentMessageAdded.current = true;
            }
            // Update step status for indicators
            if (sessionData.allStepsWithStatus) {
              setAllStepsWithStatus(sessionData.allStepsWithStatus);
            }
            console.log('[ScreeningInterface] Step-by-step session initialized:', sessionData);
          }
        } catch (error) {
          console.error('[ScreeningInterface] Error initializing step-by-step session:', error);
        }
      } else {
        console.error('[ScreeningInterface] Failed to initialize screening:', data.error);
      }
    } catch (error) {
      console.error('[ScreeningInterface] Error initializing screening:', error);
    }
  };

  const addAgentMessage = (content: string) => {
    console.log('[ScreeningInterface] Adding agent message:', content);
    const newMessage: Message = {
      id: Date.now().toString(),
      sender: 'agent',
      content,
      timestamp: new Date()
    };
    setMessages(prev => [...prev, newMessage]);
    setAgentTyping(false);
  };

  const addCandidateMessage = (content: string) => {
    console.log('[ScreeningInterface] Adding candidate message:', content);
    const newMessage: Message = {
      id: Date.now().toString(),
      sender: 'candidate',
      content,
      timestamp: new Date()
    };
    setMessages(prev => [...prev, newMessage]);
  };

  const handleSendMessage = async (text?: string) => {
    const messageText = text || candidateResponse;
    if (!messageText.trim()) return;
    
    // Use session ID from ref if state is null
    const currentSessionId = sessionId || sessionIdRef.current;
    
    console.log('[ScreeningInterface] Sending candidate response:', messageText);
    console.log('[ScreeningInterface] Current session ID:', currentSessionId);
    addCandidateMessage(messageText);
    
    // Clear input
    if (!text) {
      setCandidateResponse('');
    }
    
    // Simulate agent processing
    setAgentTyping(true);
    
    try {
      // Get AI response using step-by-step API
      const response = await fetch('/api/screening/step-by-step', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          candidateMessage: messageText,
          candidateId: screeningContext?.candidate?.candidate_id,
          requirementId: parseInt(requirementId),
          sessionId: currentSessionId,
          isNewSession: false // Never create new session here
        })
      });

      const data = await response.json();
      
      if (data.success) {
        setTimeout(() => {
          addAgentMessage(data.response);
          playAgentSpeech(data.response);
          
          // Update session state
          setSessionId(data.sessionId);
          sessionIdRef.current = data.sessionId; // Update ref
          
          // Update progress
          if (data.progress) {
            setCompletionRate(data.progress.completionRate);
            setCurrentStep(data.progress.currentStep);
            setTotalSteps(data.progress.totalSteps);
            setScreeningProgress(data.progress.completionRate);
            setStepsWithNoResponse(data.progress.stepsWithNoResponse);
          }
          
          // Update step status for indicators
          if (data.allStepsWithStatus) {
            setAllStepsWithStatus(data.allStepsWithStatus);
          }
          
          // Update agent result state
          if (data.agentResult) {
            setStepCompleted(data.agentResult.stepCompleted);
            setNeedsFollowUp(data.agentResult.needsFollowUp);
          }
          
          // Check if interview is complete
          if (data.interviewComplete) {
            setScreeningComplete(true);
            console.log('[ScreeningInterface] Interview completed via step-by-step system');
          }
        }, 1000);
      } else {
        // If session failed, show error and don't create new session
        console.error('[ScreeningInterface] Session failed:', data.error);
        setTimeout(() => {
          const errorMessage = 'Sorry, there was an issue with the interview session. Please refresh the page and try again.';
          addAgentMessage(errorMessage);
          playAgentSpeech(errorMessage);
        }, 1000);
      }
    } catch (error) {
      console.error('[ScreeningInterface] Error getting AI response:', error);
      // Only show error message, don't add fallback response
      setTimeout(() => {
        const errorMessage = 'Sorry, there was an issue with the interview. Please try again.';
        addAgentMessage(errorMessage);
        playAgentSpeech(errorMessage);
      }, 1000);
    }
  };

  const completeScreening = async () => {
    try {
      console.log('[ScreeningInterface] Completing screening process...');
      
      // Calculate final scores (simulated)
      const scores = {
        skillsMatch: Math.floor(Math.random() * 40) + 60, // 60-100
        experienceRelevance: Math.floor(Math.random() * 30) + 70, // 70-100
        communication: Math.floor(Math.random() * 20) + 80, // 80-100
        culturalFit: Math.floor(Math.random() * 10) + 90 // 90-100
      };

      console.log('[ScreeningInterface] Calculated scores:', scores);

      const response = await fetch('/api/screening/score', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          candidateId: screeningContext?.candidate?.candidate_id,
          scores,
          responses: messages.filter(m => m.sender === 'candidate')
        })
      });

      const data = await response.json();
      console.log('[ScreeningInterface] Score submission response:', data);

      if (data.success) {
        setScreeningScore(data.score);
        setPassesScreening(data.passesScreening);
        setScreeningComplete(true);
        
        const finalMessage = data.passesScreening
          ? `Congratulations! You've passed the screening with a score of ${data.score}/100. We'll be in touch for the next stage.`
          : `Thank you for your time. Your screening score is ${data.score}/100. We'll review your application and get back to you.`;

        addAgentMessage(finalMessage);
        playAgentSpeech(finalMessage);
        console.log('[ScreeningInterface] Screening completed successfully');
      }
    } catch (error) {
      console.error('[ScreeningInterface] Error completing screening:', error);
    }
  };

  const toggleMute = () => {
    console.log('[ScreeningInterface] Toggling mute:', !isMuted);
    setIsMuted(!isMuted);
  };

  const toggleVideo = () => {
    console.log('[ScreeningInterface] 📺 Toggling video display. Current state:', isVideoOn);
    setIsVideoOn(!isVideoOn);
  };

  const toggleCamera = async () => {
    console.log('[ScreeningInterface] 🔄 Toggling camera. Current state:', isCameraOn);
    console.log('[ScreeningInterface] 🔄 Video ref exists:', !!videoRef.current);
    console.log('[ScreeningInterface] 🔄 Stream ref exists:', !!streamRef.current);
    
    if (isCameraOn) {
      console.log('[ScreeningInterface] 🛑 Stopping camera...');
      stopCamera();
    } else {
      console.log('[ScreeningInterface] ▶️ Starting camera...');
      await startCamera();
    }
  };

  const toggleAudio = () => {
    console.log('[ScreeningInterface] Toggling audio:', !audioEnabled);
    setAudioEnabled(!audioEnabled);
  };

  const endCall = () => {
    console.log('[ScreeningInterface] Ending call...');
    
    // Stop all streams and cleanup
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(track => track.stop());
    }
    if (recognitionRef.current) {
      recognitionRef.current.stop();
    }
    stopPhotoCapture();
    
    // Complete screening if not already done
    if (!screeningComplete) {
      completeScreening();
    }
    
    // Call the onComplete callback
    onComplete(screeningScore || 0, passesScreening || false);
  };

  // Remove all other hardcoded agent messages/slides

  // Remove nextSlide and prevSlide functions

  const startCamera = async () => {
    try {
      console.log('[ScreeningInterface] 🎥 Starting camera...');
      console.log('[ScreeningInterface] 📱 Checking media devices support...');
      console.log('[ScreeningInterface] 📱 navigator.mediaDevices exists:', !!navigator.mediaDevices);
      console.log('[ScreeningInterface] 📱 getUserMedia exists:', !!navigator.mediaDevices?.getUserMedia);
      
      const stream = await navigator.mediaDevices.getUserMedia({ 
        video: true, 
        audio: false 
      });
      console.log('[ScreeningInterface] ✅ Camera stream obtained:', stream);
      console.log('[ScreeningInterface] 📹 Stream tracks:', stream.getTracks());
      console.log('[ScreeningInterface] 📹 Video tracks:', stream.getVideoTracks());
      console.log('[ScreeningInterface] 📹 Track settings:', stream.getVideoTracks()[0]?.getSettings());
      
      streamRef.current = stream;
      console.log('[ScreeningInterface] 💾 Stream saved to ref');
      
      if (videoRef.current) {
        console.log('[ScreeningInterface] 🎬 Video element found, setting up...');
        console.log('[ScreeningInterface] 🎬 Video element current srcObject:', videoRef.current.srcObject);
        
        videoRef.current.srcObject = stream;
        console.log('[ScreeningInterface] ✅ Video srcObject set');
        console.log('[ScreeningInterface] 🎬 Video element new srcObject:', videoRef.current.srcObject);
        
        // Wait for video to be ready
        videoRef.current.onloadedmetadata = () => {
          console.log('[ScreeningInterface] 📐 Video metadata loaded');
          console.log('[ScreeningInterface] 📐 Video dimensions:', videoRef.current?.videoWidth, 'x', videoRef.current?.videoHeight);
          console.log('[ScreeningInterface] 🎬 Attempting to play video...');
          
          videoRef.current?.play().then(() => {
            console.log('[ScreeningInterface] ✅ Video playing successfully');
            console.log('[ScreeningInterface] 🎬 Video currentTime:', videoRef.current?.currentTime);
            console.log('[ScreeningInterface] 🎬 Video readyState:', videoRef.current?.readyState);
          }).catch((error) => {
            console.error('[ScreeningInterface] ❌ Error playing video:', error);
          });
        };
        
        videoRef.current.onerror = (error) => {
          console.error('[ScreeningInterface] ❌ Video error:', error);
          console.error('[ScreeningInterface] ❌ Video error details:', videoRef.current?.error);
        };
        
        videoRef.current.oncanplay = () => {
          console.log('[ScreeningInterface] ✅ Video can play');
          console.log('[ScreeningInterface] 🎬 Video readyState on canplay:', videoRef.current?.readyState);
        };

        videoRef.current.onplay = () => {
          console.log('[ScreeningInterface] 🎬 Video play event fired');
        };

        videoRef.current.onloadeddata = () => {
          console.log('[ScreeningInterface] 📊 Video data loaded');
        };

        videoRef.current.onstalled = () => {
          console.log('[ScreeningInterface] ⚠️ Video stalled');
        };

        videoRef.current.onwaiting = () => {
          console.log('[ScreeningInterface] ⏳ Video waiting for data');
        };
        
      } else {
        console.error('[ScreeningInterface] ❌ Video ref is still null - this should not happen');
      }
      
      setIsCameraOn(true);
      console.log('[ScreeningInterface] ✅ Camera state set to true');
    } catch (error) {
      console.error('[ScreeningInterface] ❌ Error starting camera:', error);
      console.error('[ScreeningInterface] ❌ Error name:', error instanceof Error ? error.name : 'Unknown');
      console.error('[ScreeningInterface] ❌ Error message:', error instanceof Error ? error.message : 'Unknown error');
      setIsCameraOn(false);
    }
  };

  const stopCamera = () => {
    console.log('[ScreeningInterface] Stopping camera...');
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(track => track.stop());
      streamRef.current = null;
    }
    if (videoRef.current) {
      videoRef.current.srcObject = null;
    }
    setIsCameraOn(false);
  };

  const startPhotoCapture = () => {
    console.log('[ScreeningInterface] 📸 Starting photo capture schedule...');
    
    // Take first photo after 30 seconds
    const firstPhotoTimeout = setTimeout(() => {
      if (photosTaken === 0) {
        capturePhoto();
      }
    }, 30000);
    
    // Take second photo after 2 minutes
    const secondPhotoTimeout = setTimeout(() => {
      if (photosTaken === 1) {
        capturePhoto();
      }
    }, 120000);
    
    setPhotoCaptureInterval(firstPhotoTimeout);
    
    // Cleanup timeouts when component unmounts
    return () => {
      clearTimeout(firstPhotoTimeout);
      clearTimeout(secondPhotoTimeout);
    };
  };

  const stopPhotoCapture = () => {
    if (photoCaptureInterval) {
      clearTimeout(photoCaptureInterval);
      setPhotoCaptureInterval(null);
    }
  };

  const capturePhoto = () => {
    if (videoRef.current && photosTaken < 2) {
      try {
        console.log('[ScreeningInterface] 📸 Capturing photo', photosTaken + 1);
        
        // Create canvas to capture video frame
        const canvas = document.createElement('canvas');
        const ctx = canvas.getContext('2d');
        
        if (ctx && videoRef.current) {
          canvas.width = videoRef.current.videoWidth;
          canvas.height = videoRef.current.videoHeight;
          
          // Draw video frame to canvas
          ctx.drawImage(videoRef.current, 0, 0);
          
          // Convert to blob
          canvas.toBlob((blob) => {
            if (blob) {
              // Create download link
              const url = URL.createObjectURL(blob);
              const a = document.createElement('a');
              a.href = url;
              a.download = `interview_photo_${photosTaken + 1}_${Date.now()}.png`;
              document.body.appendChild(a);
              a.click();
              document.body.removeChild(a);
              URL.revokeObjectURL(url);
              
              console.log('[ScreeningInterface] ✅ Photo saved:', a.download);
              setPhotosTaken(prev => prev + 1);
            }
          }, 'image/png');
        }
      } catch (error) {
        console.error('[ScreeningInterface] ❌ Photo capture error:', error);
      }
    }
  };

  const [isBlobResetting, setIsBlobResetting] = useState(false);
  const [shouldMorphBlob, setShouldMorphBlob] = useState(false);

  // Soft morph-to-circle transition for blob
  useEffect(() => {
    let startTimeout: NodeJS.Timeout | null = null;
    let finishTimeout: NodeJS.Timeout | null = null;
    if (isPlayingAudio) {
      // Delay morph start by 100ms
      startTimeout = setTimeout(() => setShouldMorphBlob(true), 0);
      setIsBlobResetting(false);
    } else {
      // Keep morph for 100ms, then start soft reset
      finishTimeout = setTimeout(() => {
        setShouldMorphBlob(false);
        setIsBlobResetting(true);
        setTimeout(() => setIsBlobResetting(false), 2000); // 2s soft finish
      }, 100);
    }
    return () => {
      if (startTimeout) clearTimeout(startTimeout);
      if (finishTimeout) clearTimeout(finishTimeout);
    };
  }, [isPlayingAudio]);

  // Add state for showing device dropdowns and device lists (empty for now, ready for real data)
  const [showMicDropdown, setShowMicDropdown] = useState(false);
  const [showCameraDropdown, setShowCameraDropdown] = useState(false);
  const micDevices: MediaDeviceInfo[] = previewMicDevices;
  const cameraDevices: MediaDeviceInfo[] = previewCameraDevices;
  const [showMicAssist, setShowMicAssist] = useState(false); // Only show after first agent TTS
  const [micAssistDismissed, setMicAssistDismissed] = useState(false); // Hide after mic button pressed
  const [timer, setTimer] = useState(15 * 60); // 15 minutes in seconds
  const timerRef = useRef<NodeJS.Timeout | null>(null);

  // Interview timer logic
  useEffect(() => {
    if (isConnected) {
      if (timerRef.current) clearInterval(timerRef.current);
      timerRef.current = setInterval(() => {
        setTimer((prev) => {
          if (prev <= 1) {
            clearInterval(timerRef.current!);
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
      return () => { if (timerRef.current) clearInterval(timerRef.current); };
    }
  }, [isConnected]);

  // Show vignette only after first agent TTS
  const [firstAgentTTSFinished, setFirstAgentTTSFinished] = useState(false);
  const handleMicButton = () => {
    if (!micAssistDismissed) {
      setShowMicAssist(false);
      setMicAssistDismissed(true);
    }
    isListening ? stopSpeechRecognition() : startSpeechRecognition();
  };

  const [showSidebar, setShowSidebar] = useState(true); // Sidebar visibility

  // Add state for CC (subtitles)
  const [ccEnabled, setCCEnabled] = useState<boolean>(defaultCCEnabled);

  if (!isConnected) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Connecting to screening session...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="h-screen bg-gray-900 flex flex-col">
      {/* Hidden audio element for TTS */}
      <audio ref={audioRef} style={{ display: 'none' }} />
      
      {/* Header */}
      <div className="bg-gray-800 text-white p-4 flex items-center justify-between relative">
        <div className="flex items-center space-x-4">
          <div className="w-10 h-10 bg-blue-600 rounded-full flex items-center justify-center">
            <User className="w-6 h-6" />
          </div>
          <div>
            <h1 className="font-semibold">Screening Interview</h1>
            <p className="text-sm text-gray-300">
              {screeningContext?.requirement?.role_name} - {screeningContext?.requirement?.creator_role}
            </p>
          </div>
        </div>
        {/* Timer Centered */}
        <div className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 flex items-center gap-2 bg-gray-800 bg-opacity-80 px-4 py-2 rounded-full shadow text-white font-semibold text-lg" style={{minWidth:'160px', justifyContent:'center'}}>
          <Clock className="w-5 h-5 text-white" />
          <span>{Math.floor(timer / 60).toString().padStart(2, '0')}:{(timer % 60).toString().padStart(2, '0')}</span>
          <span className="text-xs ml-2">min</span>
        </div>
        <div className="flex items-center space-x-2">
          <span className="text-sm text-gray-300">
            {screeningComplete && (
              <span className="font-semibold">
                Score: {screeningScore}/100
              </span>
            )}
            {!screeningComplete && totalSteps > 0 && (
              <span className="font-semibold">
                Step {currentStep + 1} of {totalSteps} • {completionRate.toFixed(1)}% Complete
              </span>
            )}
          </span>
          {photosTaken > 0 && (
            <div className="flex items-center space-x-1 text-yellow-400">
              <div className="w-2 h-2 bg-yellow-400 rounded-full animate-pulse"></div>
              <span className="text-xs">📸 {photosTaken}/2 photos captured</span>
            </div>
          )}
          {/* Removed contextWindow and needsFollowUp UI elements */}
          {/* Removed needsSecondChance UI element */}
          {stepCompleted && (
            <div className="flex items-center space-x-1 text-green-400">
              <div className="w-2 h-2 bg-green-400 rounded-full"></div>
              <span className="text-xs">✅ Step completed</span>
            </div>
          )}
          {stepsWithNoResponse > 0 && (
            <div className="flex items-center space-x-1 text-gray-400">
              <div className="w-2 h-2 bg-gray-400 rounded-full"></div>
              <span className="text-xs">❌ {stepsWithNoResponse} unanswered</span>
            </div>
          )}
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 flex relative">
        {/* Video Area - Dynamic width based on sidebar state */}
        <div className={`transition-all duration-500 ease-in-out ${showSidebar ? 'w-[calc(100%-24rem)]' : 'w-full'}`}>
          <div className="h-full">
            <div className="grid grid-cols-2 h-full">
              {/* Agent Video */}
              <div className="bg-gray-800 flex flex-col items-center justify-center relative">
                <div className={`blob mb-4 transition-all duration-[2000ms] ${shouldMorphBlob ? 'blob-animate' : ''} ${isBlobResetting ? 'blob-resetting' : ''}`}></div>
                <h3 className="text-white font-semibold">Sarah (Interviewer)</h3>
                <p className="text-gray-400 text-sm">Screening Agent</p>
              </div>

              {/* Candidate Video */}
              <div className="bg-gray-800 flex flex-col items-center justify-center relative overflow-hidden candidate-video-container">
                {/* Auto-microphone indicator */}
                {autoMicrophoneEnabled && (
                  <div className="auto-microphone-indicator">
                    🎤 Auto-enabled
                  </div>
                )}
                
                {/* Always render video element but control visibility */}
                <video
                  ref={videoRef}
                  className={`absolute inset-0 w-full h-full object-cover transition-opacity duration-300 ${
                    isCameraOn ? 'opacity-100' : 'opacity-0 pointer-events-none'
                  }`}
                  autoPlay
                  muted
                  playsInline
                  style={{ display: isCameraOn ? 'block' : 'none' }}
                />
                
                {/* Speaking Timer - show when camera is on too */}
                {speakingTimer !== null && isSpeaking && isCameraOn && (
                  <div className="speaking-timer">
                    <div className="speaking-timer-circle">
                      <svg className="speaking-timer-svg" viewBox="0 0 36 36">
                        <path
                          className="speaking-timer-bg"
                          d="M18 2.0845
                            a 15.9155 15.9155 0 0 1 0 31.831
                            a 15.9155 15.9155 0 0 1 0 -31.831"
                        />
                        <path
                          className="speaking-timer-progress"
                          strokeDasharray={`${(speakingTimer / 15) * 100}, 100`}
                          d="M18 2.0845
                            a 15.9155 15.9155 0 0 1 0 31.831
                            a 15.9155 15.9155 0 0 1 0 -31.831"
                        />
                      </svg>
                      <div className="speaking-timer-text">{speakingTimer}s</div>
                    </div>
                    <span className="text-green-400 text-sm">Speaking time</span>
                  </div>
                )}
                
                {/* Show avatar when camera is off */}
                {!isCameraOn && (
                  <>
                    <div className={`w-24 h-24 rounded-full flex items-center justify-center mb-4 transition-all duration-300 ${
                      isListening ? 'avatar-listening' : 
                      isVideoOn ? 'bg-green-600' : 'bg-gray-600'
                    }`}>
                      <User className="w-12 h-12 text-white" />
                    </div>
                    {isListening && (
                      <div className="audio-indicator">
                        <div className="audio-dots">
                          <div className="audio-dot"></div>
                          <div className="audio-dot"></div>
                          <div className="audio-dot"></div>
                        </div>
                      </div>
                    )}
                    <h3 className="text-white font-semibold">You</h3>
                    <p className="text-gray-400 text-sm">
                      {isVideoOn ? 'Video On' : 'Video Off'} • {isMuted ? 'Muted' : 'Unmuted'}
                    </p>
                    {autoRecordCountdown !== null && !isListening && (
                      <div className="countdown-indicator">
                        <div className="countdown-dot"></div>
                        <span className="text-yellow-400 text-sm">Listening in {autoRecordCountdown}s...</span>
                      </div>
                    )}
                    {/* Speaking Timer */}
                    {speakingTimer !== null && isSpeaking && (
                      <div className="speaking-timer">
                        <div className="speaking-timer-circle">
                          <svg className="speaking-timer-svg" viewBox="0 0 36 36">
                            <path
                              className="speaking-timer-bg"
                              d="M18 2.0845
                                a 15.9155 15.9155 0 0 1 0 31.831
                                a 15.9155 15.9155 0 0 1 0 -31.831"
                            />
                            <path
                              className="speaking-timer-progress"
                              strokeDasharray={`${(speakingTimer / 15) * 100}, 100`}
                              d="M18 2.0845
                                a 15.9155 15.9155 0 0 1 0 31.831
                                a 15.9155 15.9155 0 0 1 0 -31.831"
                            />
                          </svg>
                          <div className="speaking-timer-text">{speakingTimer}s</div>
                        </div>
                        <span className="text-green-400 text-sm">Speaking time remaining</span>
                      </div>
                    )}
                  </>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Chat Area - Now part of the flex layout */}
        <div
          className={`transition-all duration-500 ease-in-out ${showSidebar ? 'w-96' : 'w-0'} overflow-hidden`}
        >
          <Card className="flex flex-col h-full rounded-xl border border-gray-700 shadow-xl bg-gray-900/95 p-0">
            {/* Chat Header */}
            <div className="p-4 border-b border-gray-700 flex-shrink-0">
              <h3 className="text-white font-semibold flex items-center">
                <MessageCircle className="w-5 h-5 mr-2" />
                Interview Chat
              </h3>
              <div className="mt-2">
                <div className="w-full bg-gray-700 rounded-full h-2">
                  <div 
                    className="bg-blue-600 h-2 rounded-full transition-all duration-300"
                    style={{ width: `${screeningProgress}%` }}
                  ></div>
                </div>
                <p className="text-xs text-gray-400 mt-1">Progress: {screeningProgress}%</p>
              </div>
              {/* Step Completion Indicators */}
              {allStepsWithStatus.length > 0 && (
                <div className="mt-3">
                  <p className="text-xs text-gray-400 mb-2">Question Status:</p>
                  <div className="grid grid-cols-5 gap-1">
                    {allStepsWithStatus.map((step, index) => (
                      <div
                        key={step.step_id}
                        className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold step-indicator ${
                          step.status === 'completed' ? 'bg-green-500 text-white completed' :
                          step.status === 'partial' ? 'bg-yellow-500 text-white partial' :
                          step.status === 'current' ? 'bg-blue-500 text-white current' :
                          'bg-gray-500 text-white'
                        }`}
                        title={`${step.step_name}: ${step.status}`}
                      >
                        {index + 1}
                      </div>
                    ))}
                  </div>
                  <div className="flex flex-wrap gap-2 mt-2 text-xs">
                    <div className="flex items-center space-x-1">
                      <div className="w-3 h-3 bg-green-500 rounded-full"></div>
                      <span className="text-gray-300">Completed</span>
                    </div>
                    <div className="flex items-center space-x-1">
                      <div className="w-3 h-3 bg-yellow-500 rounded-full"></div>
                      <span className="text-gray-300">Partial</span>
                    </div>
                    <div className="flex items-center space-x-1">
                      <div className="w-3 h-3 bg-blue-500 rounded-full"></div>
                      <span className="text-gray-300">Current</span>
                    </div>
                    <div className="flex items-center space-x-1">
                      <div className="w-3 h-3 bg-gray-500 rounded-full"></div>
                      <span className="text-gray-300">No Response</span>
                    </div>
                  </div>
                </div>
              )}
            </div>
            {/* Messages */}
            <div className="flex-1 overflow-y-auto p-4 space-y-4 min-h-0 max-h-96">
              {messages.map((message) => (
                <div
                  key={message.id}
                  className={`flex ${message.sender === 'agent' ? 'justify-start' : 'justify-end'}`}
                >
                  <div
                    className={`max-w-xs p-3 rounded-lg ${
                      message.sender === 'agent'
                        ? 'bg-blue-600 text-white'
                        : 'bg-gray-700 text-white'
                    }`}
                  >
                    <p className="text-sm break-words">{message.content}</p>
                    <p className="text-xs opacity-70 mt-1">
                      {message.timestamp.toLocaleTimeString()}
                    </p>
                  </div>
                </div>
              ))}
              {agentTyping && (
                <div className="flex justify-start">
                  <div className="bg-blue-600 text-white p-3 rounded-lg">
                    <div className="flex space-x-1">
                      <div className="w-2 h-2 bg-white rounded-full animate-bounce"></div>
                      <div className="w-2 h-2 bg-white rounded-full animate-bounce" style={{ animationDelay: '0.1s' }}></div>
                      <div className="w-2 h-2 bg-white rounded-full animate-bounce" style={{ animationDelay: '0.2s' }}></div>
                    </div>
                  </div>
                </div>
              )}
              <div ref={chatEndRef} />
            </div>
            {/* Input Area */}
            {/* Removed input area for typing responses, as the interview is conversational (voice only) */}
          </Card>
        </div>
      </div>

      {/* Bottom Controls */}
      <div className="bg-gray-800 p-4 flex items-center justify-between">
        <div className="flex items-center space-x-4">
          <button
            onClick={endCall}
            className="p-3 rounded-full bg-red-600 text-white hover:bg-red-700 transition-all duration-200"
            title="End Call"
          >
            <Phone className="w-5 h-5" />
          </button>
        </div>
      </div>

      {/* Google Meet-style Floating Controls (moved to ScreeningBar) */}
      <ScreeningBar
        audioEnabled={audioEnabled}
        isListening={isListening}
        isCameraOn={isCameraOn}
        micDevices={micDevices}
        cameraDevices={cameraDevices}
        showMicDropdown={showMicDropdown}
        showCameraDropdown={showCameraDropdown}
        onToggleAudio={toggleAudio}
        onMicButton={handleMicButton}
        onToggleCamera={toggleCamera}
        onShowMicDropdown={() => setShowMicDropdown((v) => !v)}
        onShowCameraDropdown={() => setShowCameraDropdown((v) => !v)}
        onEndCall={endCall}
        onToggleCC={() => setCCEnabled((v) => !v)}
        ccEnabled={ccEnabled}
      />
      <ScreeningSidebarToggle showSidebar={showSidebar} onToggleSidebar={() => setShowSidebar((v) => !v)} />

      {/* Subtitles/CC overlay (show if ccEnabled) */}
      <SubtitlesOverlay messages={messages} ccEnabled={ccEnabled} />
    </div>
  );
}