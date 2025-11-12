// Import React hooks for component functionality
import React, { useEffect, useRef } from 'react';

/**
 * Props interface for ChatInput component
 * 
 * @interface ChatInputProps
 * @property {string} inputValue - Current value of the text input field
 * @property {(value: string) => void} onInputChange - Callback to update input value
 * @property {(e: React.KeyboardEvent) => void} onKeyPress - Callback for keyboard events
 * @property {boolean} isLoading - Whether a message is currently being sent
 * @property {boolean} isVoiceLoading - Whether voice transcription is in progress
 * @property {() => void} onSend - Callback to send the message
 * @property {() => void} onMicClick - Callback to start/stop voice recording
 * @property {() => void} onClear - Callback to clear chat history
 * @property {boolean} hasSession - Whether a chat session exists
 */
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

/**
 * ChatInput Component
 * 
 * Provides the input interface for the chat, including:
 * - Auto-resizing textarea for message input
 * - Microphone button (when input is empty) to start voice recording
 * - Send button (when input has text) to send the message
 * - Clear button to reset chat history
 * 
 * The textarea automatically adjusts its height based on content.
 * 
 * @param {ChatInputProps} props - Component props
 * @returns {JSX.Element} The chat input UI
 */
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
  // Ref to access the textarea DOM element for height adjustment
  const textareaRef = useRef<HTMLTextAreaElement | null>(null);

  /**
   * useEffect: Auto-resize textarea based on content
   * 
   * This effect adjusts the textarea height to fit its content,
   * allowing the input to grow as the user types multiple lines.
   * 
   * Runs whenever inputValue changes.
   */
  useEffect(() => {
    const el = textareaRef.current;
    // Exit if textarea ref is not available
    if (!el) return;
    
    // Reset height to 'auto' to get the correct scrollHeight
    el.style.height = 'auto';
    // Set height to match the content height (scrollHeight)
    el.style.height = `${el.scrollHeight}px`;
  }, [inputValue]); // Re-run when input value changes

  return (
    <div className="chatbot-input">
      <>
        {/* Textarea for message input */}
        <textarea
          ref={textareaRef}                    // Ref for height adjustment
          placeholder="Type your message..."
          value={inputValue}                    // Controlled input value
          onChange={(e) => onInputChange(e.target.value)} // Update value on change
          onKeyPress={onKeyPress}              // Handle keyboard events (Enter to send)
          disabled={isLoading || isVoiceLoading} // Disable when loading
          rows={1}                             // Start with 1 row (grows automatically)
          className="chat-textarea"
        />
        
        {/* Conditionally render microphone or send button based on input state */}
        {!inputValue.trim() ? (
          // Show microphone button when input is empty
          <button 
            className="microphone-btn"
            onClick={onMicClick}               // Start voice recording
            disabled={isLoading || isVoiceLoading} // Disable when loading
            title="Start voice recording"
          >
            <img src="/microphone.svg" alt="microphone" className="microphone-icon" />
          </button>
        ) : (
          // Show send button when input has text
          <button 
            className="send-btn"
            onClick={onSend}                   // Send the message
            disabled={isLoading || isVoiceLoading} // Disable when loading
            title="Send message"
          >
            <img src="/send.svg" alt="send" className="send-icon" />
          </button>
        )}
        
        {/* Clear chat button - resets chat history */}
        <button 
          className="clear-chat-btn"
          onClick={() => { 
            onClear();           // Clear chat history via API
            onInputChange('');   // Clear input field
          }}
          disabled={isLoading || !hasSession} // Disable when loading or no session
          title="Clear chat history"
        >
          Clear
        </button>
      </>
    </div>
  );
};

// Export the ChatInput component as the default export
export default ChatInput;
 

