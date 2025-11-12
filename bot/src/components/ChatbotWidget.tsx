// React hooks for component state management and lifecycle
import React, { useEffect, useRef, useState } from 'react';
// Hook for recording audio from the user's microphone
import { useReactMediaRecorder } from 'react-media-recorder';
// Import styles for the chatbot widget
import '../ChatbotWidget.css';
// Import API service functions for communication with the backend
import { 
  sendQuery,           // Send user messages to the API
  checkHealth,         // Check if the API is available
  getCurrentSessionId, // Get the current chat session ID from localStorage
  setCurrentSessionId, // Set the current chat session ID in localStorage
  getOrCreateSessionId, // Get existing or create new session ID
  createDefaultSession, // Create a new default session
  testLocalStorage,    // Test if localStorage is working
  sessionInit,         // Initialize/reset a chat session
  type QueryResponse   // Type definition for API query responses
} from '../services';
// Import voice transcription service to convert audio to text
import { transcribeAudioFromBlobUrl } from '../services/voiceService';
// Import child components for the chatbot UI
import ChatHeader from './ChatHeader';           // Header with title and close button
import MessageList from './MessageList';         // List of chat messages
import ChatInput from './ChatInput';             // Text input and send button
import VoiceRecordingView from './VoiceRecordingView'; // Voice recording interface
// Import TypeScript type definitions
import type { Message } from '../types';

/**
 * ChatbotWidget Component
 * 
 * This is the main chatbot component that manages the entire chat interface.
 * It handles:
 * - Chat window open/close state
 * - Message history and display
 * - Text and voice input
 * - API communication
 * - Session management
 * - Audio recording and transcription
 * 
 * @returns {JSX.Element} The complete chatbot widget interface
 */
