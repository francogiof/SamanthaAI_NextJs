"use client";

import { useState, useEffect, useRef } from 'react';
import { User, MessageCircle, Share2, Mic, MicOff, Video, VideoOff, Phone, Volume2, VolumeX } from 'lucide-react';

interface ScreeningInterfaceProps {
  requirementId: string;
  userId: number;
  onComplete: (score: number, passes: boolean) => void;
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

export default function ScreeningInterface({ requirementId, userId, onComplete }: ScreeningInterfaceProps) {
  const [isConnected, setIsConnected] = useState(false);
  const [isMuted, setIsMuted] = useState(false);
  const [isVideoOn, setIsVideoOn] = useState(true);
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

  // Speech functionality states
  const [isRecording, setIsRecording] = useState(false);
  const [isPlayingAudio, setIsPlayingAudio] = useState(false);
  const [audioEnabled, setAudioEnabled] = useState(true);
  const [mediaRecorder, setMediaRecorder] = useState<MediaRecorder | null>(null);
  const [audioChunks, setAudioChunks] = useState<Blob[]>([]);
  const [autoRecordCountdown, setAutoRecordCountdown] = useState<number | null>(null);

  const chatEndRef = useRef<HTMLDivElement>(null);
  const responseInputRef = useRef<HTMLInputElement>(null);
  const audioRef = useRef<HTMLAudioElement>(null);
  const countdownRef = useRef<NodeJS.Timeout | null>(null);

  // Agent slides for presentation
  const agentSlides: AgentSlide[] = [
    {
      id: 'intro',
      type: 'introduction',
      content: {
        title: 'Welcome to Your Screening Interview',
        company: 'TechCorp Solutions',
        role: 'Machine Learning Engineer',
        duration: '15-20 minutes'
      }
    },
    {
      id: 'requirements',
      type: 'requirements',
      content: {
        title: 'Role Requirements',
        skills: ['Python', 'TensorFlow', 'PyTorch', 'ML Ops'],
        experience: '3+ years',
        responsibilities: [
          'Develop ML models',
          'Collaborate with data team',
          'Deploy to production'
        ]
      }
    },
    {
      id: 'questions',
      type: 'questions',
      content: {
        title: 'Skills Validation',
        questions: [
          'Can you describe your experience with Python for ML?',
          'What ML frameworks have you worked with?',
          'Tell me about a production ML model you deployed',
          'How do you handle model versioning and deployment?'
        ]
      }
    }
  ];

  useEffect(() => {
    console.log('[ScreeningInterface] Component mounted with props:', { requirementId, userId });
    initializeScreening();
    initializeSpeech();
  }, [requirementId, userId]);

  useEffect(() => {
    console.log('[ScreeningInterface] Screening progress updated:', screeningProgress);
    if (screeningProgress >= 100) {
      console.log('[ScreeningInterface] Screening completed, calculating final score...');
      completeScreening();
    }
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
    };
  }, []);

  const initializeSpeech = async () => {
    try {
      console.log('[ScreeningInterface] Initializing speech functionality...');
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      
      // Try different audio formats for better browser compatibility
      let mimeType = 'audio/webm;codecs=opus';
      if (!MediaRecorder.isTypeSupported(mimeType)) {
        mimeType = 'audio/webm';
        if (!MediaRecorder.isTypeSupported(mimeType)) {
          mimeType = 'audio/mp4';
          if (!MediaRecorder.isTypeSupported(mimeType)) {
            mimeType = 'audio/wav';
          }
        }
      }
      
      console.log('[ScreeningInterface] Using audio format:', mimeType);
      
      const recorder = new MediaRecorder(stream, {
        mimeType: mimeType
      });
      
      recorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          setAudioChunks(prev => [...prev, event.data]);
        }
      };

      recorder.onstop = async () => {
        console.log('[ScreeningInterface] Recording stopped, processing audio...');
        const audioBlob = new Blob(audioChunks, { type: mimeType });
        console.log('[ScreeningInterface] Audio blob size:', audioBlob.size, 'type:', audioBlob.type);
        await processAudioToText(audioBlob);
        setAudioChunks([]);
      };

