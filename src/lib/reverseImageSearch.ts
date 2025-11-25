export type SearchEngine = 'google' | 'tineye' | 'yandex' | 'bing' | 'baidu';
export type SearchQuality = 'standard' | 'high' | 'maximum';

export interface SearchOptions {
  engines: SearchEngine[];
  quality: SearchQuality;
}

export interface ReverseSearchResult {
  source: SearchEngine;
  results: SearchResultItem[];
  totalFound: number;
  searchTime: number;
}

export interface SearchResultItem {
  id: string;
  imageUrl: string;
  thumbnailUrl: string;
  sourceUrl: string;
  title: string;
  similarity: number;
  domain: string;
  uploadDate?: string;
  contentType: 'general' | 'social' | 'news' | 'adult' | 'profile' | 'other';
  dimensions?: {
    width: number;
    height: number;
  };
  fileSize?: string;
  relatedImages?: string[];
}

export interface ComprehensiveSearchResult {
  originalImage: string;
  allResults: ReverseSearchResult[];
  totalMatches: number;
  personDetected: boolean;
  adultContentFound: boolean;
  summary: string;
  searchOptions: SearchOptions;
}

// Real image URLs from various sources for demonstration
const SAMPLE_IMAGES = [
  'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=800',
  'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=800',
  'https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=800',
  'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=800',
  'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=800',
  'https://images.unsplash.com/photo-1539571696357-5a69c17a67c6?w=800',
  'https://images.unsplash.com/photo-1524504388940-b1c1722653e1?w=800',
  'https://images.unsplash.com/photo-1488426862026-3ee34a7d66df?w=800',
  'https://images.unsplash.com/photo-1517841905240-472988babdf9?w=800',
  'https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?w=800',
];

export const performReverseImageSearch = async (
  imageUrl: string,
  options: SearchOptions = {
    engines: ['google', 'tineye', 'yandex', 'bing', 'baidu'],
    quality: 'maximum'
  }
): Promise<ComprehensiveSearchResult> => {
  return new Promise((resolve) => {
    // Simulate longer search time for higher quality
    const searchTime = options.quality === 'maximum' ? 4000 : options.quality === 'high' ? 3000 : 2000;
    
    setTimeout(() => {
      const allResults: ReverseSearchResult[] = [];
      
      // Generate results for each selected engine
      options.engines.forEach((engine) => {
        const resultCount = getResultCount(engine, options.quality);
        allResults.push(generateSearchResults(engine, resultCount, options.quality));
      });

      const totalMatches = allResults.reduce((sum, result) => sum + result.totalFound, 0);

      const adultContentFound = allResults.some((result) =>
        result.results.some((item) => item.contentType === 'adult')
      );

      const personDetected = Math.random() > 0.3;

      let summary = `تم العثور على ${totalMatches} نتيجة مطابقة عبر ${options.engines.length} محرك بحث. `;
      summary += `جودة البحث: ${getQualityLabel(options.quality)}. `;
      if (personDetected) {
        summary += `تم اكتشاف شخص في الصورة. `;
      }
      if (adultContentFound) {
        summary += `⚠️ تحذير: تم العثور على محتوى للبالغين. `;
      }
      summary += `النتائج تشمل صور من مواقع التواصل الاجتماعي، المواقع الإخبارية، والمواقع الشخصية.`;

      resolve({
        originalImage: imageUrl,
        allResults,
        totalMatches,
        personDetected,
        adultContentFound,
        summary,
        searchOptions: options,
      });
    }, searchTime);
  });
};

const getResultCount = (engine: SearchEngine, quality: SearchQuality): number => {
  const baseCounts = {
    google: 20,
    tineye: 15,
    yandex: 18,
    bing: 16,
    baidu: 14,
  };

  const multiplier = quality === 'maximum' ? 1.5 : quality === 'high' ? 1.2 : 1;
  return Math.floor(baseCounts[engine] * multiplier);
};

const getQualityLabel = (quality: SearchQuality): string => {
  switch (quality) {
    case 'maximum': return 'أقصى دقة';
    case 'high': return 'دقة عالية';
    case 'standard': return 'دقة قياسية';
  }
};

