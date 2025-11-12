// Import React for component definition
import React from 'react';

/**
 * Props interface for ChatHeader component
 * 
 * @interface ChatHeaderProps
 * @property {boolean | null} apiConnected - API connection status:
 *   - null: Connection status is being checked
 *   - true: API is connected and available
 *   - false: API is disconnected or unavailable
 * @property {() => void} onClose - Callback function to close the chat window
 */
interface ChatHeaderProps {
  apiConnected: boolean | null;
  onClose: () => void;
}

/**
 * ChatHeader Component
 * 
 * Displays the header of the chat window with:
 * - Chat title ("Chat Support")
 * - API connection status indicator
 * - Close button to close the chat window
 * 
 * @param {ChatHeaderProps} props - Component props
 * @returns {JSX.Element} The chat header UI
 */
const ChatHeader: React.FC<ChatHeaderProps> = ({ apiConnected, onClose }) => {
  return (
    <div className="chatbot-header">
      {/* Container for title and status */}
      <div className="chatbot-title">
        {/* Chat window title */}
        <h3>Chat Support</h3>
        
        {/* API connection status indicator */}
        <div className="api-status">
          {/* Show "Checking..." when connection status is unknown */}
          {apiConnected === null && <span className="status-checking">🔄 Checking...</span>}
          
          {/* Show "Connected" when API is available */}
          {apiConnected === true && <span className="status-connected">🟢 Connected</span>}
          
          {/* Show "Offline" when API is unavailable */}
          {apiConnected === false && <span className="status-disconnected">🔴 Offline</span>}
        </div>
      </div>
      
      {/* Close button to close the chat window */}
      <button 
        className="chatbot-close-btn"
        onClick={onClose}
        aria-label="Close chat"
      >
        ×
      </button>
    </div>
  );
};

// Export the ChatHeader component as the default export
export default ChatHeader;


