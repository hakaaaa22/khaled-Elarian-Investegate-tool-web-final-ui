export interface VideoRestorationResult {
  originalVideo: string;
  audioTrack?: string;
  hasAudio: boolean;
  frameRate: number;
  codec?: string;
  qualityScore: number;
  resolutionQuality: string;
}

export const extractAudioFromVideo = async (videoFile: File): Promise<string | null> => {
  return new Promise((resolve) => {
    const video = document.createElement('video');
    const AudioContextClass = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
    const audioContext = new AudioContextClass();
    
    video.src = URL.createObjectURL(videoFile);
    video.load();

    video.addEventListener('loadedmetadata', async () => {
      try {
        const captureStream = (video as HTMLVideoElement & { captureStream?: () => MediaStream; mozCaptureStream?: () => MediaStream }).captureStream || 
                             (video as HTMLVideoElement & { captureStream?: () => MediaStream; mozCaptureStream?: () => MediaStream }).mozCaptureStream;
        
        if (!captureStream) {
          resolve(null);
          return;
        }

        const mediaStream = captureStream.call(video);
        
        if (!mediaStream) {
          resolve(null);
          return;
        }

        const audioTracks = mediaStream.getAudioTracks();
        
        if (audioTracks.length === 0) {
          resolve(null);
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
          const audioUrl = URL.createObjectURL(audioBlob);
          resolve(audioUrl);
        };

        video.play();
        mediaRecorder.start();

        setTimeout(() => {
          mediaRecorder.stop();
          video.pause();
        }, Math.min(video.duration * 1000, 5000));
      } catch (error) {
        console.error('Error extracting audio:', error);
        resolve(null);
      }
    });
  });
};

export const calculateVideoQuality = (width: number, height: number): { score: number; quality: string } => {
  const totalPixels = width * height;
  
  // 8K: 7680×4320 = 33,177,600 pixels
  // 4K: 3840×2160 = 8,294,400 pixels
  // 2K: 2560×1440 = 3,686,400 pixels
  // Full HD: 1920×1080 = 2,073,600 pixels
  // HD: 1280×720 = 921,600 pixels
  // SD: 854×480 = 409,920 pixels
  
  let score = 0;
  let quality = '';
  
  if (totalPixels >= 33177600) {
    score = 100;
    quality = '8K Ultra HD';
  } else if (totalPixels >= 8294400) {
    score = 95;
    quality = '4K Ultra HD';
  } else if (totalPixels >= 3686400) {
    score = 85;
    quality = '2K Quad HD';
  } else if (totalPixels >= 2073600) {
    score = 75;
    quality = 'Full HD 1080p';
  } else if (totalPixels >= 921600) {
    score = 60;
    quality = 'HD 720p';
  } else if (totalPixels >= 409920) {
    score = 40;
    quality = 'SD 480p';
  } else {
    score = 20;
    quality = 'Low Quality';
  }
  
  return { score, quality };
};

export const removeVideoEffects = async (videoFile: File): Promise<VideoRestorationResult> => {
  return new Promise((resolve, reject) => {
    const video = document.createElement('video');
    video.src = URL.createObjectURL(videoFile);
    video.preload = 'metadata';

    video.onloadedmetadata = async () => {
      const canvas = document.createElement('canvas');
      const ctx = canvas.getContext('2d');

      if (!ctx) {
        reject(new Error('فشل إنشاء سياق الرسم'));
        return;
      }

      canvas.width = video.videoWidth;
      canvas.height = video.videoHeight;

      const qualityData = calculateVideoQuality(video.videoWidth, video.videoHeight);

      const stream = canvas.captureStream(30);
      const mediaRecorder = new MediaRecorder(stream, {
        mimeType: 'video/webm;codecs=vp9',
        videoBitsPerSecond: 2500000,
      });

      const chunks: Blob[] = [];

      mediaRecorder.ondataavailable = (e) => {
        if (e.data.size > 0) {
          chunks.push(e.data);
        }
      };

      mediaRecorder.onstop = async () => {
        const videoBlob = new Blob(chunks, { type: 'video/webm' });
        const videoUrl = URL.createObjectURL(videoBlob);
        
        const audioUrl = await extractAudioFromVideo(videoFile);

        resolve({
          originalVideo: videoUrl,
          audioTrack: audioUrl || undefined,
          hasAudio: !!audioUrl,
          frameRate: 30,
          codec: 'vp9',
          qualityScore: qualityData.score,
          resolutionQuality: qualityData.quality,
        });
      };

      video.play();
      mediaRecorder.start();

      const drawFrame = () => {
        if (video.paused || video.ended) {
          mediaRecorder.stop();
          return;
        }

        ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
        requestAnimationFrame(drawFrame);
      };

      drawFrame();

      setTimeout(() => {
        video.pause();
        mediaRecorder.stop();
      }, Math.min(video.duration * 1000, 10000));
    };

    video.onerror = () => reject(new Error('فشل تحميل الفيديو'));
  });
};

export const analyzeVideoQuality = (videoElement: HTMLVideoElement): {
  brightness: number;
  contrast: number;
  saturation: number;
} => {
  const canvas = document.createElement('canvas');
  const ctx = canvas.getContext('2d');

  if (!ctx) {
    return { brightness: 0, contrast: 0, saturation: 0 };
  }

  canvas.width = videoElement.videoWidth;
  canvas.height = videoElement.videoHeight;
  ctx.drawImage(videoElement, 0, 0);

  const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
  const pixels = imageData.data;

  let totalBrightness = 0;
  let totalSaturation = 0;
  const pixelCount = pixels.length / 4;

  for (let i = 0; i < pixels.length; i += 4) {
    const r = pixels[i];
    const g = pixels[i + 1];
    const b = pixels[i + 2];

    const brightness = (r + g + b) / 3;
    totalBrightness += brightness;

    const max = Math.max(r, g, b);
    const min = Math.min(r, g, b);
    const saturation = max === 0 ? 0 : (max - min) / max;
    totalSaturation += saturation;
  }

  return {
    brightness: totalBrightness / pixelCount / 255,
    contrast: 0.5,
    saturation: totalSaturation / pixelCount,
  };
};