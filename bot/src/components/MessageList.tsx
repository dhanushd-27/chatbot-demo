// Import React for component definition
import React from 'react';
// Import ReactMarkdown to render markdown-formatted bot messages
import ReactMarkdown from 'react-markdown';
// Import the Message type definition
import type { Message } from '../types';

/**
 * Props interface for MessageList component
 * 
 * @interface MessageListProps
 * @property {Message[]} messages - Array of all chat messages to display
 * @property {boolean} isLoading - Whether a message is currently being processed/loaded
 */
interface MessageListProps {
  messages: Message[];
  isLoading: boolean;
}

/**
 * MessageList Component
 * 
 * Displays a list of all chat messages (both user and bot messages).
 * Features:
 * - Renders user messages as plain text
 * - Renders bot messages with markdown support (for formatting)
 * - Shows source links/citations for bot messages
 * - Displays detected language and confidence for bot messages
 * - Shows timestamp for each message
 * - Shows a "Thinking..." indicator when loading
 * 
 * @param {MessageListProps} props - Component props
 * @returns {JSX.Element} The message list UI
 */
const MessageList: React.FC<MessageListProps> = ({ messages, isLoading }) => {
  return (
    <div className="chatbot-messages">
      {/* Map through all messages and render each one */}
      {messages.map((message) => (
        <div 
          key={message.id} 
          // Apply different CSS classes for user vs bot messages
          className={`chatbot-message ${message.isUser ? 'user-message' : 'bot-message'}`}
        >
          {/* Render message text */}
          {message.isUser ? (
            // User messages: render as plain text (no markdown)
            <p>{message.text}</p>
          ) : (
            // Bot messages: render with markdown support (allows formatting, links, etc.)
            <ReactMarkdown>{message.text}</ReactMarkdown>
          )}

          {/* Display source links if available (bot messages only) */}
          {message.links && message.links.length > 0 && (
            <div className="message-links">
              <strong>Sources:</strong>
              {/* Map through each source link and render as clickable link */}
              {message.links.map((link, index) => (
                <a 
                  key={index}
                  href={link.url} 
                  target="_blank"              // Open in new tab
                  rel="noopener noreferrer"     // Security: prevent window.opener access
                  className="message-link"
                >
                  {/* Display link as [number] title */}
                  [{link.number}] {link.title}
                </a>
              ))}
            </div>
          )}

          {/* Display language detection metadata if available (bot messages only) */}
          {message.detectedLanguage && (
            <div className="message-meta">
              <small>
                Language: {message.detectedLanguage} 
                {/* Show confidence percentage if available */}
                {message.confidence && ` (${Math.round(message.confidence * 100)}% confidence)`}
              </small>
            </div>
          )}

          {/* Display message timestamp */}
          <small className="message-time">
            {message.timestamp.toLocaleTimeString()}
          </small>
        </div>
      ))}

      {/* Show loading indicator when a message is being processed */}
      {isLoading && (
        <div className="chatbot-message bot-message">
          <p>Thinking...</p>
        </div>
      )}
    </div>
  );
};

// Export the MessageList component as the default export
export default MessageList;


