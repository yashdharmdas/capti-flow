/**
 * Extract audio from video file and convert to base64 for API transmission
 */
export const extractAudioFromVideo = async (videoFile: File): Promise<string> => {
  return new Promise((resolve, reject) => {
    const video = document.createElement('video');
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');
    
    video.onloadedmetadata = () => {
      // Create audio context for processing
      const audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
      const source = audioContext.createMediaElementSource(video);
      const analyser = audioContext.createAnalyser();
      const scriptProcessor = audioContext.createScriptProcessor(4096, 1, 1);
      
      source.connect(analyser);
      analyser.connect(scriptProcessor);
      scriptProcessor.connect(audioContext.destination);
      
      const audioChunks: Float32Array[] = [];
      let isRecording = false;
      
      scriptProcessor.onaudioprocess = (audioProcessingEvent) => {
        if (isRecording) {
          const inputBuffer = audioProcessingEvent.inputBuffer;
          const audioData = inputBuffer.getChannelData(0);
          audioChunks.push(new Float32Array(audioData));
        }
      };
      
      video.onplay = () => {
        isRecording = true;
      };
      
      video.onended = () => {
        isRecording = false;
        
        // Convert audio chunks to WAV format
        const totalLength = audioChunks.reduce((acc, chunk) => acc + chunk.length, 0);
        const combinedAudio = new Float32Array(totalLength);
        let offset = 0;
        
        for (const chunk of audioChunks) {
          combinedAudio.set(chunk, offset);
          offset += chunk.length;
        }
        
        // Convert to 16-bit PCM WAV
        const wavBuffer = encodeWAV(combinedAudio, audioContext.sampleRate);
        const base64Audio = arrayBufferToBase64(wavBuffer);
        
        resolve(base64Audio);
      };
      
      video.onerror = () => {
        reject(new Error('Error processing video for audio extraction'));
      };
      
      // Start video playback (muted to extract audio)
      video.muted = true;
      video.play();
    };
    
    video.src = URL.createObjectURL(videoFile);
  });
};

/**
 * Simple audio extraction using MediaRecorder API (fallback method)
 */
export const extractAudioSimple = async (videoFile: File): Promise<string> => {
  return new Promise(async (resolve, reject) => {
    try {
      // Create video element to get audio stream
      const video = document.createElement('video');
      video.src = URL.createObjectURL(videoFile);
      video.muted = false;
      
      await new Promise((resolve) => {
        video.onloadedmetadata = resolve;
      });
      
      // Capture audio from video using MediaRecorder
      const stream = (video as any).captureStream();
      const audioTracks = stream.getAudioTracks();
      
      if (audioTracks.length === 0) {
        throw new Error('No audio track found in video');
      }
      
      const audioStream = new MediaStream([audioTracks[0]]);
      const mediaRecorder = new MediaRecorder(audioStream, {
        mimeType: 'audio/webm'
      });
      
      const audioChunks: Blob[] = [];
      
      mediaRecorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          audioChunks.push(event.data);
        }
      };
      
      mediaRecorder.onstop = async () => {
        const audioBlob = new Blob(audioChunks, { type: 'audio/webm' });
        const arrayBuffer = await audioBlob.arrayBuffer();
        const base64Audio = arrayBufferToBase64(arrayBuffer);
        resolve(base64Audio);
      };
      
      mediaRecorder.onerror = () => {
        reject(new Error('Error recording audio from video'));
      };
      
      // Start recording and play video
      mediaRecorder.start();
      video.play();
      
      // Stop recording when video ends
      video.onended = () => {
        mediaRecorder.stop();
      };
      
    } catch (error) {
      reject(error);
    }
  });
};

/**
 * Convert Float32Array to WAV format
 */
function encodeWAV(samples: Float32Array, sampleRate: number): ArrayBuffer {
  const length = samples.length;
  const buffer = new ArrayBuffer(44 + length * 2);
  const view = new DataView(buffer);
  
  // WAV header
  const writeString = (offset: number, string: string) => {
    for (let i = 0; i < string.length; i++) {
      view.setUint8(offset + i, string.charCodeAt(i));
    }
  };
  
  writeString(0, 'RIFF');
  view.setUint32(4, 36 + length * 2, true);
  writeString(8, 'WAVE');
  writeString(12, 'fmt ');
  view.setUint32(16, 16, true);
  view.setUint16(20, 1, true);
  view.setUint16(22, 1, true);
  view.setUint32(24, sampleRate, true);
  view.setUint32(28, sampleRate * 2, true);
  view.setUint16(32, 2, true);
  view.setUint16(34, 16, true);
  writeString(36, 'data');
  view.setUint32(40, length * 2, true);
  
  // Convert float samples to 16-bit PCM
  let offset = 44;
  for (let i = 0; i < length; i++) {
    const sample = Math.max(-1, Math.min(1, samples[i]));
    view.setInt16(offset, sample * 0x7FFF, true);
    offset += 2;
  }
  
  return buffer;
}

/**
 * Convert ArrayBuffer to base64 string
 */
function arrayBufferToBase64(buffer: ArrayBuffer): string {
  const bytes = new Uint8Array(buffer);
  let binary = '';
  for (let i = 0; i < bytes.byteLength; i++) {
    binary += String.fromCharCode(bytes[i]);
  }
  return btoa(binary);
}