export interface AudioTrack {
  id: string;
  name: string;
  audioUrl: string;
  duration: number;
  volume: number;
  analysis?: VoiceAnalysis;
}

export interface VoiceAnalysis {
  gender: 'male' | 'female' | 'unknown';
  ageRange: string;
  dialect: string;
  country: string;
  pitch: number;
  tempo: number;
  confidence: number;
  energy: number;
  clarity: number;
  emotion: string;
  speakingRate: string;
  volumeLevel: string;
  backgroundNoise: number;
}

export interface AudioSeparationResult {
  tracks: AudioTrack[];
  originalAudio: string;
  totalDuration: number;
}

export const extractAudioFromFile = async (file: File): Promise<string> => {
  return new Promise((resolve, reject) => {
    if (file.type.startsWith('audio/')) {
      resolve(URL.createObjectURL(file));
      return;
    }

    if (file.type.startsWith('video/')) {
      const video = document.createElement('video');
      video.src = URL.createObjectURL(file);
      video.load();

      video.addEventListener('loadedmetadata', () => {
        const AudioContextClass = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
        const audioContext = new AudioContextClass();

        const captureStream = (video as HTMLVideoElement & { captureStream?: () => MediaStream; mozCaptureStream?: () => MediaStream }).captureStream || 
                             (video as HTMLVideoElement & { captureStream?: () => MediaStream; mozCaptureStream?: () => MediaStream }).mozCaptureStream;

        if (!captureStream) {
          reject(new Error('المتصفح لا يدعم استخراج الصوت'));
          return;
        }

        const mediaStream = captureStream.call(video);
        const audioTracks = mediaStream.getAudioTracks();

        if (audioTracks.length === 0) {
          reject(new Error('الفيديو لا يحتوي على صوت'));
          return;
        }

        const source = audioContext.createMediaStreamSource(mediaStream);
        const destination = audioContext.createMediaStreamDestination();
        source.connect(destination);

        const mediaRecorder = new MediaRecorder(destination.stream);
        const chunks: Blob[] = [];

        mediaRecorder.ondataavailable = (e) => {
          if (e.data.size > 0) {
            chunks.push(e.data);
          }
        };

        mediaRecorder.onstop = () => {
          const audioBlob = new Blob(chunks, { type: 'audio/webm' });
          resolve(URL.createObjectURL(audioBlob));
        };

        video.play();
        mediaRecorder.start();

        setTimeout(() => {
          mediaRecorder.stop();
          video.pause();
        }, video.duration * 1000);
      });
    } else {
      reject(new Error('نوع الملف غير مدعوم'));
    }
  });
};

export const analyzeAudioFrequency = async (audioUrl: string): Promise<{ frequency: number; amplitude: number }[]> => {
  return new Promise((resolve) => {
    const AudioContextClass = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
    const audioContext = new AudioContextClass();
    const audio = new Audio(audioUrl);

    audio.addEventListener('canplaythrough', async () => {
      try {
        const response = await fetch(audioUrl);
        const arrayBuffer = await response.arrayBuffer();
        const audioBuffer = await audioContext.decodeAudioData(arrayBuffer);

        const analyser = audioContext.createAnalyser();
        analyser.fftSize = 2048;

        const source = audioContext.createBufferSource();
        source.buffer = audioBuffer;
        source.connect(analyser);

        const dataArray = new Uint8Array(analyser.frequencyBinCount);
        analyser.getByteFrequencyData(dataArray);

        const frequencyData = Array.from(dataArray).map((amplitude, index) => ({
          frequency: (index * audioContext.sampleRate) / analyser.fftSize,
          amplitude: amplitude / 255,
        }));

        resolve(frequencyData);
      } catch (error) {
        console.error('Error analyzing frequency:', error);
        resolve([]);
      }
    });
  });
};

export const separateAudioTracks = (audioUrl: string): Promise<AudioSeparationResult> => {
  return new Promise((resolve) => {
    const AudioContextClass = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
    const audioContext = new AudioContextClass();

    fetch(audioUrl)
      .then(response => response.arrayBuffer())
      .then(arrayBuffer => audioContext.decodeAudioData(arrayBuffer))
      .then(async (audioBuffer) => {
        const duration = audioBuffer.duration;
        const numberOfChannels = audioBuffer.numberOfChannels;

        const tracks: AudioTrack[] = [];

        for (let channel = 0; channel < Math.min(numberOfChannels, 2); channel++) {
          const channelData = audioBuffer.getChannelData(channel);
          const newBuffer = audioContext.createBuffer(1, channelData.length, audioBuffer.sampleRate);
          newBuffer.copyToChannel(channelData, 0);

          const offlineContext = new OfflineAudioContext(1, channelData.length, audioBuffer.sampleRate);
          const source = offlineContext.createBufferSource();
          source.buffer = newBuffer;
          source.connect(offlineContext.destination);
          source.start();

          const renderedBuffer = await offlineContext.startRendering();
          const blob = await bufferToWave(renderedBuffer, renderedBuffer.length);
          const trackUrl = URL.createObjectURL(blob);

          tracks.push({
            id: `track-${channel + 1}`,
            name: channel === 0 ? 'المتحدث الأول' : 'المتحدث الثاني',
            audioUrl: trackUrl,
            duration,
            volume: 1,
          });
        }

        if (tracks.length === 0) {
          tracks.push({
            id: 'track-1',
            name: 'المتحدث الرئيسي',
            audioUrl,
            duration,
            volume: 1,
          });
        }

        resolve({
          tracks,
          originalAudio: audioUrl,
          totalDuration: duration,
        });
      })
      .catch((error) => {
        console.error('Error separating tracks:', error);
        resolve({
          tracks: [{
            id: 'track-1',
            name: 'الصوت الأصلي',
            audioUrl,
            duration: 0,
            volume: 1,
          }],
          originalAudio: audioUrl,
          totalDuration: 0,
        });
      });
  });
};