      setMediaRecorder(recorder);
      console.log('[ScreeningInterface] Speech functionality initialized');
    } catch (error) {
      console.error('[ScreeningInterface] Error initializing speech:', error);
    }
  };

  const processAudioToText = async (audioBlob: Blob) => {
    try {
      console.log('[ScreeningInterface] Converting speech to text...');
      const formData = new FormData();
      
      // Use the actual blob type for the filename
      const fileExtension = audioBlob.type.split('/')[1] || 'webm';
      formData.append('audio', audioBlob, `recording.${fileExtension}`);

      const response = await fetch('/api/speech/stt', {
        method: 'POST',
        body: formData,
      });

      const data = await response.json();
      
      if (data.success && data.text) {
        console.log('[ScreeningInterface] Speech transcribed:', data.text);
        setCandidateResponse(data.text);
        // Auto-send the transcribed text
        handleSendMessage(data.text);
      } else {
        console.error('[ScreeningInterface] STT failed:', data.error);
        // Show error to user
        addAgentMessage("I didn't catch that. Could you please repeat your answer?");
      }
    } catch (error) {
      console.error('[ScreeningInterface] Error processing audio:', error);
      // Show error to user
      addAgentMessage("I'm having trouble hearing you. Could you please try again?");
    }
  };

  const startAutoRecordingCountdown = () => {
    if (screeningComplete || isRecording) return;
    
    console.log('[ScreeningInterface] Starting auto-recording countdown...');
    setAutoRecordCountdown(3);
    
    countdownRef.current = setInterval(() => {
      setAutoRecordCountdown(prev => {
        if (prev === null || prev <= 1) {
          if (countdownRef.current) {
            clearInterval(countdownRef.current);
            countdownRef.current = null;
          }
          setAutoRecordCountdown(null);
          if (!screeningComplete && !isRecording) {
            console.log('[ScreeningInterface] Auto-starting recording after countdown...');
            startRecording();
          }
          return null;
        }
        return prev - 1;
      });
    }, 1000);
  };

  const playAgentSpeech = async (text: string) => {
    if (!audioEnabled) {
      // If audio is disabled, still start countdown
      setTimeout(() => {
        if (!screeningComplete && !isRecording) {
          startAutoRecordingCountdown();
        }
      }, 1000);
      return;
    }
    
    try {
      console.log('[ScreeningInterface] Generating speech for:', text);
      setIsPlayingAudio(true);

      const response = await fetch('/api/speech/tts', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ text, voice: 'sarah' }),
      });

      if (response.ok) {
        const audioBlob = await response.blob();
        const audioUrl = URL.createObjectURL(audioBlob);
        
        if (audioRef.current) {
          audioRef.current.src = audioUrl;
          audioRef.current.onended = () => {
            setIsPlayingAudio(false);
            URL.revokeObjectURL(audioUrl);
            // Start countdown after agent finishes speaking
            startAutoRecordingCountdown();
          };
          await audioRef.current.play();
        }
      } else {
        console.error('[ScreeningInterface] TTS failed:', response.status);
        setIsPlayingAudio(false);
        // Start countdown even if TTS fails
        startAutoRecordingCountdown();
      }
    } catch (error) {
      console.error('[ScreeningInterface] Error playing speech:', error);
      setIsPlayingAudio(false);
      // Start countdown even if TTS fails
      startAutoRecordingCountdown();
    }
  };

  const startRecording = () => {
    if (mediaRecorder && mediaRecorder.state === 'inactive') {
      console.log('[ScreeningInterface] Starting recording...');
      setIsRecording(true);
      setAudioChunks([]);
      mediaRecorder.start();
    }
  };

  const stopRecording = () => {
    if (mediaRecorder && mediaRecorder.state === 'recording') {
      console.log('[ScreeningInterface] Stopping recording...');
      setIsRecording(false);
      mediaRecorder.stop();
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
        
        // Start agent presentation
        setTimeout(() => {
          const welcomeMessage = 'Hello! I\'m Sarah, your screening interviewer. Welcome to TechCorp Solutions! How are you today?';
          addAgentMessage(welcomeMessage);
          playAgentSpeech(welcomeMessage);
          setCurrentSlide(0);
        }, 1000);
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
    
    console.log('[ScreeningInterface] Sending candidate response:', messageText);
    addCandidateMessage(messageText);
    
    // Clear input
    if (!text) {
      setCandidateResponse('');
    }
    
    // Simulate agent processing
    setAgentTyping(true);
    
    try {
      // Get AI response using conversation API
      const response = await fetch('/api/screening/conversation', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          candidateMessage: messageText,
          screeningContext,
          conversationHistory: messages,
          currentQuestion
        })
      });

      const data = await response.json();
      
      if (data.success) {
        setTimeout(() => {
          addAgentMessage(data.response);
          playAgentSpeech(data.response);
          setScreeningProgress(prev => Math.min(prev + 25, 100));
        }, 1000);
      } else {
        // Fallback to simple response
        setTimeout(() => {
          const fallbackResponse = 'Thank you for that response. Could you tell me more about your experience?';
          addAgentMessage(fallbackResponse);
          playAgentSpeech(fallbackResponse);
          setScreeningProgress(prev => Math.min(prev + 25, 100));
        }, 1000);
      }
    } catch (error) {
      console.error('[ScreeningInterface] Error getting AI response:', error);
      // Fallback response
      setTimeout(() => {
        const fallbackResponse = 'Thank you for sharing that. Let me ask you another question.';
        addAgentMessage(fallbackResponse);
        playAgentSpeech(fallbackResponse);
        setScreeningProgress(prev => Math.min(prev + 25, 100));
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
    console.log('[ScreeningInterface] Toggling video:', !isVideoOn);
    setIsVideoOn(!isVideoOn);
  };

  const toggleAudio = () => {
    console.log('[ScreeningInterface] Toggling audio:', !audioEnabled);
    setAudioEnabled(!audioEnabled);
  };

  const nextSlide = () => {
    console.log('[ScreeningInterface] Moving to next slide:', currentSlide + 1);
    setCurrentSlide(prev => Math.min(prev + 1, agentSlides.length - 1));
  };

  const prevSlide = () => {
    console.log('[ScreeningInterface] Moving to previous slide:', currentSlide - 1);
    setCurrentSlide(prev => Math.max(prev - 1, 0));
  };

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
      <div className="bg-gray-800 text-white p-4 flex items-center justify-between">
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
        
        <div className="flex items-center space-x-2">
          <button
            onClick={toggleAudio}
            className={`p-2 rounded-full ${!audioEnabled ? 'bg-red-600' : 'bg-gray-700'} hover:bg-opacity-80`}
          >
            {!audioEnabled ? <VolumeX className="w-5 h-5" /> : <Volume2 className="w-5 h-5" />}
          </button>
          <button
            onClick={toggleMute}
            className={`p-2 rounded-full ${isMuted ? 'bg-red-600' : 'bg-gray-700'} hover:bg-opacity-80`}
          >
            {isMuted ? <MicOff className="w-5 h-5" /> : <Mic className="w-5 h-5" />}
          </button>
          <button
            onClick={toggleVideo}
            className={`p-2 rounded-full ${!isVideoOn ? 'bg-red-600' : 'bg-gray-700'} hover:bg-opacity-80`}
          >
            {!isVideoOn ? <VideoOff className="w-5 h-5" /> : <Video className="w-5 h-5" />}
          </button>
          <button className="p-2 rounded-full bg-red-600 hover:bg-opacity-80">
            <Phone className="w-5 h-5" />
          </button>
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 flex">
        {/* Video Area */}
        <div className="flex-1 p-4">
          <div className="grid grid-cols-2 gap-4 h-full">
            {/* Agent Video */}
            <div className="bg-gray-800 rounded-lg p-4 flex flex-col items-center justify-center">
              <div className="w-24 h-24 bg-blue-600 rounded-full flex items-center justify-center mb-4">
                <User className="w-12 h-12 text-white" />
              </div>
              <h3 className="text-white font-semibold">Sarah (Interviewer)</h3>
              <p className="text-gray-400 text-sm">Screening Agent</p>
              {isPlayingAudio && (
                <div className="mt-2 flex space-x-1">
                  <div className="w-2 h-2 bg-blue-400 rounded-full animate-bounce"></div>
                  <div className="w-2 h-2 bg-blue-400 rounded-full animate-bounce" style={{ animationDelay: '0.1s' }}></div>
                  <div className="w-2 h-2 bg-blue-400 rounded-full animate-bounce" style={{ animationDelay: '0.2s' }}></div>
                </div>
              )}
            </div>

            {/* Candidate Video */}
            <div className="bg-gray-800 rounded-lg p-4 flex flex-col items-center justify-center">
              <div className={`w-24 h-24 rounded-full flex items-center justify-center mb-4 ${
                isVideoOn ? 'bg-green-600' : 'bg-gray-600'
              }`}>
                <User className="w-12 h-12 text-white" />
              </div>
              <h3 className="text-white font-semibold">You</h3>
              <p className="text-gray-400 text-sm">
                {isVideoOn ? 'Video On' : 'Video Off'} • {isMuted ? 'Muted' : 'Unmuted'}
              </p>
              {isRecording && (
                <div className="mt-2 flex items-center gap-2">
                  <div className="w-3 h-3 bg-red-500 rounded-full animate-pulse"></div>
                  <span className="text-red-400 text-sm">Recording...</span>
                </div>
              )}
              {autoRecordCountdown !== null && !isRecording && (
                <div className="mt-2 flex items-center gap-2">
                  <div className="w-3 h-3 bg-yellow-500 rounded-full animate-pulse"></div>
                  <span className="text-yellow-400 text-sm">Recording in {autoRecordCountdown}s...</span>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Chat Area */}
        <div className="w-96 bg-gray-800 flex flex-col">
          {/* Chat Header */}
          <div className="p-4 border-b border-gray-700">
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
          </div>

          {/* Messages */}
          <div className="flex-1 overflow-y-auto p-4 space-y-4">
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
                  <p className="text-sm">{message.content}</p>
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
          <div className="p-4 border-t border-gray-700">
            <div className="flex space-x-2">
              <button
                onClick={isRecording ? stopRecording : startRecording}
                disabled={isMuted || screeningComplete}
                className={`p-2 rounded-lg ${
                  isRecording 
                    ? 'bg-red-600 text-white' 
                    : 'bg-gray-700 text-white hover:bg-gray-600'
                } disabled:opacity-50 disabled:cursor-not-allowed`}
              >
                {isRecording ? <MicOff className="w-5 h-5" /> : <Mic className="w-5 h-5" />}
              </button>
              <input
                ref={responseInputRef}
                type="text"
                value={candidateResponse}
                onChange={(e) => setCandidateResponse(e.target.value)}
                onKeyPress={(e) => e.key === 'Enter' && handleSendMessage()}
                placeholder="Type your response..."
                className="flex-1 bg-gray-700 text-white px-3 py-2 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                disabled={screeningComplete}
              />
              <button
                onClick={() => handleSendMessage()}
                disabled={!candidateResponse.trim() || screeningComplete}
                className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Send
              </button>
            </div>
            <p className="text-xs text-gray-400 mt-2">
              {isRecording ? 'Recording... Click microphone to stop' : 'Click microphone to record or type your response'}
            </p>
          </div>
        </div>
      </div>

      {/* Bottom Controls */}
      <div className="bg-gray-800 p-4 flex items-center justify-between">
        <div className="flex items-center space-x-4">
          <button
            onClick={prevSlide}
            disabled={currentSlide === 0}
            className="px-4 py-2 bg-gray-700 text-white rounded-lg hover:bg-gray-600 disabled:opacity-50"
          >
            Previous
          </button>
          <span className="text-white text-sm">
            Slide {currentSlide + 1} of {agentSlides.length}
          </span>
          <button
            onClick={nextSlide}
            disabled={currentSlide === agentSlides.length - 1}
            className="px-4 py-2 bg-gray-700 text-white rounded-lg hover:bg-gray-600 disabled:opacity-50"
          >
            Next
          </button>
        </div>

        <div className="flex items-center space-x-4">
          {screeningComplete && (
            <div className="text-white">
              <span className="font-semibold">
                Score: {screeningScore}/100
              </span>
              <span className={`ml-2 px-2 py-1 rounded text-xs ${
                passesScreening ? 'bg-green-600' : 'bg-red-600'
              }`}>
                {passesScreening ? 'PASSED' : 'REVIEW'}
              </span>
            </div>
          )}
          
          <button
            onClick={() => onComplete(screeningScore || 0, passesScreening || false)}
            disabled={!screeningComplete}
            className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50"
          >
            Continue
          </button>
        </div>
      </div>
    </div>
  );
} 