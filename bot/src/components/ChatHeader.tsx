import React from 'react';

interface ChatHeaderProps {
  apiConnected: boolean | null;
  onClose: () => void;
}

const ChatHeader: React.FC<ChatHeaderProps> = ({ apiConnected, onClose }) => {
  return (
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
        onClick={onClose}
      >
        ×
      </button>
    </div>
  );
};

export default ChatHeader;


