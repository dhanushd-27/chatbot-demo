// Import React for component definition
import React from 'react';
// Import AudioVisualizer component to show audio waveform during recording
import AudioVisualizer from './AudioVisualizer';

/**
 * Props interface for VoiceRecordingView component
 * 
 * @interface VoiceRecordingViewProps
 * @property {MediaRecorder | null} mediaRecorder - MediaRecorder instance for audio recording
 * @property {boolean} isMicrophoneOn - Whether the microphone is currently active
 * @property {boolean} isVoiceLoading - Whether voice transcription is in progress
 * @property {() => void} onClose - Callback to cancel/close the recording
 * @property {() => void} onConfirm - Callback to confirm and transcribe the recording
 * @property {React.MutableRefObject<AnalyserNode | null>} analyserRef - Ref to analyser node for audio visualization
 * @property {React.MutableRefObject<number | null>} animationFrameRef - Ref to animation frame ID for visualizer
 */
interface VoiceRecordingViewProps {
  mediaRecorder: MediaRecorder | null;
  isMicrophoneOn: boolean;
  isVoiceLoading: boolean;
  onClose: () => void;
  onConfirm: () => void;
  analyserRef: React.MutableRefObject<AnalyserNode | null>;
  animationFrameRef: React.MutableRefObject<number | null>;
}

/**
 * VoiceRecordingView Component
 * 
 * Displays the voice recording interface when the user is recording audio.
 * Features:
 * - Shows audio visualizer (waveform) while recording
 * - Shows "Processing..." when recording has stopped but before transcription
 * - Provides cancel button (X) to discard the recording
 * - Provides confirm button (✓) to transcribe the recording
 * - Shows loading spinner during transcription
 * 
 * @param {VoiceRecordingViewProps} props - Component props
 * @returns {JSX.Element} The voice recording interface UI
 */
const VoiceRecordingView: React.FC<VoiceRecordingViewProps> = ({
  mediaRecorder,
  isMicrophoneOn,
  isVoiceLoading,
  onClose,
  onConfirm,
  analyserRef,
  animationFrameRef,
}) => {
  return (
    <div className="voice-recording-container">
      {/* Audio visualizer section */}
      <div className="voice-visualizer">
        {/* Show audio visualizer only when actively recording */}
        {mediaRecorder && isMicrophoneOn && mediaRecorder.state === 'recording' ? (
          // Render the audio visualizer component with waveform animation
          <AudioVisualizer 
            isMicrophoneOn={isMicrophoneOn}     // Pass recording state
            analyserRef={analyserRef}          // Pass analyser ref for frequency data
            animationFrameRef={animationFrameRef} // Pass animation frame ref for cleanup
          />
        ) : (
          // Show "Processing..." message when not actively recording
          // (e.g., after stopping but before transcription starts)
          <div className="voice-processing">
            <span>Processing...</span>
          </div>
        )}
      </div>
      
      {/* Control buttons section */}
      <div className="voice-controls">
        {isVoiceLoading ? (
          // Show loading spinner during transcription
          <div className="voice-loading">
            <img src="/loading.svg" alt="loading" className="loading-icon" />
          </div>
        ) : (
          // Show control buttons when not loading
          <>
            {/* Cancel button - discards the recording */}
            <button 
              className="voice-close-btn"
              onClick={onClose}                // Cancel recording
              title="Cancel recording"
            >
              <img src="/close.svg" alt="close" className="control-icon" />
            </button>
            
            {/* Confirm button - transcribes the recording */}
            <button 
              className="voice-confirm-btn"
              onClick={onConfirm}               // Confirm and transcribe
              title="Confirm recording"
            >
              <img src="/check.svg" alt="check" className="control-icon" />
            </button>
          </>
        )}
      </div>
    </div>
  );
};

// Export the VoiceRecordingView component as the default export
export default VoiceRecordingView;


