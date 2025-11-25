export interface VideoEnhancementSettings {
  removeBlur: boolean;
  sharpenAmount: number;
  restoreBrightness: boolean;
  brightnessLevel: number;
  restoreContrast: boolean;
  contrastLevel: number;
  restoreSaturation: boolean;
  saturationLevel: number;
  removeNoise: boolean;
  noiseReduction: number;
  stabilize: boolean;
}

export interface VideoEnhancementResult {
  processedVideoUrl: string;
  originalVideoUrl: string;
  enhancementQuality: number;
  processedFrames: number;
  totalFrames: number;
}

export const enhanceVideo = async (
  videoUrl: string,
  settings: VideoEnhancementSettings,
  onProgress?: (progress: number) => void
): Promise<VideoEnhancementResult> => {
  return new Promise((resolve, reject) => {
    const video = document.createElement('video');
    video.src = videoUrl;
    video.crossOrigin = 'anonymous';

    video.addEventListener('loadedmetadata', async () => {
      try {
        const canvas = document.createElement('canvas');
        const ctx = canvas.getContext('2d');
        if (!ctx) {
          reject(new Error('Failed to get canvas context'));
          return;
        }

        canvas.width = video.videoWidth;
        canvas.height = video.videoHeight;

        const fps = 30; // Assume 30 fps
        const duration = video.duration;
        const totalFrames = Math.floor(duration * fps);
        let processedFrames = 0;

        // Create MediaRecorder to capture processed video
        const stream = canvas.captureStream(fps);
        const mediaRecorder = new MediaRecorder(stream, {
          mimeType: 'video/webm;codecs=vp9',
          videoBitsPerSecond: 5000000,
        });

        const chunks: Blob[] = [];

        mediaRecorder.ondataavailable = (e) => {
          if (e.data.size > 0) {
            chunks.push(e.data);
          }
        };

        mediaRecorder.onstop = () => {
          const videoBlob = new Blob(chunks, { type: 'video/webm' });
          const processedVideoUrl = URL.createObjectURL(videoBlob);
          
          resolve({
            processedVideoUrl,
            originalVideoUrl: videoUrl,
            enhancementQuality: 0.9,
            processedFrames,
            totalFrames,
          });
        };

        // Start recording
        mediaRecorder.start();
        video.play();

        // Process each frame
        const processFrame = () => {
          if (video.paused || video.ended) {
            mediaRecorder.stop();
            return;
          }

          // Draw current frame
          ctx.drawImage(video, 0, 0, canvas.width, canvas.height);

          // Get image data
          let imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
          const data = imageData.data;

          // Apply enhancements
          
          // 1. Sharpen (remove blur)
          if (settings.removeBlur && settings.sharpenAmount > 0) {
            imageData = applySharpen(imageData, settings.sharpenAmount * 2);
            ctx.putImageData(imageData, 0, 0);
            imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
          }

          // 2. Brightness
          if (settings.restoreBrightness && settings.brightnessLevel !== 0) {
            for (let i = 0; i < data.length; i += 4) {
              data[i] = clamp(data[i] + settings.brightnessLevel);
              data[i + 1] = clamp(data[i + 1] + settings.brightnessLevel);
              data[i + 2] = clamp(data[i + 2] + settings.brightnessLevel);
            }
          }

          // 3. Contrast
          if (settings.restoreContrast && settings.contrastLevel !== 0) {
            const factor = (259 * (settings.contrastLevel + 255)) / (255 * (259 - settings.contrastLevel));
            for (let i = 0; i < data.length; i += 4) {
              data[i] = clamp(factor * (data[i] - 128) + 128);
              data[i + 1] = clamp(factor * (data[i + 1] - 128) + 128);
              data[i + 2] = clamp(factor * (data[i + 2] - 128) + 128);
            }
          }

          // 4. Saturation
          if (settings.restoreSaturation && settings.saturationLevel !== 1) {
            for (let i = 0; i < data.length; i += 4) {
              const gray = 0.2989 * data[i] + 0.587 * data[i + 1] + 0.114 * data[i + 2];
              data[i] = clamp(gray + settings.saturationLevel * (data[i] - gray));
              data[i + 1] = clamp(gray + settings.saturationLevel * (data[i + 1] - gray));
              data[i + 2] = clamp(gray + settings.saturationLevel * (data[i + 2] - gray));
            }
          }

          // 5. Noise reduction
          if (settings.removeNoise && settings.noiseReduction > 0) {
            ctx.putImageData(imageData, 0, 0);
            imageData = applyNoiseReduction(
              ctx.getImageData(0, 0, canvas.width, canvas.height),
              Math.floor(settings.noiseReduction)
            );
          }

          // Put processed frame back
          ctx.putImageData(imageData, 0, 0);

          processedFrames++;
          if (onProgress) {
            onProgress((processedFrames / totalFrames) * 100);
          }

          // Process next frame
          requestAnimationFrame(processFrame);
        };

        // Start processing
        video.addEventListener('play', () => {
          processFrame();
        });

      } catch (error) {
        console.error('Error enhancing video:', error);
        reject(error);
      }
    });

    video.addEventListener('error', () => {
      reject(new Error('Failed to load video'));
    });
  });
};

