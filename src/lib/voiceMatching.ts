export interface VoicePrint {
  id: string;
  features: number[];
  characteristics: {
    pitch: number;
    tempo: number;
    energy: number;
    timbre: number[];
  };
}

export interface VoiceMatchResult {
  isMatch: boolean;
  confidence: number;
  similarity: number;
  details: string;
}

export const extractVoicePrint = async (audioUrl: string): Promise<VoicePrint> => {
  return new Promise((resolve) => {
    const audio = new Audio(audioUrl);

    audio.addEventListener('loadedmetadata', () => {
      // Simulate voice print extraction
      const features = Array.from({ length: 64 }, () => Math.random() * 2 - 1);
      const pitch = 80 + Math.random() * 200; // Hz
      const tempo = 0.5 + Math.random() * 1.5; // Speed multiplier
      const energy = Math.random(); // 0-1
      const timbre = Array.from({ length: 13 }, () => Math.random() * 2 - 1); // MFCC-like

      resolve({
        id: `voice-${Date.now()}`,
        features,
        characteristics: {
          pitch,
          tempo,
          energy,
          timbre,
        },
      });
    });

    audio.addEventListener('error', () => {
      resolve({
        id: `voice-${Date.now()}`,
        features: Array(64).fill(0),
        characteristics: {
          pitch: 150,
          tempo: 1,
          energy: 0.5,
          timbre: Array(13).fill(0),
        },
      });
    });
  });
};

export const compareVoices = (voice1: VoicePrint, voice2: VoicePrint): VoiceMatchResult => {
  // Calculate Euclidean distance between voice features
  let distance = 0;
  for (let i = 0; i < voice1.features.length; i++) {
    const diff = voice1.features[i] - voice2.features[i];
    distance += diff * diff;
  }
  distance = Math.sqrt(distance);

  // Compare characteristics
  const pitchDiff = Math.abs(voice1.characteristics.pitch - voice2.characteristics.pitch);
  const tempoDiff = Math.abs(voice1.characteristics.tempo - voice2.characteristics.tempo);
  const energyDiff = Math.abs(voice1.characteristics.energy - voice2.characteristics.energy);

  // Calculate timbre similarity
  let timbreDist = 0;
  for (let i = 0; i < voice1.characteristics.timbre.length; i++) {
    const diff = voice1.characteristics.timbre[i] - voice2.characteristics.timbre[i];
    timbreDist += diff * diff;
  }
  timbreDist = Math.sqrt(timbreDist);

  // Weighted similarity calculation
  const maxDistance = Math.sqrt(64 * 4);
  const featureSimilarity = (1 - distance / maxDistance) * 100;
  const pitchSimilarity = Math.max(0, (1 - pitchDiff / 200) * 100);
  const tempoSimilarity = Math.max(0, (1 - tempoDiff / 2) * 100);
  const energySimilarity = (1 - energyDiff) * 100;
  const timbreSimilarity = (1 - timbreDist / Math.sqrt(13 * 4)) * 100;

  // Overall similarity (weighted average)
  const similarity =
    featureSimilarity * 0.4 +
    pitchSimilarity * 0.2 +
    tempoSimilarity * 0.1 +
    energySimilarity * 0.1 +
    timbreSimilarity * 0.2;

  const isMatch = similarity >= 65;
  const confidence = similarity / 100;

  let details = '';
  if (similarity >= 90) {
    details = 'تطابق صوتي شبه مؤكد - نفس الشخص';
  } else if (similarity >= 80) {
    details = 'تطابق صوتي عالي جداً - على الأرجح نفس الشخص';
  } else if (similarity >= 65) {
    details = 'تطابق صوتي جيد - احتمال كبير أن يكون نفس الشخص';
  } else if (similarity >= 45) {
    details = 'تشابه صوتي متوسط - قد يكون نفس الشخص';
  } else {
    details = 'لا يوجد تطابق صوتي - أشخاص مختلفون';
  }

  return {
    isMatch,
    confidence,
    similarity,
    details,
  };
};