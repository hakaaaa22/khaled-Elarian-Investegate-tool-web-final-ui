export interface ImageEffect {
  type: 'blur' | 'brightness' | 'contrast' | 'saturation' | 'grayscale' | 'sepia' | 'sharpen' | 'noise';
  name: string;
  detected: boolean;
  intensity: number;
  description: string;
}

export interface EffectRemovalSettings {
  removeBlur: boolean;
  blurAmount: number;
  restoreBrightness: boolean;
  brightnessLevel: number;
  restoreContrast: boolean;
  contrastLevel: number;
  restoreSaturation: boolean;
  saturationLevel: number;
  removeGrayscale: boolean;
  removeSepia: boolean;
  sharpen: boolean;
  sharpenAmount: number;
  removeNoise: boolean;
  noiseReduction: number;
}

export const detectImageEffects = async (imageUrl: string): Promise<ImageEffect[]> => {
  return new Promise((resolve) => {
    const img = new Image();
    img.crossOrigin = 'anonymous';
    img.src = imageUrl;

    img.onload = () => {
      const canvas = document.createElement('canvas');
      const ctx = canvas.getContext('2d');
      if (!ctx) {
        resolve([]);
        return;
      }

      canvas.width = img.width;
      canvas.height = img.height;
      ctx.drawImage(img, 0, 0);

      const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
      const data = imageData.data;

      // Analyze image for effects
      let totalBrightness = 0;
      let totalSaturation = 0;
      let colorVariance = 0;
      let edgeStrength = 0;

      for (let i = 0; i < data.length; i += 4) {
        const r = data[i];
        const g = data[i + 1];
        const b = data[i + 2];

        // Calculate brightness
        totalBrightness += (r + g + b) / 3;

        // Calculate saturation
        const max = Math.max(r, g, b);
        const min = Math.min(r, g, b);
        const saturation = max === 0 ? 0 : (max - min) / max;
        totalSaturation += saturation;

        // Calculate color variance
        const avg = (r + g + b) / 3;
        colorVariance += Math.abs(r - avg) + Math.abs(g - avg) + Math.abs(b - avg);
      }

      // Calculate edge strength for blur detection
      for (let y = 1; y < canvas.height - 1; y++) {
        for (let x = 1; x < canvas.width - 1; x++) {
          const idx = (y * canvas.width + x) * 4;
          const rightIdx = (y * canvas.width + x + 1) * 4;
          const bottomIdx = ((y + 1) * canvas.width + x) * 4;
          
          const dx = Math.abs(data[idx] - data[rightIdx]);
          const dy = Math.abs(data[idx] - data[bottomIdx]);
          edgeStrength += dx + dy;
        }
      }

      const pixelCount = data.length / 4;
      const avgBrightness = totalBrightness / pixelCount;
      const avgSaturation = totalSaturation / pixelCount;
      const avgColorVariance = colorVariance / pixelCount;
      const avgEdgeStrength = edgeStrength / (canvas.width * canvas.height);

      const effects: ImageEffect[] = [];

      // Detect blur based on edge strength
      const blurThreshold = 30;
      if (avgEdgeStrength < blurThreshold) {
        const blurIntensity = 1 - (avgEdgeStrength / blurThreshold);
        effects.push({
          type: 'blur',
          name: 'تشويش (Blur)',
          detected: true,
          intensity: blurIntensity,
          description: `تم اكتشاف تأثير تشويش بنسبة ${(blurIntensity * 100).toFixed(0)}%`,
        });
      }

      // Detect brightness adjustment
      if (avgBrightness < 100 || avgBrightness > 180) {
        effects.push({
          type: 'brightness',
          name: 'تعديل السطوع',
          detected: true,
          intensity: Math.abs(avgBrightness - 128) / 128,
          description: avgBrightness < 128 ? 'الصورة داكنة' : 'الصورة ساطعة جداً',
        });
      }

      // Detect low saturation (grayscale-like)
      if (avgSaturation < 0.2) {
        effects.push({
          type: 'grayscale',
          name: 'أبيض وأسود',
          detected: true,
          intensity: 1 - avgSaturation / 0.2,
          description: 'الصورة قريبة من الأبيض والأسود',
        });
      }

      // Detect sepia tone
      if (avgColorVariance < 30 && avgSaturation < 0.4 && avgBrightness > 100) {
        effects.push({
          type: 'sepia',
          name: 'سيبيا (Sepia)',
          detected: true,
          intensity: 0.7,
          description: 'تم اكتشاف تأثير سيبيا كلاسيكي',
        });
      }

      // Detect high saturation
      if (avgSaturation > 0.7) {
        effects.push({
          type: 'saturation',
          name: 'تشبع لوني عالي',
          detected: true,
          intensity: avgSaturation,
          description: 'الألوان مشبعة بشكل زائد',
        });
      }

      // Detect low contrast
      if (avgColorVariance < 40) {
        effects.push({
          type: 'contrast',
          name: 'تباين منخفض',
          detected: true,
          intensity: 1 - avgColorVariance / 40,
          description: 'التباين في الصورة منخفض',
        });
      }

      // Detect noise
      let noiseCount = 0;
      for (let i = 0; i < data.length - 4; i += 4) {
        const diff = Math.abs(data[i] - data[i + 4]) + 
                    Math.abs(data[i + 1] - data[i + 5]) + 
                    Math.abs(data[i + 2] - data[i + 6]);
        if (diff > 50) noiseCount++;
      }
      const noiseLevel = noiseCount / (data.length / 4);
      if (noiseLevel > 0.1) {
        effects.push({
          type: 'noise',
          name: 'ضوضاء (Noise)',
          detected: true,
          intensity: Math.min(noiseLevel * 5, 1),
          description: 'تم اكتشاف ضوضاء رقمية في الصورة',
        });
      }

      resolve(effects);
    };

    img.onerror = () => {
      resolve([]);
    };
  });
};

