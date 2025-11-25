export interface SeparatedTrack {
  id: string;
  name: string;
  audioUrl: string;
  blob: Blob;
  duration: number;
  volume: number;
  waveformData: number[];
}

export interface SeparationResult {
  tracks: SeparatedTrack[];
  originalUrl: string;
  duration: number;
}

export const extractAudioFromVideo = async (file: File): Promise<Blob> => {
  return new Promise((resolve, reject) => {
    const video = document.createElement('video');
    video.src = URL.createObjectURL(file);
    video.muted = false;

    video.addEventListener('loadedmetadata', async () => {
      try {
        const AudioContextClass = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
        const audioContext = new AudioContextClass();
        
        const response = await fetch(video.src);
        const arrayBuffer = await response.arrayBuffer();
        
        // For video files, we need to extract audio differently
        if (file.type.startsWith('video/')) {
          // Create a simple audio extraction
          const audioBlob = new Blob([arrayBuffer], { type: 'audio/webm' });
          resolve(audioBlob);
        } else {
          resolve(new Blob([arrayBuffer], { type: file.type }));
        }
      } catch (error) {
        console.error('Error extracting audio:', error);
        reject(error);
      }
    });

    video.addEventListener('error', () => {
      reject(new Error('Failed to load video'));
    });
  });
};

export const separateAudioChannels = (file: File): Promise<SeparationResult> => {
  return new Promise((resolve, reject) => {
    const processAudio = async () => {
      try {
        const AudioContextClass = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
        const audioContext = new AudioContextClass();
        
        let audioBlob: Blob;
        
        if (file.type.startsWith('video/')) {
          audioBlob = await extractAudioFromVideo(file);
        } else {
          audioBlob = file;
        }
        
        const arrayBuffer = await audioBlob.arrayBuffer();
        const audioBuffer = await audioContext.decodeAudioData(arrayBuffer);
        
        const duration = audioBuffer.duration;
        const sampleRate = audioBuffer.sampleRate;
        const numberOfChannels = audioBuffer.numberOfChannels;
        
        const tracks: SeparatedTrack[] = [];
        
        // Separate by channels
        for (let channel = 0; channel < numberOfChannels; channel++) {
          const channelData = audioBuffer.getChannelData(channel);
          
          // Create new buffer for this channel
          const newBuffer = audioContext.createBuffer(1, channelData.length, sampleRate);
          newBuffer.copyToChannel(channelData, 0);
          
          // Convert to WAV
          const wavBlob = await audioBufferToWav(newBuffer);
          const trackUrl = URL.createObjectURL(wavBlob);
          
          // Generate waveform data
          const waveformData = generateWaveformData(channelData, 100);
          
          tracks.push({
            id: `channel-${channel}`,
            name: numberOfChannels === 1 ? 'الصوت الرئيسي' : `القناة ${channel + 1}`,
            audioUrl: trackUrl,
            blob: wavBlob,
            duration,
            volume: 1,
            waveformData,
          });
        }
        
        // If mono, try to separate by frequency ranges
        if (numberOfChannels === 1) {
          const channelData = audioBuffer.getChannelData(0);
          
          // Low frequencies (bass/male voices)
          const lowFreqData = applyLowPassFilter(channelData, sampleRate, 300);
          const lowBuffer = audioContext.createBuffer(1, lowFreqData.length, sampleRate);
          lowBuffer.copyToChannel(lowFreqData, 0);
          const lowWav = await audioBufferToWav(lowBuffer);
          
          tracks.push({
            id: 'low-freq',
            name: 'الترددات المنخفضة (أصوات عميقة)',
            audioUrl: URL.createObjectURL(lowWav),
            blob: lowWav,
            duration,
            volume: 1,
            waveformData: generateWaveformData(lowFreqData, 100),
          });
          
          // High frequencies (treble/female voices)
          const highFreqData = applyHighPassFilter(channelData, sampleRate, 300);
          const highBuffer = audioContext.createBuffer(1, highFreqData.length, sampleRate);
          highBuffer.copyToChannel(highFreqData, 0);
          const highWav = await audioBufferToWav(highBuffer);
          
          tracks.push({
            id: 'high-freq',
            name: 'الترددات العالية (أصوات حادة)',
            audioUrl: URL.createObjectURL(highWav),
            blob: highWav,
            duration,
            volume: 1,
            waveformData: generateWaveformData(highFreqData, 100),
          });
        }
        
        resolve({
          tracks,
          originalUrl: URL.createObjectURL(file),
          duration,
        });
      } catch (error) {
        console.error('Error separating audio:', error);
        reject(error);
      }
    };

    processAudio();
  });
};