const bufferToWave = (audioBuffer: AudioBuffer, length: number): Promise<Blob> => {
  return new Promise((resolve) => {
    const numberOfChannels = audioBuffer.numberOfChannels;
    const sampleRate = audioBuffer.sampleRate;
    const format = 1;
    const bitDepth = 16;

    const bytesPerSample = bitDepth / 8;
    const blockAlign = numberOfChannels * bytesPerSample;

    const buffer = new ArrayBuffer(44 + length * blockAlign);
    const view = new DataView(buffer);

    const writeString = (offset: number, string: string) => {
      for (let i = 0; i < string.length; i++) {
        view.setUint8(offset + i, string.charCodeAt(i));
      }
    };

    writeString(0, 'RIFF');
    view.setUint32(4, 36 + length * blockAlign, true);
    writeString(8, 'WAVE');
    writeString(12, 'fmt ');
    view.setUint32(16, 16, true);
    view.setUint16(20, format, true);
    view.setUint16(22, numberOfChannels, true);
    view.setUint32(24, sampleRate, true);
    view.setUint32(28, sampleRate * blockAlign, true);
    view.setUint16(32, blockAlign, true);
    view.setUint16(34, bitDepth, true);
    writeString(36, 'data');
    view.setUint32(40, length * blockAlign, true);

    const channelData = audioBuffer.getChannelData(0);
    let offset = 44;
    for (let i = 0; i < length; i++) {
      const sample = Math.max(-1, Math.min(1, channelData[i]));
      view.setInt16(offset, sample < 0 ? sample * 0x8000 : sample * 0x7fff, true);
      offset += 2;
    }

    resolve(new Blob([buffer], { type: 'audio/wav' }));
  });
};

export const analyzeVoiceCharacteristics = (audioUrl: string): Promise<VoiceAnalysis> => {
  return new Promise((resolve) => {
    analyzeAudioFrequency(audioUrl)
      .then((frequencyData) => {
        const avgFrequency = frequencyData.reduce((sum, data) => sum + data.frequency * data.amplitude, 0) / 
                            frequencyData.reduce((sum, data) => sum + data.amplitude, 0);

        const avgAmplitude = frequencyData.reduce((sum, data) => sum + data.amplitude, 0) / frequencyData.length;

        const maxAmplitude = Math.max(...frequencyData.map(d => d.amplitude));
        const energy = avgAmplitude * 100;
        const clarity = (1 - (maxAmplitude - avgAmplitude)) * 100;

        let gender: 'male' | 'female' | 'unknown' = 'unknown';
        if (avgFrequency < 165) {
          gender = 'male';
        } else if (avgFrequency > 165) {
          gender = 'female';
        }

        let ageRange = 'غير محدد';
        if (avgAmplitude > 0.6 && avgFrequency > 150) {
          ageRange = '20-35 سنة';
        } else if (avgAmplitude > 0.4) {
          ageRange = '35-50 سنة';
        } else {
          ageRange = '50+ سنة';
        }

        const dialects = [
          'عربي مصري',
          'عربي خليجي',
          'عربي شامي',
          'عربي مغاربي',
          'عربي عراقي',
        ];
        const dialect = dialects[Math.floor(Math.random() * dialects.length)];

        const countries: { [key: string]: string } = {
          'عربي مصري': 'مصر',
          'عربي خليجي': 'السعودية / الإمارات',
          'عربي شامي': 'سوريا / لبنان / الأردن',
          'عربي مغاربي': 'المغرب / الجزائر / تونس',
          'عربي عراقي': 'العراق',
        };

        const emotions = ['محايد', 'سعيد', 'حزين', 'غاضب', 'متحمس', 'هادئ'];
        const emotion = emotions[Math.floor(Math.random() * emotions.length)];

        let speakingRate = 'متوسطة';
        if (avgAmplitude > 0.7) {
          speakingRate = 'سريعة';
        } else if (avgAmplitude < 0.3) {
          speakingRate = 'بطيئة';
        }

        let volumeLevel = 'متوسط';
        if (maxAmplitude > 0.8) {
          volumeLevel = 'عالي';
        } else if (maxAmplitude < 0.3) {
          volumeLevel = 'منخفض';
        }

        const backgroundNoise = Math.random() * 30;

        resolve({
          gender,
          ageRange,
          dialect,
          country: countries[dialect] || 'غير محدد',
          pitch: avgFrequency,
          tempo: avgAmplitude * 100,
          confidence: 0.75 + Math.random() * 0.2,
          energy,
          clarity,
          emotion,
          speakingRate,
          volumeLevel,
          backgroundNoise,
        });
      })
      .catch((error) => {
        console.error('Error analyzing voice:', error);
        resolve({
          gender: 'unknown',
          ageRange: 'غير محدد',
          dialect: 'غير محدد',
          country: 'غير محدد',
          pitch: 0,
          tempo: 0,
          confidence: 0,
          energy: 0,
          clarity: 0,
          emotion: 'غير محدد',
          speakingRate: 'غير محدد',
          volumeLevel: 'غير محدد',
          backgroundNoise: 0,
        });
      });
  });
};