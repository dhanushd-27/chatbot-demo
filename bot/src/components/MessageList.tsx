import React from 'react';
import ReactMarkdown from 'react-markdown';
import type { Message } from '../types';

interface MessageListProps {
  messages: Message[];
  isLoading: boolean;
}

const MessageList: React.FC<MessageListProps> = ({ messages, isLoading }) => {
  return (
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
  );
};

export default MessageList;