function clamp(value: number): number {
  return Math.max(0, Math.min(255, value));
}

const applySharpen = (imageData: ImageData, amount: number): ImageData => {
  const data = imageData.data;
  const width = imageData.width;
  const height = imageData.height;
  const output = new ImageData(width, height);

  const kernel = [
    0, -amount, 0,
    -amount, 1 + 4 * amount, -amount,
    0, -amount, 0
  ];

  for (let y = 1; y < height - 1; y++) {
    for (let x = 1; x < width - 1; x++) {
      for (let c = 0; c < 3; c++) {
        let sum = 0;
        for (let ky = -1; ky <= 1; ky++) {
          for (let kx = -1; kx <= 1; kx++) {
            const idx = ((y + ky) * width + (x + kx)) * 4 + c;
            const kernelIdx = (ky + 1) * 3 + (kx + 1);
            sum += data[idx] * kernel[kernelIdx];
          }
        }
        const idx = (y * width + x) * 4 + c;
        output.data[idx] = clamp(sum);
      }
      output.data[(y * width + x) * 4 + 3] = 255;
    }
  }

  // Copy edges
  for (let x = 0; x < width; x++) {
    for (let c = 0; c < 4; c++) {
      output.data[x * 4 + c] = data[x * 4 + c];
      output.data[((height - 1) * width + x) * 4 + c] = data[((height - 1) * width + x) * 4 + c];
    }
  }
  for (let y = 0; y < height; y++) {
    for (let c = 0; c < 4; c++) {
      output.data[y * width * 4 + c] = data[y * width * 4 + c];
      output.data[(y * width + width - 1) * 4 + c] = data[(y * width + width - 1) * 4 + c];
    }
  }

  return output;
};

const applyNoiseReduction = (imageData: ImageData, radius: number): ImageData => {
  const data = imageData.data;
  const width = imageData.width;
  const height = imageData.height;
  const output = new ImageData(width, height);

  for (let y = 0; y < height; y++) {
    for (let x = 0; x < width; x++) {
      const rValues: number[] = [];
      const gValues: number[] = [];
      const bValues: number[] = [];

      for (let dy = -radius; dy <= radius; dy++) {
        for (let dx = -radius; dx <= radius; dx++) {
          const nx = Math.max(0, Math.min(width - 1, x + dx));
          const ny = Math.max(0, Math.min(height - 1, y + dy));
          const idx = (ny * width + nx) * 4;
          
          rValues.push(data[idx]);
          gValues.push(data[idx + 1]);
          bValues.push(data[idx + 2]);
        }
      }

      rValues.sort((a, b) => a - b);
      gValues.sort((a, b) => a - b);
      bValues.sort((a, b) => a - b);

      const mid = Math.floor(rValues.length / 2);
      const idx = (y * width + x) * 4;
      
      output.data[idx] = rValues[mid];
      output.data[idx + 1] = gValues[mid];
      output.data[idx + 2] = bValues[mid];
      output.data[idx + 3] = 255;
    }
  }

  return output;
};

export const detectVideoEffects = async (videoUrl: string): Promise<string[]> => {
  return new Promise((resolve) => {
    const video = document.createElement('video');
    video.src = videoUrl;
    video.crossOrigin = 'anonymous';

    video.addEventListener('loadedmetadata', () => {
      const canvas = document.createElement('canvas');
      const ctx = canvas.getContext('2d');
      if (!ctx) {
        resolve([]);
        return;
      }

      canvas.width = video.videoWidth;
      canvas.height = video.videoHeight;

      // Seek to middle of video
      video.currentTime = video.duration / 2;

      video.addEventListener('seeked', () => {
        ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
        const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
        const data = imageData.data;

        const effects: string[] = [];

        // Analyze frame
        let totalBrightness = 0;
        let edgeStrength = 0;

        for (let i = 0; i < data.length; i += 4) {
          totalBrightness += (data[i] + data[i + 1] + data[i + 2]) / 3;
        }

        for (let y = 1; y < canvas.height - 1; y++) {
          for (let x = 1; x < canvas.width - 1; x++) {
            const idx = (y * canvas.width + x) * 4;
            const rightIdx = (y * canvas.width + x + 1) * 4;
            const dx = Math.abs(data[idx] - data[rightIdx]);
            edgeStrength += dx;
          }
        }

        const avgBrightness = totalBrightness / (data.length / 4);
        const avgEdgeStrength = edgeStrength / (canvas.width * canvas.height);

        if (avgEdgeStrength < 20) {
          effects.push('تشويش (Blur)');
        }
        if (avgBrightness < 100) {
          effects.push('إضاءة منخفضة');
        }
        if (avgBrightness > 180) {
          effects.push('إضاءة زائدة');
        }

        resolve(effects);
      }, { once: true });
    });

    video.addEventListener('error', () => {
      resolve([]);
    });
  });
};