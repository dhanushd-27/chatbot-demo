// Import React hooks for component functionality
import React, { useEffect, useRef } from 'react';

/**
 * Props interface for AudioVisualizer component
 * 
 * @interface AudioVisualizerProps
 * @property {boolean} isMicrophoneOn - Whether the microphone is currently active
 * @property {React.MutableRefObject<AnalyserNode | null>} analyserRef - Ref to the Web Audio API analyser node
 * @property {React.MutableRefObject<number | null>} animationFrameRef - Ref to store the animation frame ID for cleanup
 */
interface AudioVisualizerProps {
  isMicrophoneOn: boolean;
  analyserRef: React.MutableRefObject<AnalyserNode | null>;
  animationFrameRef: React.MutableRefObject<number | null>;
}

/**
 * AudioVisualizer Component
 * 
 * Displays a real-time audio waveform visualization using HTML5 Canvas.
 * Shows frequency bars that react to the audio input from the microphone.
 * 
 * Features:
 * - Real-time frequency analysis visualization
 * - Animated bars that represent audio frequency levels
 * - Uses Web Audio API analyser node for frequency data
 * - Automatically cleans up animation frames on unmount
 * 
 * @param {AudioVisualizerProps} props - Component props
 * @returns {JSX.Element} Canvas element with audio visualization
 */
const AudioVisualizer: React.FC<AudioVisualizerProps> = ({ isMicrophoneOn, analyserRef, animationFrameRef }) => {
  // Ref to access the canvas DOM element for drawing
  const canvasRef = useRef<HTMLCanvasElement>(null);

  /**
   * useEffect: Set up and run the audio visualization animation
   * 
   * This effect:
   * 1. Gets frequency data from the analyser node
   * 2. Draws bars on the canvas representing frequency levels
   * 3. Continuously updates the visualization using requestAnimationFrame
   * 4. Cleans up the animation frame on unmount or when recording stops
   */
  useEffect(() => {
    // Exit if microphone is off or analyser is not available
    if (!isMicrophoneOn || !analyserRef.current) return;

    const canvas = canvasRef.current;
    // Exit if canvas is not available
    if (!canvas) return;

    // Get 2D rendering context for drawing on the canvas
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Get the buffer length (number of frequency data points)
    const bufferLength = analyserRef.current.frequencyBinCount;
    // Create a typed array to store frequency data (0-255 values)
    const dataArray = new Uint8Array(bufferLength);

    /**
     * Draw function - renders the audio visualization
     * 
     * This function:
     * 1. Gets current frequency data from the analyser
     * 2. Clears the canvas
     * 3. Draws bars representing each frequency bin
     * 4. Schedules the next frame using requestAnimationFrame
     */
    const draw = () => {
      // Exit if microphone is no longer on
      if (!isMicrophoneOn) return;

      // Get frequency data from the analyser node
      // This populates dataArray with values from 0-255 representing frequency levels
      analyserRef.current!.getByteFrequencyData(dataArray);

      // Clear the canvas to keep background fully transparent
      // This ensures we only see the current frame, not previous frames
      ctx.clearRect(0, 0, canvas.width, canvas.height);

      // Calculate bar width based on canvas width and number of frequency bins
      const barWidth = (canvas.width / bufferLength) * 2.5;
      let barHeight;
      let x = 0; // Starting x position for drawing bars

      // Draw a bar for each frequency bin
      for (let i = 0; i < bufferLength; i++) {
        // Calculate bar height based on frequency data (0-255 scaled to canvas height)
        barHeight = (dataArray[i] / 255) * canvas.height;

        // Set bar color to theme blue
        ctx.fillStyle = '#007bff';
        
        // Draw the bar from bottom of canvas upward
        // x: horizontal position
        // canvas.height - barHeight: vertical position (bars grow upward)
        // barWidth: width of the bar
        // barHeight: height of the bar
        ctx.fillRect(x, canvas.height - barHeight, barWidth, barHeight);

        // Move to next bar position (bar width + 1px gap)
        x += barWidth + 1;
      }

      // Schedule the next animation frame to continue the animation loop
      animationFrameRef.current = requestAnimationFrame(draw);
    };

    // Start the animation loop
    draw();

    // Cleanup function: cancel animation frame when component unmounts or effect re-runs
    return () => {
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current);
      }
    };
  }, [isMicrophoneOn, analyserRef, animationFrameRef]); // Re-run when these values change

  // Render the canvas element
  return (
    <canvas
      ref={canvasRef}              // Ref to access canvas DOM element
      width={300}                   // Canvas width in pixels
      height={60}                   // Canvas height in pixels
      style={{ width: '100%', height: '60px' }} // Responsive sizing
    />
  );
};

// Export the AudioVisualizer component as the default export
export default AudioVisualizer;


