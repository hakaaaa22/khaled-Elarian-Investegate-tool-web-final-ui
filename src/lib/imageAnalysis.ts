export interface ImageMetadata {
  name: string;
  size: number;
  type: string;
  width: number;
  height: number;
  lastModified: Date;
  aspectRatio: string;
  dominantColors?: string[];
}

export interface ImageAnalysisResult {
  metadata: ImageMetadata;
  dataUrl: string;
  file: File;
}

export const analyzeImage = async (file: File): Promise<ImageAnalysisResult> => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    const img = new Image();

    reader.onload = (e) => {
      const dataUrl = e.target?.result as string;
      img.src = dataUrl;

      img.onload = () => {
        const aspectRatio = calculateAspectRatio(img.width, img.height);
        
        const metadata: ImageMetadata = {
          name: file.name,
          size: file.size,
          type: file.type,
          width: img.width,
          height: img.height,
          lastModified: new Date(file.lastModified),
          aspectRatio,
        };

        resolve({
          metadata,
          dataUrl,
          file,
        });
      };

      img.onerror = () => reject(new Error('فشل تحميل الصورة'));
    };

    reader.onerror = () => reject(new Error('فشل قراءة الملف'));
    reader.readAsDataURL(file);
  });
};

const calculateAspectRatio = (width: number, height: number): string => {
  const gcd = (a: number, b: number): number => (b === 0 ? a : gcd(b, a % b));
  const divisor = gcd(width, height);
  return `${width / divisor}:${height / divisor}`;
};

export const formatFileSize = (bytes: number): string => {
  if (bytes === 0) return '0 بايت';
  const k = 1024;
  const sizes = ['بايت', 'كيلوبايت', 'ميجابايت', 'جيجابايت'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return Math.round(bytes / Math.pow(k, i) * 100) / 100 + ' ' + sizes[i];
};

export const extractDominantColors = async (imageUrl: string): Promise<string[]> => {
  return new Promise((resolve) => {
    const img = new Image();
    img.crossOrigin = 'Anonymous';
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
      const pixels = imageData.data;
      const colorMap = new Map<string, number>();

      for (let i = 0; i < pixels.length; i += 4) {
        const r = Math.round(pixels[i] / 10) * 10;
        const g = Math.round(pixels[i + 1] / 10) * 10;
        const b = Math.round(pixels[i + 2] / 10) * 10;
        const color = `rgb(${r}, ${g}, ${b})`;
        colorMap.set(color, (colorMap.get(color) || 0) + 1);
      }

      const sortedColors = Array.from(colorMap.entries())
        .sort((a, b) => b[1] - a[1])
        .slice(0, 5)
        .map(([color]) => color);

      resolve(sortedColors);
    };

    img.onerror = () => resolve([]);
  });
};