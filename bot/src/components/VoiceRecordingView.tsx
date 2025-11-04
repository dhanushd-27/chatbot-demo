import React from 'react';
import AudioVisualizer from './AudioVisualizer';

interface VoiceRecordingViewProps {
  mediaRecorder: MediaRecorder | null;
  isMicrophoneOn: boolean;
  isVoiceLoading: boolean;
  onClose: () => void;
  onConfirm: () => void;
  analyserRef: React.MutableRefObject<AnalyserNode | null>;
  animationFrameRef: React.MutableRefObject<number | null>;
}

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
      <div className="voice-visualizer">
        {mediaRecorder && isMicrophoneOn && mediaRecorder.state === 'recording' ? (
          <AudioVisualizer 
            isMicrophoneOn={isMicrophoneOn} 
            analyserRef={analyserRef} 
            animationFrameRef={animationFrameRef}
          />
        ) : (
          <div className="voice-processing">
            <span>Processing...</span>
          </div>
        )}
      </div>
      <div className="voice-controls">
        {isVoiceLoading ? (
          <div className="voice-loading">
            <img src="/loading.svg" alt="loading" className="loading-icon" />
          </div>
        ) : (
          <>
            <button 
              className="voice-close-btn"
              onClick={onClose}
              title="Cancel recording"
            >
              <img src="/close.svg" alt="close" className="control-icon" />
            </button>
            <button 
              className="voice-confirm-btn"
              onClick={onConfirm}
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

export default VoiceRecordingView;


