import React, { useEffect, useRef, useState } from 'react';
import { useReactMediaRecorder } from 'react-media-recorder';
import '../ChatbotWidget.css';
import { 
  sendQuery, 
  checkHealth, 
  getCurrentSessionId, 
  setCurrentSessionId,
  getOrCreateSessionId,
  createDefaultSession,
  testLocalStorage,
  sessionInit,
  type QueryResponse 
} from '../services';
import { transcribeAudioFromBlobUrl } from '../services/voiceService';
import ChatHeader from './ChatHeader';
import MessageList from './MessageList';
import ChatInput from './ChatInput';
import VoiceRecordingView from './VoiceRecordingView';
import type { Message } from '../types';

const ChatbotWidget: React.FC = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState<Message[]>([
    {
      id: 1,
      text: "Hello! How can I help you today?",
      isUser: false,
      timestamp: new Date()
    }
  ]);
  const [inputValue, setInputValue] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [apiConnected, setApiConnected] = useState<boolean | null>(null);

  const [isMicrophoneOn, setIsMicrophoneOn] = useState(false);
  const [isVoiceLoading, setIsVoiceLoading] = useState(false);
  const [mediaRecorder, setMediaRecorder] = useState<MediaRecorder | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const chunksRef = useRef<Blob[]>([]);
  const wasCancelledRef = useRef(false);
  const [shouldTranscribe, setShouldTranscribe] = useState(false);
  const audioContextRef = useRef<AudioContext | null>(null);
  const analyserRef = useRef<AnalyserNode | null>(null);
  const animationFrameRef = useRef<number | null>(null);

  const {
    startRecording,
    stopRecording,
    mediaBlobUrl,
    clearBlobUrl,
  } = useReactMediaRecorder({
    audio: true,
    mediaRecorderOptions: {
      mimeType: 'audio/webm;codecs=opus',
    }
  });

  useEffect(() => {
    console.log('🤖 ChatbotWidget mounted!');
    console.log('🗑️ Clearing all session data on website visit...');
    localStorage.removeItem('chatbot_current_session_id');
    localStorage.removeItem('chatbot_previous_session_id');
    console.log('✅ All session data cleared');

    (window as Window & { debugSession?: unknown }).debugSession = {
      getCurrentSessionId,
      setCurrentSessionId,
      getOrCreateSessionId,
      createDefaultSession,
      testLocalStorage,
      clearSessionData: () => {
        localStorage.removeItem('chatbot_current_session_id');
        localStorage.removeItem('chatbot_previous_session_id');
        console.log('🗑️ Cleared all session data');
      },
      showLocalStorage: () => {
        console.log('📦 All localStorage:', {
          'chatbot_current_session_id': localStorage.getItem('chatbot_current_session_id'),
          'chatbot_previous_session_id': localStorage.getItem('chatbot_previous_session_id') || 'undefined',
          allKeys: Object.keys(localStorage)
        });
      }
    };

    const initializeChatbot = async () => {
      try {
        const localStorageTest = testLocalStorage();
        console.log('🧪 localStorage test result:', localStorageTest);

        if (!localStorageTest.working) {
          console.error('❌ localStorage is not working properly!');
          return;
        }

        const healthResponse = await checkHealth();
        if (healthResponse.success) {
          setApiConnected(true);
          console.log('✅ API connected');
        } else {
          setApiConnected(false);
          console.warn('⚠️ API connection failed');
        }
      } catch (error) {
        console.error('❌ Initialization failed:', error);
        setApiConnected(false);
      }
    };

    initializeChatbot();
  }, []);

  const toggleChat = () => {
    console.log('💬 Toggle clicked! Current state:', isOpen);
    if (!isOpen) {
      console.log('🔍 Opening chat - checking session...');
      const existingCurrentSession = getCurrentSessionId();
      if (!existingCurrentSession) {
        const session = createDefaultSession();
        console.log('🆔 Created new session on chat open:', session);
      } else {
        console.log('🔄 Found existing current session:', existingCurrentSession);
      }
      const finalCurrentSession = getCurrentSessionId();
      const finalPreviousSession = localStorage.getItem('chatbot_previous_session_id');
      console.log('🔍 Final session verification:', {
        current: finalCurrentSession,
        previous: finalPreviousSession || 'undefined'
      });
    }
    setIsOpen(!isOpen);
  };

  const sendMessageToAPI = async (userMessage: string): Promise<Message> => {
    try {
      const currentSessionId = getCurrentSessionId();
      console.log('📤 Sending to API:', { sessionId: currentSessionId, message: userMessage });
      const response = await sendQuery(userMessage, currentSessionId || undefined);

      if (response.success && response.data) {
        const apiResponse: QueryResponse = response.data;
        console.log('✅ API response:', apiResponse);
        if (apiResponse.sessionId) {
          setCurrentSessionId(apiResponse.sessionId);
          console.log('💾 Updated session ID in localStorage:', apiResponse.sessionId);
        }
        return {
          id: Date.now(),
          text: apiResponse.answer,
          isUser: false,
          timestamp: new Date(),
          links: apiResponse.links,
          sources: apiResponse.turn.sources,
          detectedLanguage: apiResponse.turn.detectedLanguage,
          confidence: apiResponse.turn.confidence,
        };
      } else {
        console.error('❌ API failed:', response.error);
        return {
          id: Date.now(),
          text: `Sorry, I'm having trouble connecting. ${response.error || 'Please try again.'}`,
          isUser: false,
          timestamp: new Date(),
        };
      }
    } catch (error) {
      console.error('❌ API error:', error);
      return {
        id: Date.now(),
        text: "Sorry, something went wrong. Please try again.",
        isUser: false,
        timestamp: new Date(),
      };
    }
  };

  const handleSendMessage = async () => {
    if (!inputValue.trim() || isLoading) return;
    const userMessage: Message = {
      id: Date.now(),
      text: inputValue,
      isUser: true,
      timestamp: new Date()
    };
    setMessages(prev => [...prev, userMessage]);
    const currentMessage = inputValue;
    setInputValue('');
    setIsLoading(true);
    try {
      const botResponse = await sendMessageToAPI(currentMessage);
      setMessages(prev => [...prev, botResponse]);
    } catch (error) {
      console.error('❌ Send message error:', error);
      const errorMessage: Message = {
        id: Date.now(),
        text: "Sorry, something went wrong. Please try again.",
        isUser: false,
        timestamp: new Date()
      };
      setMessages(prev => [...prev, errorMessage]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      handleSendMessage();
    }
  };

  const handleClearChat = async () => {
    const currentSessionId = getCurrentSessionId();
    if (!currentSessionId || isLoading) return;
    try {
      console.log('🗑️ Clearing chat session:', currentSessionId);
      setIsLoading(true);
      const response = await sessionInit();
      if (response.success && response.data) {
        setMessages([{ id: 1, text: "Hello! How can I help you today?", isUser: false, timestamp: new Date() }]);
        console.log(`✅ Session initialized successfully. ${response.data.archivedTurns} turns archived.`);
      } else {
        console.error('❌ Session init failed:', response.error);
        setMessages([{ id: 1, text: "Hello! How can I help you today?", isUser: false, timestamp: new Date() }]);
      }
    } catch (error) {
      console.error('❌ Session init error:', error);
      setMessages([{ id: 1, text: "Hello! How can I help you today?", isUser: false, timestamp: new Date() }]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleMicrophoneClick = async () => {
    if (!isMicrophoneOn) {
      try {
        startRecording();
        const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
        streamRef.current = stream;
        const AudioContextClass = (window.AudioContext || (window as Window & { webkitAudioContext?: typeof AudioContext }).webkitAudioContext)!;
        audioContextRef.current = new AudioContextClass();
        const source = audioContextRef.current.createMediaStreamSource(stream);
        analyserRef.current = audioContextRef.current.createAnalyser();
        analyserRef.current.fftSize = 256;
        source.connect(analyserRef.current);
        const recorder = new MediaRecorder(stream);
        wasCancelledRef.current = false;
        recorder.ondataavailable = (event) => {
          if (event.data.size > 0) {
            chunksRef.current.push(event.data);
          }
        };
        recorder.onstop = () => {
          chunksRef.current = [];
        };
        setMediaRecorder(recorder);
        recorder.start();
        setIsMicrophoneOn(true);
      } catch {
        alert('Microphone access denied. Please allow microphone access to use voice input.');
      }
    } else {
      stopRecording();
      if (mediaRecorder && mediaRecorder.state === 'recording') {
        mediaRecorder.stop();
      }
      if (streamRef.current) {
        streamRef.current.getTracks().forEach(track => track.stop());
        streamRef.current = null;
      }
      if (audioContextRef.current) {
        audioContextRef.current.close();
        audioContextRef.current = null;
      }
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current);
        animationFrameRef.current = null;
      }
      setMediaRecorder(null);
      setIsMicrophoneOn(false);
    }
  };

  const handleCloseVoice = () => {
    wasCancelledRef.current = true;
    stopRecording();
    if (mediaRecorder && mediaRecorder.state === 'recording') {
      mediaRecorder.onstop = () => {
        chunksRef.current = [];
      };
      mediaRecorder.stop();
    }
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(track => track.stop());
      streamRef.current = null;
    }
    if (audioContextRef.current) {
      audioContextRef.current.close();
      audioContextRef.current = null;
    }
    if (animationFrameRef.current) {
      cancelAnimationFrame(animationFrameRef.current);
      animationFrameRef.current = null;
    }
    clearBlobUrl();
    setMediaRecorder(null);
    setIsMicrophoneOn(false);
    setShouldTranscribe(false);
  };

  const handleConfirmVoice = async () => {
    wasCancelledRef.current = false;
    stopRecording();
    if (mediaRecorder && mediaRecorder.state === 'recording') {
      mediaRecorder.stop();
    }
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(track => track.stop());
      streamRef.current = null;
    }
    if (audioContextRef.current) {
      audioContextRef.current.close();
      audioContextRef.current = null;
    }
    if (animationFrameRef.current) {
      cancelAnimationFrame(animationFrameRef.current);
      animationFrameRef.current = null;
    }
    setMediaRecorder(null);
    setInputValue('');
    setIsVoiceLoading(true);
    setShouldTranscribe(true);
  };

  useEffect(() => {
    return () => {
      if (streamRef.current) {
        streamRef.current.getTracks().forEach(track => track.stop());
        streamRef.current = null;
      }
      if (audioContextRef.current) {
        audioContextRef.current.close();
        audioContextRef.current = null;
      }
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current);
        animationFrameRef.current = null;
      }
    };
  }, []);

  useEffect(() => {
    if (!shouldTranscribe) return;
    if (wasCancelledRef.current) {
      setShouldTranscribe(false);
      return;
    }
    if (!mediaBlobUrl) return;

    const runTranscription = async () => {
      try {
        const result = await transcribeAudioFromBlobUrl(mediaBlobUrl) as { transcript?: string; answer?: string };
        if (result && result.transcript) {
          console.log('📝 Voice transcription result:', result);
          setInputValue(result.transcript);
        } else {
          if (result && result.answer) {
            console.log('📝 Voice transcription result (using answer):', result);
            setInputValue(result.answer);
          }
        }
      } catch {
        console.error('❌ Voice transcription error');
        alert("Sorry, I couldn't process your voice message. Please try again.");
      } finally {
        if (streamRef.current) {
          streamRef.current.getTracks().forEach(track => track.stop());
          streamRef.current = null;
        }
        setMediaRecorder(null);
        setIsMicrophoneOn(false);
        clearBlobUrl();
        setShouldTranscribe(false);
        setIsVoiceLoading(false);
      }
    };
    runTranscription();
  }, [shouldTranscribe, mediaBlobUrl, clearBlobUrl]);

  console.log('🎯 ChatbotWidget rendering, isOpen:', isOpen);

  return (
    <div className="chatbot-widget">
      {isOpen && (
        <div className="chatbot-interface">
          <ChatHeader apiConnected={apiConnected} onClose={toggleChat} />
          <MessageList messages={messages} isLoading={isLoading} />
          {!isMicrophoneOn ? (
            <ChatInput
              inputValue={inputValue}
              onInputChange={setInputValue}
              onKeyPress={handleKeyPress}
              isLoading={isLoading}
              isVoiceLoading={isVoiceLoading}
              onSend={handleSendMessage}
              onMicClick={handleMicrophoneClick}
              onClear={handleClearChat}
              hasSession={!!getCurrentSessionId()}
            />
          ) : (
            <VoiceRecordingView
              mediaRecorder={mediaRecorder}
              isMicrophoneOn={isMicrophoneOn}
              isVoiceLoading={isVoiceLoading}
              onClose={handleCloseVoice}
              onConfirm={handleConfirmVoice}
              analyserRef={analyserRef}
              animationFrameRef={animationFrameRef}
            />
          )}
        </div>
      )}

      <button 
        className="chatbot-toggle-btn"
        onClick={toggleChat}
        style={{
          position: 'fixed',
          bottom: '20px',
          right: '20px',
          zIndex: 10000,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          backgroundColor: '#007bff',
          color: 'white',
          border: '2px solid #0056b3'
        }}
      >
        {isOpen ? '×' : '💬'}
      </button>
    </div>
  );
};

export default ChatbotWidget;


