import React, { useEffect, useRef } from 'react';

interface AudioVisualizerProps {
  isMicrophoneOn: boolean;
  analyserRef: React.MutableRefObject<AnalyserNode | null>;
  animationFrameRef: React.MutableRefObject<number | null>;
}

const AudioVisualizer: React.FC<AudioVisualizerProps> = ({ isMicrophoneOn, analyserRef, animationFrameRef }) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    if (!isMicrophoneOn || !analyserRef.current) return;

    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const bufferLength = analyserRef.current.frequencyBinCount;
    const dataArray = new Uint8Array(bufferLength);

    const draw = () => {
      if (!isMicrophoneOn) return;

      analyserRef.current!.getByteFrequencyData(dataArray);

      // Clear the canvas to keep background fully transparent
      ctx.clearRect(0, 0, canvas.width, canvas.height);

      const barWidth = (canvas.width / bufferLength) * 2.5;
      let barHeight;
      let x = 0;

      for (let i = 0; i < bufferLength; i++) {
        barHeight = (dataArray[i] / 255) * canvas.height;

        // Draw bars in theme blue
        ctx.fillStyle = '#007bff';
        ctx.fillRect(x, canvas.height - barHeight, barWidth, barHeight);

        x += barWidth + 1;
      }

      animationFrameRef.current = requestAnimationFrame(draw);
    };

    draw();

    return () => {
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current);
      }
    };
  }, [isMicrophoneOn, analyserRef, animationFrameRef]);

  return (
    <canvas
      ref={canvasRef}
      width={300}
      height={60}
      style={{ width: '100%', height: '60px' }}
    />
  );
};

export default AudioVisualizer;


