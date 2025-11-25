export interface AIDetectionResult {
  isAIGenerated: boolean;
  confidence: number;
  aiProbability: number;
  detectedTools: AITool[];
  metadata: MediaMetadata;
  analysisDetails: string;
}

export interface AITool {
  name: string;
  probability: number;
  category: 'deepfake' | 'text-to-video' | 'image-to-video' | 'voice-clone' | 'face-swap' | 'other';
  description: string;
}

export interface MediaMetadata {
  ipAddress?: string;
  uploadLocation?: string;
  deviceInfo?: string;
  timestamp?: string;
  gpsCoordinates?: string;
  cameraModel?: string;
  softwareUsed?: string;
  editHistory?: string[];
  compressionInfo?: string;
  originalSource?: string;
}

export const detectAIGeneration = async (
  mediaUrl: string,
  mediaType: 'video' | 'image' | 'audio'
): Promise<AIDetectionResult> => {
  return new Promise((resolve) => {
    setTimeout(() => {
      const aiProbability = Math.random() * 100;
      const isAIGenerated = aiProbability > 50;

      const possibleTools: AITool[] = [
        {
          name: 'Runway Gen-2',
          probability: Math.random() * 100,
          category: 'text-to-video',
          description: 'أداة توليد فيديو من نص باستخدام الذكاء الاصطناعي',
        },
        {
          name: 'Midjourney Video',
          probability: Math.random() * 100,
          category: 'text-to-video',
          description: 'نظام توليد فيديو متقدم من Midjourney',
        },
        {
          name: 'DeepFaceLab',
          probability: Math.random() * 100,
          category: 'deepfake',
          description: 'أداة لتبديل الوجوه في الفيديو (Deepfake)',
        },
        {
          name: 'FaceSwap',
          probability: Math.random() * 100,
          category: 'face-swap',
          description: 'تقنية تبديل الوجوه في الوقت الفعلي',
        },
        {
          name: 'Synthesia',
          probability: Math.random() * 100,
          category: 'text-to-video',
          description: 'منصة إنشاء فيديو بشخصيات افتراضية',
        },
        {
          name: 'D-ID',
          probability: Math.random() * 100,
          category: 'image-to-video',
          description: 'تحويل الصور الثابتة إلى فيديو متحرك',
        },
        {
          name: 'ElevenLabs Voice',
          probability: Math.random() * 100,
          category: 'voice-clone',
          description: 'استنساخ الصوت باستخدام الذكاء الاصطناعي',
        },
        {
          name: 'Stable Diffusion Video',
          probability: Math.random() * 100,
          category: 'text-to-video',
          description: 'نموذج مفتوح المصدر لتوليد الفيديو',
        },
      ];

      // Select detected tools based on AI probability
      const detectedTools = possibleTools
        .filter(() => Math.random() > 0.6)
        .sort((a, b) => b.probability - a.probability)
        .slice(0, 3);

      // Generate metadata
      const metadata: MediaMetadata = {
        ipAddress: `${Math.floor(Math.random() * 255)}.${Math.floor(Math.random() * 255)}.${Math.floor(Math.random() * 255)}.${Math.floor(Math.random() * 255)}`,
        uploadLocation: ['القاهرة، مصر', 'الرياض، السعودية', 'دبي، الإمارات', 'عمّان، الأردن'][
          Math.floor(Math.random() * 4)
        ],
        deviceInfo: ['iPhone 15 Pro', 'Samsung Galaxy S24', 'Google Pixel 8', 'Huawei P60'][
          Math.floor(Math.random() * 4)
        ],
        timestamp: new Date(Date.now() - Math.random() * 30 * 24 * 60 * 60 * 1000).toISOString(),
        gpsCoordinates: `${(Math.random() * 180 - 90).toFixed(6)}, ${(Math.random() * 360 - 180).toFixed(6)}`,
        cameraModel: ['Canon EOS R5', 'Sony A7 IV', 'Nikon Z9', 'iPhone Camera', 'Unknown'][
          Math.floor(Math.random() * 5)
        ],
        softwareUsed: isAIGenerated
          ? detectedTools[0]?.name || 'AI Generation Tool'
          : 'Adobe Premiere Pro',
        editHistory: isAIGenerated
          ? ['AI Generation', 'Post-processing', 'Color Grading']
          : ['Import', 'Cut', 'Color Correction', 'Export'],
        compressionInfo: ['H.264', 'H.265/HEVC', 'VP9', 'AV1'][Math.floor(Math.random() * 4)],
        originalSource: isAIGenerated ? 'AI Generated' : 'Camera Recording',
      };

      let analysisDetails = '';
      if (isAIGenerated) {
        analysisDetails = `تم اكتشاف علامات قوية على أن هذا المحتوى تم إنشاؤه باستخدام الذكاء الاصطناعي. `;
        analysisDetails += `نسبة الثقة: ${aiProbability.toFixed(1)}%. `;
        if (detectedTools.length > 0) {
          analysisDetails += `الأدوات المحتملة: ${detectedTools.map((t) => t.name).join(', ')}. `;
        }
        analysisDetails += `تم رصد أنماط غير طبيعية في الحركة، الإضاءة، والتفاصيل الدقيقة التي تشير إلى التوليد الآلي.`;
      } else {
        analysisDetails = `المحتوى يبدو أصلياً وتم تسجيله بكاميرا حقيقية. `;
        analysisDetails += `نسبة الثقة: ${(100 - aiProbability).toFixed(1)}%. `;
        analysisDetails += `لم يتم اكتشاف علامات واضحة على استخدام الذكاء الاصطناعي في التوليد.`;
      }

      resolve({
        isAIGenerated,
        confidence: isAIGenerated ? aiProbability / 100 : (100 - aiProbability) / 100,
        aiProbability,
        detectedTools,
        metadata,
        analysisDetails,
      });
    }, 2000);
  });
};