const generateSearchResults = (
  source: SearchEngine,
  count: number,
  quality: SearchQuality
): ReverseSearchResult => {
  const results: SearchResultItem[] = [];
  const contentTypes: SearchResultItem['contentType'][] = [
    'general',
    'social',
    'news',
    'adult',
    'profile',
    'other',
  ];

  const domains = {
    google: ['facebook.com', 'instagram.com', 'twitter.com', 'linkedin.com', 'pinterest.com'],
    tineye: ['reddit.com', 'tumblr.com', 'flickr.com', 'imgur.com', 'deviantart.com'],
    yandex: ['vk.com', 'ok.ru', 'yandex.ru', 'mail.ru', 'livejournal.com'],
    bing: ['microsoft.com', 'msn.com', 'bing.com', 'outlook.com', 'skype.com'],
    baidu: ['baidu.com', 'weibo.com', 'qq.com', 'taobao.com', 'alibaba.com'],
  };

  const engineDomains = domains[source] || domains.google;

  for (let i = 0; i < count; i++) {
    // Higher quality = higher similarity scores
    const baseSimiliarity = quality === 'maximum' ? 75 : quality === 'high' ? 65 : 55;
    const similarity = baseSimiliarity + Math.random() * (100 - baseSimiliarity);
    const contentType = contentTypes[Math.floor(Math.random() * contentTypes.length)];
    const domain = engineDomains[Math.floor(Math.random() * engineDomains.length)];
    
    // Use real sample images
    const imageIndex = Math.floor(Math.random() * SAMPLE_IMAGES.length);
    const imageUrl = SAMPLE_IMAGES[imageIndex];
    const thumbnailUrl = imageUrl.replace('w=800', 'w=400');

    const width = 800 + Math.floor(Math.random() * 1200);
    const height = 600 + Math.floor(Math.random() * 900);
    const fileSize = `${(Math.random() * 2 + 0.5).toFixed(1)} MB`;

    results.push({
      id: `${source}-${i}`,
      imageUrl,
      thumbnailUrl,
      sourceUrl: `https://${domain}/image/${Math.random().toString(36).substring(7)}`,
      title: `${getEngineLabel(source)} - نتيجة ${i + 1}`,
      similarity,
      domain,
      uploadDate: new Date(
        Date.now() - Math.random() * 365 * 24 * 60 * 60 * 1000
      ).toISOString(),
      contentType,
      dimensions: {
        width,
        height,
      },
      fileSize,
      relatedImages: Array.from({ length: 3 }, (_, j) => {
        const relatedIndex = (imageIndex + j + 1) % SAMPLE_IMAGES.length;
        return SAMPLE_IMAGES[relatedIndex].replace('w=800', 'w=300');
      }),
    });
  }

  return {
    source,
    results: results.sort((a, b) => b.similarity - a.similarity),
    totalFound: count,
    searchTime: 1.2 + Math.random() * 2,
  };
};

const getEngineLabel = (engine: SearchEngine): string => {
  switch (engine) {
    case 'google': return 'Google';
    case 'tineye': return 'TinEye';
    case 'yandex': return 'Yandex';
    case 'bing': return 'Bing';
    case 'baidu': return 'Baidu';
  }
};

export const generateReverseSearchReport = (result: ComprehensiveSearchResult): string => {
  let report = `╔═══════════════════════════════════════════════════╗\n`;
  report += `║           تقرير البحث العكسي عن الصور            ║\n`;
  report += `╚═══════════════════════════════════════════════════╝\n\n`;

  report += `═══════════════════════════════════════════════════\n`;
  report += `ملخص النتائج:\n`;
  report += `═══════════════════════════════════════════════════\n\n`;

  report += `📊 إجمالي النتائج: ${result.totalMatches}\n`;
  report += `🔍 محركات البحث: ${result.searchOptions.engines.join(', ')}\n`;
  report += `⚡ جودة البحث: ${getQualityLabel(result.searchOptions.quality)}\n`;
  report += `👤 شخص مكتشف: ${result.personDetected ? 'نعم ✓' : 'لا ✗'}\n`;
  report += `⚠️  محتوى للبالغين: ${result.adultContentFound ? 'نعم ✓' : 'لا ✗'}\n\n`;

  report += `📝 الملخص:\n${result.summary}\n\n`;

  result.allResults.forEach((searchResult) => {
    report += `═══════════════════════════════════════════════════\n`;
    report += `نتائج ${getEngineLabel(searchResult.source)}:\n`;
    report += `═══════════════════════════════════════════════════\n\n`;

    report += `🔍 عدد النتائج: ${searchResult.totalFound}\n`;
    report += `⏱️  وقت البحث: ${searchResult.searchTime.toFixed(2)} ثانية\n\n`;

    searchResult.results.slice(0, 5).forEach((item, index) => {
      report += `${index + 1}. ${item.title}\n`;
      report += `   نسبة التشابه: ${item.similarity.toFixed(1)}%\n`;
      report += `   المصدر: ${item.domain}\n`;
      report += `   الرابط: ${item.sourceUrl}\n`;
      report += `   رابط الصورة: ${item.imageUrl}\n`;
      report += `   نوع المحتوى: ${item.contentType}\n`;
      if (item.dimensions) {
        report += `   الأبعاد: ${item.dimensions.width} × ${item.dimensions.height}\n`;
      }
      if (item.fileSize) {
        report += `   حجم الملف: ${item.fileSize}\n`;
      }
      if (item.uploadDate) {
        report += `   تاريخ النشر: ${new Date(item.uploadDate).toLocaleDateString('ar-EG')}\n`;
      }
      report += `\n`;
    });
  });

  report += `═══════════════════════════════════════════════════\n`;
  report += `ملاحظات:\n`;
  report += `═══════════════════════════════════════════════════\n`;
  report += `• تم البحث في ${result.searchOptions.engines.length} محرك بحث\n`;
  report += `• النتائج مرتبة حسب نسبة التشابه\n`;
  report += `• يُنصح بالتحقق من المصادر يدوياً\n`;
  if (result.adultContentFound) {
    report += `• ⚠️ تحذير: بعض النتائج تحتوي على محتوى للبالغين\n`;
  }
  report += `\n`;

  report += `تاريخ البحث: ${new Date().toLocaleString('ar-EG')}\n`;
  report += `═══════════════════════════════════════════════════\n`;

  return report;
};