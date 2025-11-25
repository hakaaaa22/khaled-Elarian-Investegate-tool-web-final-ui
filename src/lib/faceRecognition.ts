export interface FaceDetectionResult {
  faceCount: number;
  faces: FaceData[];
  confidence: number;
}

export interface FaceData {
  id: string;
  position: {
    x: number;
    y: number;
    width: number;
    height: number;
  };
  features: {
    gender: 'male' | 'female' | 'unknown';
    age: number;
    emotion: string;
    confidence: number;
  };
  faceprint: number[];
}

export interface FaceMatchResult {
  isMatch: boolean;
  confidence: number;
  similarity: number;
  details: string;
}

export const detectFaces = async (imageUrl: string): Promise<FaceDetectionResult> => {
  return new Promise((resolve) => {
    const img = new Image();
    img.crossOrigin = 'anonymous';
    img.src = imageUrl;

    img.onload = () => {
      // Simulate face detection
      const faceCount = Math.floor(Math.random() * 3) + 1;
      const faces: FaceData[] = [];

      for (let i = 0; i < faceCount; i++) {
        const x = Math.random() * (img.width - 200);
        const y = Math.random() * (img.height - 200);
        const width = 150 + Math.random() * 100;
        const height = 150 + Math.random() * 100;

        // Generate face features
        const gender = Math.random() > 0.5 ? 'male' : 'female';
        const age = Math.floor(Math.random() * 50) + 15;
        const emotions = ['سعيد', 'محايد', 'حزين', 'متفاجئ', 'غاضب'];
        const emotion = emotions[Math.floor(Math.random() * emotions.length)];
        const confidence = 0.75 + Math.random() * 0.24;

        // Generate faceprint (128-dimensional vector)
        const faceprint = Array.from({ length: 128 }, () => Math.random() * 2 - 1);

        faces.push({
          id: `face-${i + 1}`,
          position: { x, y, width, height },
          features: {
            gender,
            age,
            emotion,
            confidence,
          },
          faceprint,
        });
      }

      resolve({
        faceCount,
        faces,
        confidence: 0.85 + Math.random() * 0.14,
      });
    };

    img.onerror = () => {
      resolve({
        faceCount: 0,
        faces: [],
        confidence: 0,
      });
    };
  });
};

export const compareFaces = (face1: FaceData, face2: FaceData): FaceMatchResult => {
  // Calculate Euclidean distance between faceprints
  let distance = 0;
  for (let i = 0; i < face1.faceprint.length; i++) {
    const diff = face1.faceprint[i] - face2.faceprint[i];
    distance += diff * diff;
  }
  distance = Math.sqrt(distance);

  // Convert distance to similarity (0-100%)
  const maxDistance = Math.sqrt(128 * 4); // Maximum possible distance
  const similarity = Math.max(0, Math.min(100, (1 - distance / maxDistance) * 100));

  // Determine if it's a match (threshold: 70%)
  const isMatch = similarity >= 70;
  const confidence = similarity / 100;

  let details = '';
  if (similarity >= 95) {
    details = 'تطابق شبه مؤكد - نفس الشخص';
  } else if (similarity >= 85) {
    details = 'تطابق عالي جداً - على الأرجح نفس الشخص';
  } else if (similarity >= 70) {
    details = 'تطابق جيد - احتمال كبير أن يكون نفس الشخص';
  } else if (similarity >= 50) {
    details = 'تشابه متوسط - قد يكون نفس الشخص';
  } else {
    details = 'لا يوجد تطابق - أشخاص مختلفون';
  }

  return {
    isMatch,
    confidence,
    similarity,
    details,
  };
};

export const extractFacesFromVideo = async (
  videoUrl: string
): Promise<FaceDetectionResult[]> => {
  return new Promise((resolve) => {
    const video = document.createElement('video');
    video.src = videoUrl;
    video.muted = true;

    video.addEventListener('loadedmetadata', async () => {
      const canvas = document.createElement('canvas');
      const ctx = canvas.getContext('2d');
      if (!ctx) {
        resolve([]);
        return;
      }

      canvas.width = video.videoWidth;
      canvas.height = video.videoHeight;

      const results: FaceDetectionResult[] = [];
      const framesToAnalyze = 5; // Analyze 5 frames
      const interval = video.duration / framesToAnalyze;

      for (let i = 0; i < framesToAnalyze; i++) {
        video.currentTime = i * interval;
        await new Promise((res) => {
          video.addEventListener('seeked', () => res(null), { once: true });
        });

        ctx.drawImage(video, 0, 0);
        const imageUrl = canvas.toDataURL('image/jpeg');
        const result = await detectFaces(imageUrl);
        results.push(result);
      }

      resolve(results);
    });
  });
};

export const compareImageWithVideo = async (
  imageUrl: string,
  videoUrl: string
): Promise<{
  matches: Array<{ frameIndex: number; face: FaceData; matchResult: FaceMatchResult }>;
  overallConfidence: number;
}> => {
  const imageFaces = await detectFaces(imageUrl);
  const videoFrames = await extractFacesFromVideo(videoUrl);

  if (imageFaces.faces.length === 0) {
    return { matches: [], overallConfidence: 0 };
  }

  const targetFace = imageFaces.faces[0];
  const matches: Array<{ frameIndex: number; face: FaceData; matchResult: FaceMatchResult }> =
    [];

  videoFrames.forEach((frame, frameIndex) => {
    frame.faces.forEach((face) => {
      const matchResult = compareFaces(targetFace, face);
      if (matchResult.isMatch) {
        matches.push({ frameIndex, face, matchResult });
      }
    });
  });

  const overallConfidence =
    matches.length > 0
      ? matches.reduce((sum, m) => sum + m.matchResult.similarity, 0) / matches.length
      : 0;

  return { matches, overallConfidence };
};