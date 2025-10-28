import React, { useState, useEffect, useRef } from 'react';
import ReactMarkdown from 'react-markdown';
import { useReactMediaRecorder } from 'react-media-recorder';
import './ChatbotWidget.css';
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
} from './services';
import { transcribeAudioFromBlobUrl } from './services/voiceService';

interface Message {
  id: number;
  text: string;
  isUser: boolean;
  timestamp: Date;
  links?: Array<{
    number: string;
    title: string;
    url: string;
  }>;
  sources?: string[];
  detectedLanguage?: string;
  confidence?: number;
}

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
  
  // Microphone states
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

  // Initialize chatbot and clear all sessions on mount
  useEffect(() => {
    console.log('🤖 ChatbotWidget mounted!');
    
    // Clear all session data when user visits the website
    console.log('🗑️ Clearing all session data on website visit...');
    localStorage.removeItem('chatbot_current_session_id');
    localStorage.removeItem('chatbot_previous_session_id');
    console.log('✅ All session data cleared');
    
    // Add debugging functions to window for manual testing
    (window as any).debugSession = {
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
        // Test localStorage first
        const localStorageTest = testLocalStorage();
        console.log('🧪 localStorage test result:', localStorageTest);
        
        if (!localStorageTest.working) {
          console.error('❌ localStorage is not working properly!');
          return;
        }

        // Check API health
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
    
    // If opening the chat for the first time, check/create session
    if (!isOpen) {
      console.log('🔍 Opening chat - checking session...');
      
      // Check if we have existing current session
      const existingCurrentSession = getCurrentSessionId();
      
      if (!existingCurrentSession) {
        // Create only current session ID when user first opens the chat
        const session = createDefaultSession();
        console.log('🆔 Created new session on chat open:', session);
      } else {
        console.log('🔄 Found existing current session:', existingCurrentSession);
      }
      
      // Verify current session exists
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
      // Always get sessionId from localStorage for every request
      const currentSessionId = getCurrentSessionId();
      console.log('📤 Sending to API:', { sessionId: currentSessionId, message: userMessage });
      
      // Send query - the sendQuery function will handle session creation automatically
      const response = await sendQuery(userMessage, currentSessionId || undefined);
      
      if (response.success && response.data) {
        const apiResponse: QueryResponse = response.data;
        console.log('✅ API response:', apiResponse);
        
        // Always update session ID from the response (this handles both new and existing sessions)
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
      
      // Initialize a new session. This will:
      // - read previousSessionId from localStorage (chatbot_current_session_id)
      // - generate and persist a newSessionId to localStorage
      const response = await sessionInit();
      
      if (response.success && response.data) {
        // Clear messages and reset to welcome message
        setMessages([{
          id: 1,
          text: "Hello! How can I help you today?",
          isUser: false,
          timestamp: new Date()
        }]);
        
        console.log(`✅ Session initialized successfully. ${response.data.archivedTurns} turns archived.`);
      } else {
        console.error('❌ Session init failed:', response.error);
        // Still clear the UI even if backend fails
        setMessages([{
          id: 1,
          text: "Hello! How can I help you today?",
          isUser: false,
          timestamp: new Date()
        }]);
      }
    } catch (error) {
      console.error('❌ Session init error:', error);
      // Clear UI anyway for better UX
      setMessages([{
        id: 1,
        text: "Hello! How can I help you today?",
        isUser: false,
        timestamp: new Date()
      }]);
    } finally {
      setIsLoading(false);
    }
  };

  // Custom audio visualizer component
  const AudioVisualizer = () => {
    const canvasRef = useRef<HTMLCanvasElement>(null);
    
    useEffect(() => {
      if (!isMicrophoneOn || !analyserRef.current) return;
      
      const canvas = canvasRef.current;
      if (!canvas) return;
      
      const ctx = canvas.getContext('2d');
      if (!ctx) return;
      
      const bufferLength = analyserRef.current.frequencyBinCount;
      const dataArray = new Uint8Array(bufferLength);
      
      const draw = () => {
        if (!isMicrophoneOn) return;
        
        analyserRef.current!.getByteFrequencyData(dataArray);
        
        ctx.fillStyle = 'rgba(0, 123, 255, 0.1)';
        ctx.fillRect(0, 0, canvas.width, canvas.height);
        
        const barWidth = (canvas.width / bufferLength) * 2.5;
        let barHeight;
        let x = 0;
        
        for (let i = 0; i < bufferLength; i++) {
          barHeight = (dataArray[i] / 255) * canvas.height;
          
          ctx.fillStyle = `rgb(${barHeight + 100}, 50, 50)`;
          ctx.fillRect(x, canvas.height - barHeight, barWidth, barHeight);
          
          x += barWidth + 1;
        }
        
        animationFrameRef.current = requestAnimationFrame(draw);
      };
      
      draw();
      
      return () => {
        if (animationFrameRef.current) {
          cancelAnimationFrame(animationFrameRef.current);
        }
      };
    }, [isMicrophoneOn]);
    
    return (
      <canvas
        ref={canvasRef}
        width={300}
        height={60}
        style={{ width: '100%', height: '60px' }}
      />
    );
  };

  // Microphone handling functions
  const handleMicrophoneClick = async () => {
    if (!isMicrophoneOn) {
      try {
        startRecording();
        
        const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
        streamRef.current = stream;
        
        // Set up audio context for visualization
        audioContextRef.current = new (window.AudioContext || (window as any).webkitAudioContext)();
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
      } catch (error) {
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

  // Cleanup microphone stream on component unmount
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

  // Handle voice transcription
  useEffect(() => {
    if (!shouldTranscribe) return;
    if (wasCancelledRef.current) {
      setShouldTranscribe(false);
      return;
    }
    if (!mediaBlobUrl) return;
    
    const runTranscription = async () => {
      try {
        const result = await transcribeAudioFromBlobUrl(mediaBlobUrl) as any;
        if (result && result.transcript) {
          // Populate the input box with the transcribed text
          // Let the user decide whether to send it or not
          console.log('📝 Voice transcription result:', result);
          setInputValue(result.transcript);
        } else {
          // Fallback to result.answer if transcript is not available
          if (result && result.answer) {
            console.log('📝 Voice transcription result (using answer):', result);
            setInputValue(result.answer);
          }
        }
      } catch {
        console.error('❌ Voice transcription error');
        // Show error in a temporary way - could also show an alert or message
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
  }, [shouldTranscribe, mediaBlobUrl]);

  console.log('🎯 ChatbotWidget rendering, isOpen:', isOpen);
  
  return (
    <div className="chatbot-widget">
      {/* Chat Interface */}
      {isOpen && (
        <div className="chatbot-interface">
          <div className="chatbot-header">
            <div className="chatbot-title">
              <h3>Chat Support</h3>
              <div className="api-status">
                {apiConnected === null && <span className="status-checking">🔄 Checking...</span>}
                {apiConnected === true && <span className="status-connected">🟢 Connected</span>}
                {apiConnected === false && <span className="status-disconnected">🔴 Offline</span>}
              </div>
            </div>
            <button 
              className="chatbot-close-btn"
              onClick={toggleChat}
            >
              ×
            </button>
          </div>
          
          <div className="chatbot-messages">
            {messages.map((message) => (
              <div 
                key={message.id} 
                className={`chatbot-message ${message.isUser ? 'user-message' : 'bot-message'}`}
              >
                {message.isUser ? (
                  <p>{message.text}</p>
                ) : (
                  <ReactMarkdown>{message.text}</ReactMarkdown>
                )}
                
                {/* Show links if available */}
                {message.links && message.links.length > 0 && (
                  <div className="message-links">
                    <strong>Sources:</strong>
                    {message.links.map((link, index) => (
                      <a 
                        key={index}
                        href={link.url} 
                        target="_blank" 
                        rel="noopener noreferrer"
                        className="message-link"
                      >
                        [{link.number}] {link.title}
                      </a>
                    ))}
                  </div>
                )}
                
                {/* Show language detection info */}
                {message.detectedLanguage && (
                  <div className="message-meta">
                    <small>
                      Language: {message.detectedLanguage} 
                      {message.confidence && ` (${Math.round(message.confidence * 100)}% confidence)`}
                    </small>
                  </div>
                )}
                
                <small className="message-time">
                  {message.timestamp.toLocaleTimeString()}
                </small>
              </div>
            ))}
            
            {isLoading && (
              <div className="chatbot-message bot-message">
                <p>Thinking...</p>
              </div>
            )}
          </div>
          
          <div className="chatbot-input">
            {!isMicrophoneOn ? (
              <>
                <input 
                  type="text" 
                  placeholder="Type your message..."
                  value={inputValue}
                  onChange={(e) => setInputValue(e.target.value)}
                  onKeyPress={handleKeyPress}
                  disabled={isLoading || isVoiceLoading}
                />
                {/* Dynamic button: Microphone when empty, Send when text exists */}
                {!inputValue.trim() ? (
                  <button 
                    className="microphone-btn"
                    onClick={handleMicrophoneClick}
                    disabled={isLoading || isVoiceLoading}
                    title="Start voice recording"
                  >
                    <img src="/microphone.svg" alt="microphone" className="microphone-icon" />
                  </button>
                ) : (
                  <button 
                    className="send-btn"
                    onClick={handleSendMessage}
                    disabled={isLoading || isVoiceLoading}
                    title="Send message"
                  >
                    Send
                  </button>
                )}
                {/* Clear chat button - always visible */}
                <button 
                  className="clear-chat-btn"
                  onClick={handleClearChat}
                  disabled={isLoading || !getCurrentSessionId()}
                  title="Clear chat history"
                >
                  Clear
                </button>
              </>
            ) : (
              <div className="voice-recording-container">
                <div className="voice-visualizer">
                  {mediaRecorder && isMicrophoneOn && mediaRecorder.state === 'recording' ? (
                    <AudioVisualizer />
                  ) : (
                    <div className="voice-processing">
                      <span>Processing...</span>
                    </div>
                  )}
                </div>
                <div className="voice-controls">
                  {isVoiceLoading ? (
                    <div className="voice-loading">
                      <img src="/loading.svg" alt="loading" className="loading-icon" />
                    </div>
                  ) : (
                    <>
                      <button 
                        className="voice-close-btn"
                        onClick={handleCloseVoice}
                        title="Cancel recording"
                      >
                        <img src="/close.svg" alt="close" className="control-icon" />
                      </button>
                      <button 
                        className="voice-confirm-btn"
                        onClick={handleConfirmVoice}
                        title="Confirm recording"
                      >
                        <img src="/check.svg" alt="check" className="control-icon" />
                      </button>
                    </>
                  )}
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Toggle Button */}
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