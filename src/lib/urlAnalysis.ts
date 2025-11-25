export interface URLAnalysisResult {
  videoUrl: string;
  thumbnails: string[];
  extractedFrames: string[];
  detectedPersons: PersonDetection[];
  audioTracks: AudioTrackInfo[];
  metadata: VideoMetadata;
  analysisSuccess: boolean;
}

export interface PersonDetection {
  id: string;
  frameNumber: number;
  timestamp: number;
  imageUrl: string;
  confidence: number;
  boundingBox: {
    x: number;
    y: number;
    width: number;
    height: number;
  };
}

export interface AudioTrackInfo {
  id: string;
  name: string;
  duration: number;
  sampleRate: number;
  channels: number;
}

export interface VideoMetadata {
  title: string;
  duration: number;
  width: number;
  height: number;
  fps: number;
  format: string;
  uploadDate?: string;
  uploader?: string;
}

export const analyzeVideoFromURL = async (url: string): Promise<URLAnalysisResult> => {
  return new Promise((resolve, reject) => {
    // Validate URL
    try {
      new URL(url);
    } catch {
      reject(new Error('رابط غير صالح'));
      return;
    }

    // Simulate video analysis from URL
    setTimeout(() => {
      const duration = 30 + Math.random() * 120;
      const fps = 30;
      const frameCount = Math.floor(duration * fps);

      // Generate thumbnails
      const thumbnails: string[] = [];
      for (let i = 0; i < 6; i++) {
        thumbnails.push(`https://via.placeholder.com/320x180/4F46E5/FFFFFF?text=Frame+${i + 1}`);
      }

      // Generate extracted frames with detected persons
      const extractedFrames: string[] = [];
      const detectedPersons: PersonDetection[] = [];
      const personCount = Math.floor(Math.random() * 5) + 1;

      for (let i = 0; i < personCount; i++) {
        const frameNumber = Math.floor(Math.random() * frameCount);
        const timestamp = frameNumber / fps;
        const imageUrl = `https://via.placeholder.com/400x400/8B5CF6/FFFFFF?text=Person+${i + 1}`;

        extractedFrames.push(imageUrl);
        detectedPersons.push({
          id: `person-${i + 1}`,
          frameNumber,
          timestamp,
          imageUrl,
          confidence: 0.8 + Math.random() * 0.19,
          boundingBox: {
            x: Math.random() * 400,
            y: Math.random() * 300,
            width: 100 + Math.random() * 100,
            height: 150 + Math.random() * 100,
          },
        });
      }

      // Generate audio tracks info
      const audioTracks: AudioTrackInfo[] = [
        {
          id: 'audio-1',
          name: 'المسار الصوتي الرئيسي',
          duration,
          sampleRate: 48000,
          channels: 2,
        },
      ];

      const metadata: VideoMetadata = {
        title: 'فيديو من الرابط',
        duration,
        width: 1920,
        height: 1080,
        fps,
        format: 'mp4',
        uploadDate: new Date(Date.now() - Math.random() * 365 * 24 * 60 * 60 * 1000).toISOString(),
        uploader: 'مستخدم غير معروف',
      };

      resolve({
        videoUrl: url,
        thumbnails,
        extractedFrames,
        detectedPersons,
        audioTracks,
        metadata,
        analysisSuccess: true,
      });
    }, 3000);
  });
};

export const extractClearImages = async (videoUrl: string): Promise<string[]> => {
  return new Promise((resolve) => {
    setTimeout(() => {
      const images: string[] = [];
      const imageCount = Math.floor(Math.random() * 8) + 4;

      for (let i = 0; i < imageCount; i++) {
        images.push(
          `https://via.placeholder.com/800x600/6366F1/FFFFFF?text=Clear+Frame+${i + 1}`
        );
      }

      resolve(images);
    }, 2000);
  });
};

export const extractAudioFromURLVideo = async (videoUrl: string): Promise<string[]> => {
  return new Promise((resolve) => {
    setTimeout(() => {
      const audioUrls: string[] = [
        videoUrl, // Main audio
        videoUrl, // Vocals
        videoUrl, // Instrumental
      ];
      resolve(audioUrls);
    }, 2000);
  });
};