const ChatbotWidget: React.FC = () => {
  // State: Whether the chat window is open or closed
  const [isOpen, setIsOpen] = useState(false);
  
  // State: Array of all chat messages (both user and bot)
  // Initialize with a welcome message from the bot
  const [messages, setMessages] = useState<Message[]>([
    {
      id: 1,
      text: "Hello! How can I help you today?",
      isUser: false,
      timestamp: new Date()
    }
  ]);
  
  // State: Current text input value in the chat input field
  const [inputValue, setInputValue] = useState('');
  
  // State: Whether a message is currently being sent/processed
  const [isLoading, setIsLoading] = useState(false);
  
  // State: API connection status (null = checking, true = connected, false = disconnected)
  const [apiConnected, setApiConnected] = useState<boolean | null>(null);

  // Voice recording related state
  // State: Whether the microphone is currently recording
  const [isMicrophoneOn, setIsMicrophoneOn] = useState(false);
  // State: Whether voice transcription is in progress
  const [isVoiceLoading, setIsVoiceLoading] = useState(false);
  // State: MediaRecorder instance for recording audio
  const [mediaRecorder, setMediaRecorder] = useState<MediaRecorder | null>(null);
  
  // Refs: Used to persist values across renders without causing re-renders
  // Ref: MediaStream from getUserMedia (for audio input)
  const streamRef = useRef<MediaStream | null>(null);
  // Ref: Array of audio data chunks collected during recording
  const chunksRef = useRef<Blob[]>([]);
  // Ref: Flag to track if the user cancelled the voice recording
  const wasCancelledRef = useRef(false);
  // State: Flag to trigger audio transcription after recording stops
  const [shouldTranscribe, setShouldTranscribe] = useState(false);
  // Ref: Web Audio API context for audio analysis
  const audioContextRef = useRef<AudioContext | null>(null);
  // Ref: Analyser node for audio visualization (frequency data)
  const analyserRef = useRef<AnalyserNode | null>(null);
  // Ref: Animation frame ID for the audio visualizer animation loop
  const animationFrameRef = useRef<number | null>(null);

  // Use the react-media-recorder hook to handle audio recording
  // This provides functions to start/stop recording and access the recorded audio blob
  const {
    startRecording,    // Function to start audio recording
    stopRecording,     // Function to stop audio recording
    mediaBlobUrl,      // URL of the recorded audio blob (for playback/transcription)
    clearBlobUrl,      // Function to clear the recorded audio blob
  } = useReactMediaRecorder({
    audio: true,       // Enable audio recording
    mediaRecorderOptions: {
      // Use WebM format with Opus codec for better browser compatibility
      mimeType: 'audio/webm;codecs=opus',
    }
  });

  /**
   * useEffect: Component initialization on mount
   * 
   * This effect runs once when the component first mounts. It:
   * 1. Clears any existing session data from localStorage
   * 2. Sets up debug utilities on the window object (for development)
   * 3. Tests localStorage functionality
   * 4. Checks API health/connectivity
   */
  useEffect(() => {
    console.log('🤖 ChatbotWidget mounted!');
    
    // Clear all session data when the widget first loads
    // This ensures a fresh start on each page visit
    console.log('🗑️ Clearing all session data on website visit...');
    localStorage.removeItem('chatbot_current_session_id');
    localStorage.removeItem('chatbot_previous_session_id');
    console.log('✅ All session data cleared');

    // Expose debug utilities on the window object for development/testing
    // Allows developers to inspect and manipulate session data from the browser console
    (window as Window & { debugSession?: unknown }).debugSession = {
      getCurrentSessionId,      // Get current session ID
      setCurrentSessionId,      // Set current session ID
      getOrCreateSessionId,     // Get or create session ID
      createDefaultSession,     // Create a new default session
      testLocalStorage,         // Test localStorage functionality
      clearSessionData: () => { // Clear all session data
        localStorage.removeItem('chatbot_current_session_id');
        localStorage.removeItem('chatbot_previous_session_id');
        console.log('🗑️ Cleared all session data');
      },
      showLocalStorage: () => { // Display all localStorage data
        console.log('📦 All localStorage:', {
          'chatbot_current_session_id': localStorage.getItem('chatbot_current_session_id'),
          'chatbot_previous_session_id': localStorage.getItem('chatbot_previous_session_id') || 'undefined',
          allKeys: Object.keys(localStorage)
        });
      }
    };

    /**
     * Initialize the chatbot
     * 
     * This async function:
     * 1. Tests if localStorage is working
     * 2. Checks API health/connectivity
     * 3. Updates the apiConnected state accordingly
     */
    const initializeChatbot = async () => {
      try {
        // Test localStorage to ensure it's available and working
        const localStorageTest = testLocalStorage();
        console.log('🧪 localStorage test result:', localStorageTest);

        // If localStorage is not working, abort initialization
        if (!localStorageTest.working) {
          console.error('❌ localStorage is not working properly!');
          return;
        }

        // Check if the API backend is available and responding
        const healthResponse = await checkHealth();
        if (healthResponse.success) {
          setApiConnected(true);
          console.log('✅ API connected');
        } else {
          setApiConnected(false);
          console.warn('⚠️ API connection failed');
        }
      } catch (error) {
        // If initialization fails, mark API as disconnected
        console.error('❌ Initialization failed:', error);
        setApiConnected(false);
      }
    };

    // Run the initialization
    initializeChatbot();
  }, []); // Empty dependency array means this runs only once on mount

  /**
   * Toggle the chat window open/closed
   * 
   * When opening the chat:
   * - Checks if a session exists
   * - Creates a new session if none exists
   * - Logs session information for debugging
   */
  const toggleChat = () => {
    console.log('💬 Toggle clicked! Current state:', isOpen);
    
    // When opening the chat (was closed, now opening)
    if (!isOpen) {
      console.log('🔍 Opening chat - checking session...');
      
      // Check if there's an existing session
      const existingCurrentSession = getCurrentSessionId();
      
      // If no session exists, create a new one
      if (!existingCurrentSession) {
        const session = createDefaultSession();
        console.log('🆔 Created new session on chat open:', session);
      } else {
        console.log('🔄 Found existing current session:', existingCurrentSession);
      }
      
      // Verify final session state (for debugging)
      const finalCurrentSession = getCurrentSessionId();
      const finalPreviousSession = localStorage.getItem('chatbot_previous_session_id');
      console.log('🔍 Final session verification:', {
        current: finalCurrentSession,
        previous: finalPreviousSession || 'undefined'
      });
    }
    
    // Toggle the isOpen state (open -> close, or close -> open)
    setIsOpen(!isOpen);
  };

  /**
   * Send a user message to the API and get the bot's response
   * 
   * @param {string} userMessage - The message text from the user
   * @returns {Promise<Message>} A Message object containing the bot's response
   */
  const sendMessageToAPI = async (userMessage: string): Promise<Message> => {
    try {
      // Get the current session ID (or undefined if none exists)
      const currentSessionId = getCurrentSessionId();
      console.log('📤 Sending to API:', { sessionId: currentSessionId, message: userMessage });
      
      // Send the query to the API with the user message and session ID
      const response = await sendQuery(userMessage, currentSessionId || undefined);

      // If the API call was successful and returned data
      if (response.success && response.data) {
        const apiResponse: QueryResponse = response.data;
        console.log('✅ API response:', apiResponse);
        
        // If the API returned a session ID, update it in localStorage
        // (This handles session creation/updates from the backend)
        if (apiResponse.sessionId) {
          setCurrentSessionId(apiResponse.sessionId);
          console.log('💾 Updated session ID in localStorage:', apiResponse.sessionId);
        }
        
        // Return a Message object with the bot's response and metadata
        return {
          id: Date.now(),                              // Unique message ID
          text: apiResponse.answer,                     // Bot's response text
          isUser: false,                               // This is a bot message
          timestamp: new Date(),                       // Current timestamp
          links: apiResponse.links,                    // Source links/citations
          sources: apiResponse.turn.sources,           // Source documents
          detectedLanguage: apiResponse.turn.detectedLanguage, // Detected language
          confidence: apiResponse.turn.confidence,     // Confidence score
        };
      } else {
        // API call failed - return an error message
        console.error('❌ API failed:', response.error);
        return {
          id: Date.now(),
          text: `Sorry, I'm having trouble connecting. ${response.error || 'Please try again.'}`,
          isUser: false,
          timestamp: new Date(),
        };
      }
    } catch (error) {
      // Exception occurred during API call - return a generic error message
      console.error('❌ API error:', error);
      return {
        id: Date.now(),
        text: "Sorry, something went wrong. Please try again.",
        isUser: false,
        timestamp: new Date(),
      };
    }
  };

  /**
   * Handle sending a text message
   * 
   * This function:
   * 1. Validates the input (not empty, not already loading)
   * 2. Creates a user message and adds it to the messages array
   * 3. Clears the input field
   * 4. Sends the message to the API
   * 5. Adds the bot's response to the messages array
   */
  const handleSendMessage = async () => {
    // Don't send if input is empty or a request is already in progress
    if (!inputValue.trim() || isLoading) return;
    
    // Create a Message object for the user's message
    const userMessage: Message = {
      id: Date.now(),        // Unique ID based on timestamp
      text: inputValue,      // The message text
      isUser: true,          // Mark as user message
      timestamp: new Date() // Current timestamp
    };
    
    // Add the user message to the messages array immediately (optimistic update)
    setMessages(prev => [...prev, userMessage]);
    
    // Save the current message text before clearing the input
    const currentMessage = inputValue;
    
    // Clear the input field
    setInputValue('');
    
    // Set loading state to show that a request is in progress
    setIsLoading(true);
    
    try {
      // Send the message to the API and get the bot's response
      const botResponse = await sendMessageToAPI(currentMessage);
      
      // Add the bot's response to the messages array
      setMessages(prev => [...prev, botResponse]);
    } catch (error) {
      // If an error occurs, add an error message to the chat
      console.error('❌ Send message error:', error);
      const errorMessage: Message = {
        id: Date.now(),
        text: "Sorry, something went wrong. Please try again.",
        isUser: false,
        timestamp: new Date()
      };
      setMessages(prev => [...prev, errorMessage]);
    } finally {
      // Always clear the loading state, regardless of success or failure
      setIsLoading(false);
    }
  };

  /**
   * Handle keyboard events in the input field
   * 
   * Allows users to send messages by pressing Enter
   * 
   * @param {React.KeyboardEvent} e - The keyboard event
   */
  const handleKeyPress = (e: React.KeyboardEvent) => {
    // If Enter key is pressed, send the message
    if (e.key === 'Enter') {
      handleSendMessage();
    }
  };

  /**
   * Clear the chat history and reset the session
   * 
   * This function:
   * 1. Validates that a session exists and no request is in progress
   * 2. Calls the API to archive the current session
   * 3. Resets the messages to just the welcome message
   */
  const handleClearChat = async () => {
    // Get the current session ID
    const currentSessionId = getCurrentSessionId();
    
    // Don't clear if no session exists or a request is already in progress
    if (!currentSessionId || isLoading) return;
    
    try {
      console.log('🗑️ Clearing chat session:', currentSessionId);
      
      // Set loading state
      setIsLoading(true);
      
      // Call the API to initialize/reset the session (archives current conversation)
      const response = await sessionInit();
      
      if (response.success && response.data) {
        // Reset messages to just the welcome message
        setMessages([{ id: 1, text: "Hello! How can I help you today?", isUser: false, timestamp: new Date() }]);
        console.log(`✅ Session initialized successfully. ${response.data.archivedTurns} turns archived.`);
      } else {
        // Even if API call fails, reset the UI to show welcome message
        console.error('❌ Session init failed:', response.error);
        setMessages([{ id: 1, text: "Hello! How can I help you today?", isUser: false, timestamp: new Date() }]);
      }
    } catch (error) {
      // On error, still reset the UI
      console.error('❌ Session init error:', error);
      setMessages([{ id: 1, text: "Hello! How can I help you today?", isUser: false, timestamp: new Date() }]);
    } finally {
      // Always clear loading state
      setIsLoading(false);
    }
  };

  /**
   * Handle microphone button click - start or stop voice recording
   * 
   * When starting:
   * - Requests microphone permission
   * - Sets up audio recording and visualization
   * - Starts recording
   * 
   * When stopping:
   * - Stops recording
   * - Cleans up audio resources
   */
  const handleMicrophoneClick = async () => {
    // If microphone is off, start recording
    if (!isMicrophoneOn) {
      try {
        // Start recording using the react-media-recorder hook
        startRecording();
        
        // Request access to the user's microphone
        const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
        streamRef.current = stream;
        
        // Create AudioContext for audio analysis (for visualization)
        // Support both standard and webkit-prefixed versions for browser compatibility
        const AudioContextClass = (window.AudioContext || (window as Window & { webkitAudioContext?: typeof AudioContext }).webkitAudioContext)!;
        audioContextRef.current = new AudioContextClass();
        
        // Create a source node from the audio stream
        const source = audioContextRef.current.createMediaStreamSource(stream);
        
        // Create an analyser node to get frequency data for visualization
        analyserRef.current = audioContextRef.current.createAnalyser();
        analyserRef.current.fftSize = 256; // Set FFT size for frequency analysis
        source.connect(analyserRef.current);
        
        // Create a MediaRecorder to capture the audio data
        const recorder = new MediaRecorder(stream);
        
        // Reset the cancellation flag
        wasCancelledRef.current = false;
        
        // Handle data chunks as they become available
        recorder.ondataavailable = (event) => {
          if (event.data.size > 0) {
            chunksRef.current.push(event.data);
          }
        };
        
        // Clear chunks when recording stops
        recorder.onstop = () => {
          chunksRef.current = [];
        };
        
        // Store the recorder and start recording
        setMediaRecorder(recorder);
        recorder.start();
        
        // Update state to indicate microphone is now on
        setIsMicrophoneOn(true);
      } catch {
        // If microphone access is denied, show an alert
        alert('Microphone access denied. Please allow microphone access to use voice input.');
      }
    } else {
      // If microphone is on, stop recording
      
      // Stop the react-media-recorder hook
      stopRecording();
      
      // Stop the MediaRecorder if it's recording
      if (mediaRecorder && mediaRecorder.state === 'recording') {
        mediaRecorder.stop();
      }
      
      // Stop all tracks in the media stream (releases microphone)
      if (streamRef.current) {
        streamRef.current.getTracks().forEach(track => track.stop());
        streamRef.current = null;
      }
      
      // Close the AudioContext to free resources
      if (audioContextRef.current) {
        audioContextRef.current.close();
        audioContextRef.current = null;
      }
      
      // Cancel any ongoing animation frame (for visualizer)
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current);
        animationFrameRef.current = null;
      }
      
      // Clear the recorder and update state
      setMediaRecorder(null);
      setIsMicrophoneOn(false);
    }
  };

  /**
   * Handle closing/cancelling voice recording
   * 
   * This function:
   * - Marks the recording as cancelled
   * - Stops all recording and audio processing
   * - Cleans up all resources
   * - Prevents transcription from running
   */
  const handleCloseVoice = () => {
    // Mark as cancelled so transcription won't run
    wasCancelledRef.current = true;
    
    // Stop the react-media-recorder hook
    stopRecording();
    
    // Stop the MediaRecorder if it's recording
    if (mediaRecorder && mediaRecorder.state === 'recording') {
      // Clear chunks when recording stops
      mediaRecorder.onstop = () => {
        chunksRef.current = [];
      };
      mediaRecorder.stop();
    }
    
    // Stop all tracks in the media stream (releases microphone)
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(track => track.stop());
      streamRef.current = null;
    }
    
    // Close the AudioContext to free resources
    if (audioContextRef.current) {
      audioContextRef.current.close();
      audioContextRef.current = null;
    }
    
    // Cancel any ongoing animation frame (for visualizer)
    if (animationFrameRef.current) {
      cancelAnimationFrame(animationFrameRef.current);
      animationFrameRef.current = null;
    }
    
    // Clear the recorded audio blob URL
    clearBlobUrl();
    
    // Reset all state
    setMediaRecorder(null);
    setIsMicrophoneOn(false);
    setShouldTranscribe(false); // Prevent transcription
  };

  /**
   * Handle confirming voice recording (user wants to send the recording)
   * 
   * This function:
   * - Stops recording
   * - Cleans up audio resources
   * - Triggers transcription of the recorded audio
   */
  const handleConfirmVoice = async () => {
    // Mark as not cancelled so transcription will proceed
    wasCancelledRef.current = false;
    
    // Stop the react-media-recorder hook
    stopRecording();
    
    // Stop the MediaRecorder if it's recording
    if (mediaRecorder && mediaRecorder.state === 'recording') {
      mediaRecorder.stop();
    }
    
    // Stop all tracks in the media stream (releases microphone)
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(track => track.stop());
      streamRef.current = null;
    }
    
    // Close the AudioContext to free resources
    if (audioContextRef.current) {
      audioContextRef.current.close();
      audioContextRef.current = null;
    }
    
    // Cancel any ongoing animation frame (for visualizer)
    if (animationFrameRef.current) {
      cancelAnimationFrame(animationFrameRef.current);
      animationFrameRef.current = null;
    }
    
    // Reset recorder state
    setMediaRecorder(null);
    
    // Clear input field (will be populated with transcription result)
    setInputValue('');
    
    // Set loading state for voice transcription
    setIsVoiceLoading(true);
    
    // Trigger transcription (this will be handled by the useEffect below)
    setShouldTranscribe(true);
  };

  /**
   * useEffect: Cleanup on component unmount
   * 
   * This effect ensures that all audio resources are properly cleaned up
   * when the component is unmounted (e.g., user navigates away).
   * Prevents memory leaks and ensures microphone is released.
   */
  useEffect(() => {
    // Return cleanup function that runs when component unmounts
    return () => {
      // Stop all audio tracks (release microphone)
      if (streamRef.current) {
        streamRef.current.getTracks().forEach(track => track.stop());
        streamRef.current = null;
      }
      
      // Close AudioContext
      if (audioContextRef.current) {
        audioContextRef.current.close();
        audioContextRef.current = null;
      }
      
      // Cancel any ongoing animation frames
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current);
        animationFrameRef.current = null;
      }
    };
  }, []); // Empty dependency array means this runs only on mount/unmount

  /**
   * useEffect: Handle voice transcription
   * 
   * This effect runs when:
   * - shouldTranscribe becomes true (user confirmed recording)
   * - mediaBlobUrl is available (recording is complete)
   * 
   * It transcribes the audio and populates the input field with the result.
   */
  useEffect(() => {
    // Don't transcribe if flag is not set
    if (!shouldTranscribe) return;
    
    // Don't transcribe if user cancelled the recording
    if (wasCancelledRef.current) {
      setShouldTranscribe(false);
      return;
    }
    
    // Don't transcribe if no audio blob URL is available
    if (!mediaBlobUrl) return;

    /**
     * Run the transcription process
     * 
     * This async function:
     * 1. Sends the audio blob to the transcription service
     * 2. Extracts the transcript text
     * 3. Populates the input field with the transcript
     * 4. Cleans up resources
     */
    const runTranscription = async () => {
      try {
        // Send audio blob to transcription service
        const result = await transcribeAudioFromBlobUrl(mediaBlobUrl) as { transcript?: string; answer?: string };
        
        // If transcript is available, use it
        if (result && result.transcript) {
          console.log('📝 Voice transcription result:', result);
          setInputValue(result.transcript);
        } else {
          // Fallback to 'answer' field if 'transcript' is not available
          if (result && result.answer) {
            console.log('📝 Voice transcription result (using answer):', result);
            setInputValue(result.answer);
          }
        }
      } catch {
        // If transcription fails, show an error alert
        console.error('❌ Voice transcription error');
        alert("Sorry, I couldn't process your voice message. Please try again.");
      } finally {
        // Always clean up resources, regardless of success or failure
        
        // Stop any remaining audio tracks
        if (streamRef.current) {
          streamRef.current.getTracks().forEach(track => track.stop());
          streamRef.current = null;
        }
        
        // Reset all state
        setMediaRecorder(null);
        setIsMicrophoneOn(false);
        clearBlobUrl();           // Clear the audio blob
        setShouldTranscribe(false); // Reset transcription flag
        setIsVoiceLoading(false);   // Clear loading state
      }
    };
    
    // Run the transcription
    runTranscription();
  }, [shouldTranscribe, mediaBlobUrl, clearBlobUrl]); // Re-run when these values change

  // Log render state for debugging
  console.log('🎯 ChatbotWidget rendering, isOpen:', isOpen);

  // Render the chatbot widget
  return (
    <div className="chatbot-widget">
      {/* Only show the chat interface when isOpen is true */}
      {isOpen && (
        <div className="chatbot-interface">
          {/* Header component with title, API status, and close button */}
          <ChatHeader apiConnected={apiConnected} onClose={toggleChat} />
          
          {/* Message list component that displays all chat messages */}
          <MessageList messages={messages} isLoading={isLoading} />
          
          {/* Conditionally render either ChatInput or VoiceRecordingView */}
          {!isMicrophoneOn ? (
            // Show text input interface when not recording
            <ChatInput
              inputValue={inputValue}                    // Current input text
              onInputChange={setInputValue}              // Handler to update input text
              onKeyPress={handleKeyPress}                // Handler for keyboard events
              isLoading={isLoading}                     // Whether a message is being sent
              isVoiceLoading={isVoiceLoading}            // Whether voice is being transcribed
              onSend={handleSendMessage}                 // Handler to send message
              onMicClick={handleMicrophoneClick}         // Handler to start/stop recording
              onClear={handleClearChat}                  // Handler to clear chat history
              hasSession={!!getCurrentSessionId()}       // Whether a session exists
            />
          ) : (
            // Show voice recording interface when microphone is on
            <VoiceRecordingView
              mediaRecorder={mediaRecorder}              // MediaRecorder instance
              isMicrophoneOn={isMicrophoneOn}           // Recording state
              isVoiceLoading={isVoiceLoading}            // Transcription loading state
              onClose={handleCloseVoice}                 // Handler to cancel recording
              onConfirm={handleConfirmVoice}             // Handler to confirm and transcribe
              analyserRef={analyserRef}                  // Ref to analyser node for visualization
              animationFrameRef={animationFrameRef}       // Ref to animation frame ID
            />
          )}
        </div>
      )}

      {/* Toggle button to open/close the chat window */}
      {/* Fixed position in bottom-right corner */}
      <button 
        className="chatbot-toggle-btn"
        onClick={toggleChat}
        style={{
          position: 'fixed',
          bottom: '20px',
          right: '20px',
          zIndex: 10000,              // High z-index to appear above other content
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          backgroundColor: '#007bff',  // Primary blue color
          color: 'white',
          border: '2px solid #0056b3' // Darker blue border
        }}
      >
        {/* Show '×' when open, '💬' when closed */}
        {isOpen ? '×' : '💬'}
      </button>
    </div>
  );
};

// Export the ChatbotWidget component as the default export
export default ChatbotWidget;