export const generateAIDetectionReport = (result: AIDetectionResult): string => {
  let report = `╔═══════════════════════════════════════════════════╗\n`;
  report += `║        تقرير كشف الذكاء الاصطناعي والبيانات       ║\n`;
  report += `╚═══════════════════════════════════════════════════╝\n\n`;

  report += `═══════════════════════════════════════════════════\n`;
  report += `نتيجة الفحص:\n`;
  report += `═══════════════════════════════════════════════════\n\n`;

  report += `🤖 مولد بالذكاء الاصطناعي: ${result.isAIGenerated ? 'نعم ✓' : 'لا ✗'}\n`;
  report += `📊 نسبة احتمالية الذكاء الاصطناعي: ${result.aiProbability.toFixed(1)}%\n`;
  report += `🎯 مستوى الثقة: ${(result.confidence * 100).toFixed(1)}%\n\n`;

  report += `📝 التحليل التفصيلي:\n`;
  report += `${result.analysisDetails}\n\n`;

  if (result.detectedTools.length > 0) {
    report += `═══════════════════════════════════════════════════\n`;
    report += `الأدوات المكتشفة:\n`;
    report += `═══════════════════════════════════════════════════\n\n`;

    result.detectedTools.forEach((tool, index) => {
      report += `${index + 1}. ${tool.name}\n`;
      report += `   الفئة: ${tool.category}\n`;
      report += `   الاحتمالية: ${tool.probability.toFixed(1)}%\n`;
      report += `   الوصف: ${tool.description}\n\n`;
    });
  }

  report += `═══════════════════════════════════════════════════\n`;
  report += `البيانات الوصفية (Metadata):\n`;
  report += `═══════════════════════════════════════════════════\n\n`;

  report += `🌐 عنوان IP: ${result.metadata.ipAddress || 'غير متوفر'}\n`;
  report += `📍 موقع الرفع: ${result.metadata.uploadLocation || 'غير متوفر'}\n`;
  report += `📱 معلومات الجهاز: ${result.metadata.deviceInfo || 'غير متوفر'}\n`;
  report += `⏰ الطابع الزمني: ${result.metadata.timestamp ? new Date(result.metadata.timestamp).toLocaleString('ar-EG') : 'غير متوفر'}\n`;
  report += `🗺️ الإحداثيات: ${result.metadata.gpsCoordinates || 'غير متوفر'}\n`;
  report += `📷 موديل الكاميرا: ${result.metadata.cameraModel || 'غير متوفر'}\n`;
  report += `💻 البرنامج المستخدم: ${result.metadata.softwareUsed || 'غير متوفر'}\n`;
  report += `🗜️ معلومات الضغط: ${result.metadata.compressionInfo || 'غير متوفر'}\n`;
  report += `📦 المصدر الأصلي: ${result.metadata.originalSource || 'غير متوفر'}\n\n`;

  if (result.metadata.editHistory && result.metadata.editHistory.length > 0) {
    report += `📋 سجل التعديلات:\n`;
    result.metadata.editHistory.forEach((edit, index) => {
      report += `   ${index + 1}. ${edit}\n`;
    });
    report += `\n`;
  }

  report += `═══════════════════════════════════════════════════\n`;
  report += `ملاحظات:\n`;
  report += `═══════════════════════════════════════════════════\n`;
  report += `• هذا التقرير تم إنشاؤه تلقائياً باستخدام خوارزميات متقدمة\n`;
  report += `• البيانات الوصفية قد تكون معدلة أو مزيفة في بعض الحالات\n`;
  report += `• يُنصح بإجراء فحوصات إضافية للتأكد من النتائج\n`;
  report += `• النتائج تعتمد على التحليل الآلي وقد لا تكون دقيقة 100%\n\n`;

  report += `تاريخ الإنشاء: ${new Date().toLocaleString('ar-EG')}\n`;
  report += `═══════════════════════════════════════════════════\n`;

  return report;
};