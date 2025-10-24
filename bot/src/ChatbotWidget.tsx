import React, { useState, useEffect } from 'react';
import './ChatbotWidget.css';
import { 
  sendQuery, 
  checkHealth, 
  getOrCreateSessionId, 
  setCurrentSessionId,
  type QueryResponse 
} from './services';

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
  const [sessionId, setSessionId] = useState<string>('');
  const [apiConnected, setApiConnected] = useState<boolean | null>(null);

  // Initialize session and check API health
  useEffect(() => {
    console.log('🤖 ChatbotWidget mounted!');
    const initializeChatbot = async () => {
      try {
        // Get or create session ID
        const currentSessionId = getOrCreateSessionId();
        setSessionId(currentSessionId);
        console.log('🆔 Session ID:', currentSessionId);

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
    setIsOpen(!isOpen);
  };

  const sendMessageToAPI = async (userMessage: string): Promise<Message> => {
    try {
      console.log('📤 Sending to API:', { sessionId, message: userMessage });
      
      const response = await sendQuery(userMessage, sessionId);
      
      if (response.success && response.data) {
        const apiResponse: QueryResponse = response.data;
        console.log('✅ API response:', apiResponse);
        
        // Update session ID if changed
        if (apiResponse.sessionId !== sessionId) {
          setSessionId(apiResponse.sessionId);
          setCurrentSessionId(apiResponse.sessionId);
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
                <p>{message.text}</p>
                
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
            <input 
              type="text" 
              placeholder="Type your message..."
              value={inputValue}
              onChange={(e) => setInputValue(e.target.value)}
              onKeyPress={handleKeyPress}
              disabled={isLoading}
            />
            <button 
              onClick={handleSendMessage}
              disabled={!inputValue.trim() || isLoading}
            >
              Send
            </button>
          </div>
        </div>
      )}

      {/* Toggle Button */}
      <button 
        className="chatbot-toggle-btn"
        onClick={toggleChat}
      >
        {isOpen ? '×' : '💬'}
      </button>
    </div>
  );
};

export default ChatbotWidget;