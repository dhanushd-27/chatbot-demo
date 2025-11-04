import React, { useEffect, useRef } from 'react';

interface ChatInputProps {
  inputValue: string;
  onInputChange: (value: string) => void;
  onKeyPress: (e: React.KeyboardEvent) => void;
  isLoading: boolean;
  isVoiceLoading: boolean;
  onSend: () => void;
  onMicClick: () => void;
  onClear: () => void;
  hasSession: boolean;
}

const ChatInput: React.FC<ChatInputProps> = ({
  inputValue,
  onInputChange,
  onKeyPress,
  isLoading,
  isVoiceLoading,
  onSend,
  onMicClick,
  onClear,
  hasSession,
}) => {
  const textareaRef = useRef<HTMLTextAreaElement | null>(null);

  useEffect(() => {
    const el = textareaRef.current;
    if (!el) return;
    el.style.height = 'auto';
    el.style.height = `${el.scrollHeight}px`;
  }, [inputValue]);
  return (
    <div className="chatbot-input">
      <>
        <textarea
          ref={textareaRef}
          placeholder="Type your message..."
          value={inputValue}
          onChange={(e) => onInputChange(e.target.value)}
          onKeyPress={onKeyPress}
          disabled={isLoading || isVoiceLoading}
          rows={1}
          className="chat-textarea"
        />
        {!inputValue.trim() ? (
          <button 
            className="microphone-btn"
            onClick={onMicClick}
            disabled={isLoading || isVoiceLoading}
            title="Start voice recording"
          >
            <img src="/microphone.svg" alt="microphone" className="microphone-icon" />
          </button>
        ) : (
          <button 
            className="send-btn"
            onClick={onSend}
            disabled={isLoading || isVoiceLoading}
            title="Send message"
          >
            Send
          </button>
        )}
        <button 
          className="clear-chat-btn"
          onClick={() => { onClear(); onInputChange(''); }}
          disabled={isLoading || !hasSession}
          title="Clear chat history"
        >
          Clear
        </button>
      </>
    </div>
  );
};

export default ChatInput;
 

