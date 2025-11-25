export interface VideoMetadata {
  name: string;
  size: number;
  type: string;
  duration: number;
  width: number;
  height: number;
  lastModified: Date;
  aspectRatio: string;
}

export interface VideoAnalysisResult {
  metadata: VideoMetadata;
  dataUrl: string;
  thumbnail?: string;
  file: File;
}

export const analyzeVideo = async (file: File): Promise<VideoAnalysisResult> => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    const video = document.createElement('video');

    reader.onload = (e) => {
      const dataUrl = e.target?.result as string;
      video.src = dataUrl;
      video.preload = 'metadata';

      video.onloadedmetadata = () => {
        const aspectRatio = calculateAspectRatio(video.videoWidth, video.videoHeight);
        
        const metadata: VideoMetadata = {
          name: file.name,
          size: file.size,
          type: file.type,
          duration: video.duration,
          width: video.videoWidth,
          height: video.videoHeight,
          lastModified: new Date(file.lastModified),
          aspectRatio,
        };

        // Generate thumbnail
        video.currentTime = Math.min(1, video.duration / 2);
      };

      video.onseeked = () => {
        const canvas = document.createElement('canvas');
        canvas.width = video.videoWidth;
        canvas.height = video.videoHeight;
        const ctx = canvas.getContext('2d');
        
        if (ctx) {
          ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
          const thumbnail = canvas.toDataURL('image/jpeg', 0.8);
          
          resolve({
            metadata: {
              name: file.name,
              size: file.size,
              type: file.type,
              duration: video.duration,
              width: video.videoWidth,
              height: video.videoHeight,
              lastModified: new Date(file.lastModified),
              aspectRatio: calculateAspectRatio(video.videoWidth, video.videoHeight),
            },
            dataUrl,
            thumbnail,
            file,
          });
        } else {
          resolve({
            metadata: {
              name: file.name,
              size: file.size,
              type: file.type,
              duration: video.duration,
              width: video.videoWidth,
              height: video.videoHeight,
              lastModified: new Date(file.lastModified),
              aspectRatio: calculateAspectRatio(video.videoWidth, video.videoHeight),
            },
            dataUrl,
            file,
          });
        }
      };

      video.onerror = () => reject(new Error('فشل تحميل الفيديو'));
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

export const formatDuration = (seconds: number): string => {
  const hours = Math.floor(seconds / 3600);
  const minutes = Math.floor((seconds % 3600) / 60);
  const secs = Math.floor(seconds % 60);

  if (hours > 0) {
    return `${hours}:${minutes.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  }
  return `${minutes}:${secs.toString().padStart(2, '0')}`;
};