const audioBufferToWav = (buffer: AudioBuffer): Promise<Blob> => {
  return new Promise((resolve) => {
    const length = buffer.length * buffer.numberOfChannels * 2;
    const arrayBuffer = new ArrayBuffer(44 + length);
    const view = new DataView(arrayBuffer);
    
    // WAV header
    const writeString = (offset: number, string: string) => {
      for (let i = 0; i < string.length; i++) {
        view.setUint8(offset + i, string.charCodeAt(i));
      }
    };
    
    writeString(0, 'RIFF');
    view.setUint32(4, 36 + length, true);
    writeString(8, 'WAVE');
    writeString(12, 'fmt ');
    view.setUint32(16, 16, true);
    view.setUint16(20, 1, true);
    view.setUint16(22, buffer.numberOfChannels, true);
    view.setUint32(24, buffer.sampleRate, true);
    view.setUint32(28, buffer.sampleRate * buffer.numberOfChannels * 2, true);
    view.setUint16(32, buffer.numberOfChannels * 2, true);
    view.setUint16(34, 16, true);
    writeString(36, 'data');
    view.setUint32(40, length, true);
    
    // Write audio data
    let offset = 44;
    for (let i = 0; i < buffer.length; i++) {
      for (let channel = 0; channel < buffer.numberOfChannels; channel++) {
        const sample = buffer.getChannelData(channel)[i];
        const s = Math.max(-1, Math.min(1, sample));
        view.setInt16(offset, s < 0 ? s * 0x8000 : s * 0x7fff, true);
        offset += 2;
      }
    }
    
    resolve(new Blob([arrayBuffer], { type: 'audio/wav' }));
  });
};

const generateWaveformData = (channelData: Float32Array, samples: number): number[] => {
  const blockSize = Math.floor(channelData.length / samples);
  const waveform: number[] = [];
  
  for (let i = 0; i < samples; i++) {
    const start = i * blockSize;
    const end = start + blockSize;
    let sum = 0;
    
    for (let j = start; j < end && j < channelData.length; j++) {
      sum += Math.abs(channelData[j]);
    }
    
    waveform.push(sum / blockSize);
  }
  
  return waveform;
};

const applyLowPassFilter = (data: Float32Array, sampleRate: number, cutoff: number): Float32Array => {
  const output = new Float32Array(data.length);
  const rc = 1.0 / (cutoff * 2 * Math.PI);
  const dt = 1.0 / sampleRate;
  const alpha = dt / (rc + dt);
  
  output[0] = data[0];
  for (let i = 1; i < data.length; i++) {
    output[i] = output[i - 1] + alpha * (data[i] - output[i - 1]);
  }
  
  return output;
};

const applyHighPassFilter = (data: Float32Array, sampleRate: number, cutoff: number): Float32Array => {
  const output = new Float32Array(data.length);
  const rc = 1.0 / (cutoff * 2 * Math.PI);
  const dt = 1.0 / sampleRate;
  const alpha = rc / (rc + dt);
  
  output[0] = data[0];
  for (let i = 1; i < data.length; i++) {
    output[i] = alpha * (output[i - 1] + data[i] - data[i - 1]);
  }
  
  return output;
};

export const downloadTrack = (track: SeparatedTrack) => {
  const a = document.createElement('a');
  a.href = track.audioUrl;
  a.download = `${track.name}.wav`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
};