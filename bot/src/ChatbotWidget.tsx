import React, { useState } from 'react';
import './ChatbotWidget.css';

interface ChatbotWidgetProps {
  // Props for customization can be added later
}

const ChatbotWidget: React.FC<ChatbotWidgetProps> = () => {
  const [isOpen, setIsOpen] = useState(false);

  const toggleChat = () => {
    setIsOpen(!isOpen);
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
            <div className="chatbot-message bot-message">
              <p>Hello! How can I help you today?</p>
            </div>
          </div>
          <div className="chatbot-input">
            <input 
              type="text" 
              placeholder="Type your message..."
              className="chatbot-input-field"
            />
            <button className="chatbot-send-btn">Send</button>
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
