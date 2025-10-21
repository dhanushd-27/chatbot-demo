import { useState } from 'react'
import './ChatbotWidget.css'

const ChatbotWidget = () => {
  const [isOpen, setIsOpen] = useState(false)

  const toggleChatbot = () => {
    setIsOpen(!isOpen)
  }

  return (
    <>
      {/* Chatbot Icon */}
      <button 
        className={`chatbot-toggle ${isOpen ? 'open' : ''}`}
        onClick={toggleChatbot}
        aria-label="Toggle chatbot"
      >
        <svg className="chatbot-icon" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
          <path d="M20 2H4c-1.1 0-2 .9-2 2v12c0 1.1.9 2 2 2h4l4 4 4-4h4c1.1 0 2-.9 2-2V4c0-1.1-.9-2-2-2zm-2 12H6v-2h12v2zm0-3H6V9h12v2zm0-3H6V6h12v2z"/>
        </svg>
        {isOpen && (
          <svg className="chatbot-close" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
            <path d="M19 6.41L17.59 5 12 10.59 6.41 5 5 6.41 10.59 12 5 17.59 6.41 19 12 13.41 17.59 19 19 17.59 13.41 12z"/>
          </svg>
        )}
      </button>

      {/* Chatbot Popup */}
      {isOpen && (
        <div className="chatbot-popup">
          <div className="chatbot-header">
            <div className="chatbot-avatar">
              <svg viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-2 15l-5-5 1.41-1.41L10 14.17l7.59-7.59L19 8l-9 9z"/>
              </svg>
            </div>
            <div className="chatbot-info">
              <h3>Support Bot</h3>
              <span className="chatbot-status">Online</span>
            </div>
          </div>
          
          <div className="chatbot-messages">
            <div className="message bot-message">
              <div className="message-content">
                <p>Hello! 👋 How can I help you today?</p>
                <span className="message-time">Just now</span>
              </div>
            </div>
          </div>
          
          <div className="chatbot-input">
            <input 
              type="text" 
              placeholder="Type your message..." 
              className="chatbot-text-input"
            />
            <button className="chatbot-send-btn">
              <svg viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                <path d="M2.01 21L23 12 2.01 3 2 10l15 2-15 2z"/>
              </svg>
            </button>
          </div>
        </div>
      )}
    </>
  )
}

export default ChatbotWidget
