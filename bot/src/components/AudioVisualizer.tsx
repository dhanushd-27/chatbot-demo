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

      ctx.fillStyle = 'rgba(0, 123, 255, 0.1)';
      ctx.fillRect(0, 0, canvas.width, canvas.height);

      const barWidth = (canvas.width / bufferLength) * 2.5;
      let barHeight;
      let x = 0;

      for (let i = 0; i < bufferLength; i++) {
        barHeight = (dataArray[i] / 255) * canvas.height;

        ctx.fillStyle = `rgb(${barHeight + 100}, 50, 50)`;
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
  }, [isMicrophoneOn]);

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