export const removeImageEffects = async (
  imageUrl: string,
  settings: EffectRemovalSettings
): Promise<string> => {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.crossOrigin = 'anonymous';
    img.src = imageUrl;

    img.onload = () => {
      const canvas = document.createElement('canvas');
      const ctx = canvas.getContext('2d');
      if (!ctx) {
        resolve(imageUrl);
        return;
      }

      canvas.width = img.width;
      canvas.height = img.height;
      ctx.drawImage(img, 0, 0);

      let imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
      const data = imageData.data;

      // Apply effects in order
      
      // 1. Remove blur (sharpen)
      if (settings.removeBlur && settings.blurAmount > 0) {
        imageData = applySharpen(imageData, settings.blurAmount * 2);
        ctx.putImageData(imageData, 0, 0);
        imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
      }

      // 2. Restore brightness
      if (settings.restoreBrightness && settings.brightnessLevel !== 0) {
        for (let i = 0; i < data.length; i += 4) {
          data[i] = clamp(data[i] + settings.brightnessLevel);
          data[i + 1] = clamp(data[i + 1] + settings.brightnessLevel);
          data[i + 2] = clamp(data[i + 2] + settings.brightnessLevel);
        }
      }

      // 3. Restore contrast
      if (settings.restoreContrast && settings.contrastLevel !== 0) {
        const factor = (259 * (settings.contrastLevel + 255)) / (255 * (259 - settings.contrastLevel));
        for (let i = 0; i < data.length; i += 4) {
          data[i] = clamp(factor * (data[i] - 128) + 128);
          data[i + 1] = clamp(factor * (data[i + 1] - 128) + 128);
          data[i + 2] = clamp(factor * (data[i + 2] - 128) + 128);
        }
      }

      // 4. Restore saturation / Remove grayscale
      if ((settings.restoreSaturation || settings.removeGrayscale) && settings.saturationLevel !== 1) {
        for (let i = 0; i < data.length; i += 4) {
          const gray = 0.2989 * data[i] + 0.587 * data[i + 1] + 0.114 * data[i + 2];
          data[i] = clamp(gray + settings.saturationLevel * (data[i] - gray));
          data[i + 1] = clamp(gray + settings.saturationLevel * (data[i + 1] - gray));
          data[i + 2] = clamp(gray + settings.saturationLevel * (data[i + 2] - gray));
        }
      }

      // 5. Remove sepia
      if (settings.removeSepia) {
        for (let i = 0; i < data.length; i += 4) {
          // Reverse sepia transformation
          const r = data[i];
          const g = data[i + 1];
          const b = data[i + 2];
          
          data[i] = clamp(r * 0.95 - g * 0.05);
          data[i + 1] = clamp(g * 1.05 - r * 0.05);
          data[i + 2] = clamp(b * 1.2);
        }
      }

      // 6. Additional sharpening
      if (settings.sharpen && settings.sharpenAmount > 0) {
        ctx.putImageData(imageData, 0, 0);
        imageData = applySharpen(
          ctx.getImageData(0, 0, canvas.width, canvas.height),
          settings.sharpenAmount * 2
        );
        ctx.putImageData(imageData, 0, 0);
        imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
      }

      // 7. Remove noise
      if (settings.removeNoise && settings.noiseReduction > 0) {
        ctx.putImageData(imageData, 0, 0);
        imageData = applyNoiseReduction(
          ctx.getImageData(0, 0, canvas.width, canvas.height),
          Math.floor(settings.noiseReduction)
        );
      }

      ctx.putImageData(imageData, 0, 0);

      canvas.toBlob((blob) => {
        if (blob) {
          resolve(URL.createObjectURL(blob));
        } else {
          reject(new Error('Failed to create blob'));
        }
      }, 'image/png');
    };

    img.onerror = () => {
      reject(new Error('Failed to load image'));
    };
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

  // Sharpen kernel
  const kernel = [
    0, -amount, 0,
    -amount, 1 + 4 * amount, -amount,
    0, -amount, 0
  ];

  // Apply convolution
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

  // Median filter for noise reduction
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