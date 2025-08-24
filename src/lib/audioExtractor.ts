/**
 * Extract audio from video file and convert to base64 for API transmission
 */
export const extractAudioFromVideo = async (videoFile: File): Promise<string> => {
  return new Promise((resolve, reject) => {
    const audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
    const fileReader = new FileReader();

    fileReader.onload = async (e) => {
      const audioData = e.target?.result as ArrayBuffer;

      try {
        const decodedAudio = await audioContext.decodeAudioData(audioData);

        const offlineContext = new OfflineAudioContext(
          decodedAudio.numberOfChannels,
          decodedAudio.length,
          decodedAudio.sampleRate
        );

        const source = offlineContext.createBufferSource();
        source.buffer = decodedAudio;

        source.connect(offlineContext.destination);
        source.start(0);

        const renderedBuffer = await offlineContext.startRendering();

        // Get the first channel of audio data and encode it to WAV
        const audioSamples = renderedBuffer.getChannelData(0); // Assuming mono audio
        const wavBuffer = encodeWAV(audioSamples, renderedBuffer.sampleRate);
        const base64Audio = arrayBufferToBase64(wavBuffer);

        resolve(base64Audio);
      } catch (error) {
        console.error('Error decoding or rendering audio:', error);
        reject(new Error('Failed to process audio from video.'));
      }
    };

    fileReader.onerror = (error) => {
      console.error('Error reading video file:', error);
      reject(new Error('Failed to read video file for audio extraction.'));
    };

    fileReader.readAsArrayBuffer(videoFile);
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