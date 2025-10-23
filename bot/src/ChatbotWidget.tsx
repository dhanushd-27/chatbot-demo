import React, { useState } from 'react';
import './ChatbotWidget.css';

interface ChatbotWidgetProps {
  // Props for customization can be added later
}

interface Message {
  id: number;
  text: string;
  isUser: boolean;
  timestamp: Date;
}

const ChatbotWidget: React.FC<ChatbotWidgetProps> = () => {
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
  const [isRecording, setIsRecording] = useState(false);
  const [audioData, setAudioData] = useState<number[]>([]);
  const [mediaRecorder, setMediaRecorder] = useState<MediaRecorder | null>(null);
  const [audioContext, setAudioContext] = useState<AudioContext | null>(null);
  const [analyser, setAnalyser] = useState<AnalyserNode | null>(null);

  const toggleChat = () => {
    const newState = !isOpen;
    console.log('💬 Chatbot button clicked! State:', newState ? 'OPENING' : 'CLOSING');
    setIsOpen(newState);
    
    // Send message to parent window (client app)
    console.log('🔍 Checking window.parent:', window.parent !== window);
    if (window.parent !== window) {
      console.log('📤 Sending message to parent window:', { type: 'CHATBOT_TOGGLE', isOpen: newState });
      try {
        window.parent.postMessage({
          type: 'CHATBOT_TOGGLE',
          isOpen: newState
        }, '*');
        console.log('✅ Message sent successfully');
      } catch (error) {
        console.error('❌ Error sending message:', error);
      }
    } else {
      console.log('⚠️ Not in iframe, skipping parent message');
    }
  };

  const getMockResponse = (userMessage: string): string => {
    const lowerMessage = userMessage.toLowerCase().trim();
    
    if (lowerMessage === 'hi' || lowerMessage === 'hello') {
      return "Hi there! 👋 Nice to meet you! How can I assist you today?";
    } else if (lowerMessage.includes('help')) {
      return "I'm here to help! 😊 What would you like to know?";
    } else if (lowerMessage.includes('thank')) {
      return "You're very welcome! 😊 Is there anything else I can help you with?";
    } else if (lowerMessage.includes('bye') || lowerMessage.includes('goodbye')) {
      return "Goodbye! 👋 Have a great day! Feel free to come back anytime!";
    } else {
      return "Thanks for your message! 😊 I'm a simple chatbot, but I'm here to help. How can I assist you today?";
    }
  };

  const handleSendMessage = () => {
    if (!inputValue.trim()) return;

    const userMessage: Message = {
      id: Date.now(),
      text: inputValue,
      isUser: true,
      timestamp: new Date()
    };

    setMessages(prev => [...prev, userMessage]);
    setInputValue('');

    // Simulate bot response after a short delay
    setTimeout(() => {
      const botResponse: Message = {
        id: Date.now() + 1,
        text: getMockResponse(inputValue),
        isUser: false,
        timestamp: new Date()
      };
      setMessages(prev => [...prev, botResponse]);
    }, 1000);
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      handleSendMessage();
    }
  };

  const startRecording = async () => {
    try {
      // Request microphone access through parent window
      if (window.parent !== window) {
        console.log('📤 Requesting microphone access from parent window');
        window.parent.postMessage({
          type: 'REQUEST_MICROPHONE',
          action: 'start'
        }, '*');
        
        // Listen for response from parent
        const handleMicResponse = (event: MessageEvent) => {
          if (event.data.type === 'MICROPHONE_GRANTED') {
            console.log('✅ Microphone access granted by parent');
            setupRecording();
          } else if (event.data.type === 'MICROPHONE_DENIED') {
            console.log('❌ Microphone access denied by parent');
            alert('Microphone access is required for voice input. Please allow microphone access in your browser settings.');
          }
        };
        
        window.addEventListener('message', handleMicResponse);
        
        // Clean up listener after 5 seconds
        setTimeout(() => {
          window.removeEventListener('message', handleMicResponse);
        }, 5000);
        
      } else {
        // Direct access if not in iframe
        await setupRecording();
      }
    } catch (error) {
      console.error('❌ Error accessing microphone:', error);
    }
  };

  const setupRecording = async () => {
    try {
      let stream: MediaStream;
      
      // Try to get stream from parent window first
      if (window.parent !== window && (window.parent as any).parentMicrophoneStream) {
        console.log('🎤 Using microphone stream from parent window');
        stream = (window.parent as any).parentMicrophoneStream;
      } else {
        console.log('🎤 Requesting microphone access directly');
        stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      }
      
      const recorder = new MediaRecorder(stream);
      const audioCtx = new AudioContext();
      const analyserNode = audioCtx.createAnalyser();
      const source = audioCtx.createMediaStreamSource(stream);
      
      analyserNode.fftSize = 256;
      source.connect(analyserNode);
      
      setMediaRecorder(recorder);
      setAudioContext(audioCtx);
      setAnalyser(analyserNode);
      setIsRecording(true);
      
      // Start visualization
      visualizeAudio();
      
      recorder.start();
      console.log('🎤 Recording started');
    } catch (error) {
      console.error('❌ Error setting up recording:', error);
      alert('Failed to access microphone. Please check your browser permissions.');
    }
  };

  const stopRecording = () => {
    if (mediaRecorder && mediaRecorder.state === 'recording') {
      mediaRecorder.stop();
      setIsRecording(false);
      
      if (audioContext) {
        audioContext.close();
      }
      
      // Simulate speech-to-text (in real app, you'd use a speech API)
      setTimeout(() => {
        const mockTranscription = "Hello, this is a test message from voice input!";
        setInputValue(mockTranscription);
        console.log('🎤 Recording stopped, transcription:', mockTranscription);
      }, 1000);
    }
  };

  const visualizeAudio = () => {
    if (!analyser) return;
    
    const dataArray = new Uint8Array(analyser.frequencyBinCount);
    
    const draw = () => {
      if (!isRecording) return;
      
      analyser.getByteFrequencyData(dataArray);
      setAudioData(Array.from(dataArray));
      
      requestAnimationFrame(draw);
    };
    
    draw();
  };

  return (
    <div className="chatbot-widget">
      {/* Chat Interface */}
      {isOpen && (
        <div className="chatbot-interface">
          <div className="chatbot-header">
            <h3>Chat Support</h3>
            <button 
              className="chatbot-close-btn"
              onClick={toggleChat}
              aria-label="Close chat"
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
                <p>{message.text}</p>
                <small className="message-time">
                  {message.timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                </small>
              </div>
            ))}
          </div>
          <div className="chatbot-input">
            {/* Audio Visualizer */}
            {isRecording && (
              <div className="audio-visualizer">
                <div className="visualizer-bars">
                  {audioData.slice(0, 20).map((value, index) => (
                    <div
                      key={index}
                      className="visualizer-bar"
                      style={{
                        height: `${(value / 255) * 100}%`,
                        backgroundColor: value > 100 ? '#ff4444' : '#007bff'
                      }}
                    />
                  ))}
                </div>
                <div className="recording-indicator">
                  <div className="recording-dot"></div>
                  <span>Recording...</span>
                </div>
              </div>
            )}
            
            <input 
              type="text" 
              placeholder={isRecording ? "Recording..." : "Type your message..."}
              className="chatbot-input-field"
              value={inputValue}
              onChange={(e) => setInputValue(e.target.value)}
              onKeyPress={handleKeyPress}
              disabled={isRecording}
            />
            <button 
              className={`chatbot-send-btn ${isRecording ? 'recording' : ''}`}
              onClick={isRecording ? stopRecording : (inputValue.trim() ? handleSendMessage : startRecording)}
              title={
                isRecording 
                  ? "Stop recording" 
                  : inputValue.trim() 
                    ? "Send message" 
                    : "Start voice input"
              }
            >
              {isRecording ? (
                <svg className="stop-icon" viewBox="0 0 24 24">
                  <path d="M6 6h12v12H6z"/>
                </svg>
              ) : inputValue.trim() ? (
                <svg className="send-icon" viewBox="0 0 24 24">
                  <path d="M2.01 21L23 12 2.01 3 2 10l15 2-15 2z"/>
                </svg>
              ) : (
                <svg className="mic-icon" viewBox="0 0 24 24">
                  <path d="M12 14c1.66 0 3-1.34 3-3V5c0-1.66-1.34-3-3-3S9 3.34 9 5v6c0 1.66 1.34 3 3 3z"/>
                  <path d="M17 11c0 2.76-2.24 5-5 5s-5-2.24-5-5H5c0 3.53 2.61 6.43 6 6.92V21h2v-3.08c3.39-.49 6-3.39 6-6.92h-2z"/>
                </svg>
              )}
            </button>
          </div>
        </div>
      )}

      {/* Floating Chat Button */}
      <button 
        className={`chatbot-toggle-btn ${isOpen ? 'open' : ''}`}
        onClick={toggleChat}
        aria-label={isOpen ? 'Close chat' : 'Open chat'}
      >
        {isOpen ? '×' : '💬'}
      </button>
    </div>
  );
};

export default ChatbotWidget;
