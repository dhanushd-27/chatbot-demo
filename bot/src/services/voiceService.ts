/**
 * Voice Services: helpers to work with audio blob URLs and backend transcription
 */

/**
 * Fetch a Blob from a blob URL
 * @param {string} blobUrl
 * @returns {Promise<Blob>}
 */
export const blobUrlToBlob = async (blobUrl: string): Promise<Blob> => {
  const response = await fetch(blobUrl);
  if (!response.ok) throw new Error(`Failed to fetch blob: ${response.status}`);
  return await response.blob();
};

/**
 * Encode an AudioBuffer to a 16-bit PCM WAV Blob
 * @param {AudioBuffer} audioBuffer
 * @returns {Blob}
 */
const audioBufferToWavBlob = (audioBuffer: AudioBuffer): Blob => {
  const numChannels = audioBuffer.numberOfChannels;
  const sampleRate = audioBuffer.sampleRate;
  const samples = audioBuffer.length;

  // Interleave channels
  const interleaved = new Float32Array(samples * numChannels);
  for (let channel = 0; channel < numChannels; channel++) {
    const channelData = audioBuffer.getChannelData(channel);
    for (let i = 0; i < samples; i++) {
      interleaved[i * numChannels + channel] = channelData[i];
    }
  }

  // Convert to 16-bit PCM
  const buffer = new ArrayBuffer(44 + interleaved.length * 2);
  const view = new DataView(buffer);

  // RIFF header
  writeString(view, 0, 'RIFF');
  view.setUint32(4, 36 + interleaved.length * 2, true);
  writeString(view, 8, 'WAVE');

  // fmt chunk
  writeString(view, 12, 'fmt ');
  view.setUint32(16, 16, true); // PCM chunk size
  view.setUint16(20, 1, true); // PCM format
  view.setUint16(22, numChannels, true);
  view.setUint32(24, sampleRate, true);
  view.setUint32(28, sampleRate * numChannels * 2, true); // byte rate
  view.setUint16(32, numChannels * 2, true); // block align
  view.setUint16(34, 16, true); // bits per sample

  // data chunk
  writeString(view, 36, 'data');
  view.setUint32(40, interleaved.length * 2, true);

  floatTo16BitPCM(view, 44, interleaved);

  return new Blob([view], { type: 'audio/wav' });
};

const writeString = (view: DataView, offset: number, string: string): void => {
  for (let i = 0; i < string.length; i++) {
    view.setUint8(offset + i, string.charCodeAt(i));
  }
};

const floatTo16BitPCM = (output: DataView, offset: number, input: Float32Array): void => {
  for (let i = 0; i < input.length; i++, offset += 2) {
    let s = Math.max(-1, Math.min(1, input[i]));
    s = s < 0 ? s * 0x8000 : s * 0x7FFF;
    output.setInt16(offset, s, true);
  }
};

/**
 * Convert arbitrary audio Blob into a WAV Blob using Web Audio API
 * If decode fails, returns the original Blob.
 * @param {Blob} inputBlob
 * @returns {Promise<Blob>}
 */
export const convertBlobToWavBlob = async (inputBlob: Blob): Promise<Blob> => {
  try {
    const arrayBuffer = await inputBlob.arrayBuffer();
    const audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
    const audioBuffer = await audioContext.decodeAudioData(arrayBuffer);
    const wavBlob = audioBufferToWavBlob(audioBuffer);
    try { audioContext.close(); } catch { /* ignore */ }
    return wavBlob;
  } catch (err) {
    return inputBlob;
  }
};

/**
 * Transcribe audio by sending a WAV (or original) Blob to backend /voice endpoint
 * @param {string} blobUrl
 * @param {string} sessionId
 * @param {string} backendUrl Optional explicit backend URL. Falls back to config/env.
 * @returns {Promise<any>} Parsed JSON response from backend
 */
export const transcribeAudioFromBlobUrl = async (blobUrl: string, sessionId: string, backendUrl?: string): Promise<any> => {
  // Resolve backend URL with sensible fallbacks
  let resolvedBackendUrl = backendUrl;
  if (!resolvedBackendUrl) {
    // Environment overrides (Vite)
    resolvedBackendUrl = import.meta.env?.VITE_BACKEND_URL;
    // Final hardcoded local default
    resolvedBackendUrl = resolvedBackendUrl || 'http://127.0.0.1:8000';
  }

  if (!resolvedBackendUrl) {
    throw new Error('backendUrl is required');
  }
  
  const originalBlob = await blobUrlToBlob(blobUrl);
  const wavBlob = await convertBlobToWavBlob(originalBlob);

  const formData = new FormData();
  // Prefer filename with .wav if conversion occurred
  const filename = wavBlob.type === 'audio/wav' ? 'recording.wav' : 'recording.webm';
  formData.append('file', wavBlob, filename);
  formData.append('session_id', sessionId);
  
  const base = resolvedBackendUrl.replace(/\/$/, '');
  const response = await fetch(`${base}/voice`, {
    method: 'POST',
    body: formData,
    credentials: 'include'
  });

  if (!response.ok) {
    const text = await response.text().catch(() => '');
    throw new Error(`Voice API error: ${response.status} ${text}`);
  }
  
  try {
    const result = await response.json();
    return result;
  } catch {
    throw new Error('Failed to parse response from voice API');
  }
};
