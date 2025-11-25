import { gammaApi, GammaGenerateResponse, GammaTheme as GammaApiTheme, GAMMA_SUPPORTED_LANGUAGES, validateTextLength } from './gammaApi';

export interface Presentation {
  id: string;
  title: string;
  slides: Slide[];
  theme: PresentationTheme;
  createdAt: string;
  updatedAt: string;
  presentationUrl?: string; // URL to the presentation
  presentationId?: string; // Presentation card ID
}

export interface Slide {
  id: string;
  type: 'title' | 'content' | 'image' | 'table' | 'chart' | 'blank';
  title: string;
  content: string;
  images: SlideImage[];
  layout: SlideLayout;
  animation: SlideAnimation;
  notes: string;
}

export interface SlideImage {
  id: string;
  url: string;
  position: { x: number; y: number };
  size: { width: number; height: number };
  effects: ImageEffect[];
}

export interface ImageEffect {
  type: 'blur' | 'brightness' | 'contrast' | 'grayscale' | 'sepia';
  value: number;
}

export interface SlideLayout {
  backgroundColor: string;
  textColor: string;
  titleFont: string;
  contentFont: string;
  titleSize: number;
  contentSize: number;
}

export interface SlideAnimation {
  transition: 'fade' | 'slide' | 'zoom' | 'flip' | 'none';
  duration: number;
  elementAnimations: ElementAnimation[];
}

export interface ElementAnimation {
  elementId: string;
  type: 'fadeIn' | 'slideIn' | 'zoomIn' | 'bounceIn';
  delay: number;
  duration: number;
}

export interface PresentationTheme {
  name: string;
  primaryColor: string;
  secondaryColor: string;
  backgroundColor: string;
  textColor: string;
  accentColor: string;
  fontFamily: string;
  titleFont: string;
  themeId?: string; // Theme ID if available
}

export const themes: PresentationTheme[] = [
  {
    name: 'Professional Blue',
    primaryColor: '#1E40AF',
    secondaryColor: '#3B82F6',
    backgroundColor: '#FFFFFF',
    textColor: '#1F2937',
    accentColor: '#60A5FA',
    fontFamily: 'Arial, sans-serif',
    titleFont: 'Georgia, serif',
  },
  {
    name: 'Modern Dark',
    primaryColor: '#7C3AED',
    secondaryColor: '#A78BFA',
    backgroundColor: '#111827',
    textColor: '#F9FAFB',
    accentColor: '#C4B5FD',
    fontFamily: 'Helvetica, sans-serif',
    titleFont: 'Impact, sans-serif',
  },
  {
    name: 'Elegant Green',
    primaryColor: '#059669',
    secondaryColor: '#10B981',
    backgroundColor: '#F0FDF4',
    textColor: '#064E3B',
    accentColor: '#6EE7B7',
    fontFamily: 'Verdana, sans-serif',
    titleFont: 'Palatino, serif',
  },
  {
    name: 'Corporate Red',
    primaryColor: '#DC2626',
    secondaryColor: '#EF4444',
    backgroundColor: '#FFFFFF',
    textColor: '#1F2937',
    accentColor: '#FCA5A5',
    fontFamily: 'Tahoma, sans-serif',
    titleFont: 'Times New Roman, serif',
  },
  {
    name: 'Creative Orange',
    primaryColor: '#EA580C',
    secondaryColor: '#F97316',
    backgroundColor: '#FFF7ED',
    textColor: '#431407',
    accentColor: '#FDBA74',
    fontFamily: 'Comic Sans MS, cursive',
    titleFont: 'Brush Script MT, cursive',
  },
];

export const createNewPresentation = (title: string, theme: PresentationTheme): Presentation => {
  const now = new Date().toISOString();
  return {
    id: `pres-${Date.now()}`,
    title,
    slides: [
      {
        id: `slide-1`,
        type: 'title',
        title: title,
        content: 'عرض تقديمي جديد',
        images: [],
        layout: {
          backgroundColor: theme.backgroundColor,
          textColor: theme.textColor,
          titleFont: theme.titleFont,
          contentFont: theme.fontFamily,
          titleSize: 48,
          contentSize: 24,
        },
        animation: {
          transition: 'fade',
          duration: 0.5,
          elementAnimations: [],
        },
        notes: '',
      },
    ],
    theme,
    createdAt: now,
    updatedAt: now,
  };
};

export const addSlide = (
  presentation: Presentation,
  type: Slide['type'],
  afterIndex?: number
): Presentation => {
  const newSlide: Slide = {
    id: `slide-${Date.now()}`,
    type,
    title: 'عنوان الشريحة',
    content: 'محتوى الشريحة',
    images: [],
    layout: {
      backgroundColor: presentation.theme.backgroundColor,
      textColor: presentation.theme.textColor,
      titleFont: presentation.theme.titleFont,
      contentFont: presentation.theme.fontFamily,
      titleSize: 36,
      contentSize: 18,
    },
    animation: {
      transition: 'slide',
      duration: 0.5,
      elementAnimations: [],
    },
    notes: '',
  };

  const slides = [...presentation.slides];
  const insertIndex = afterIndex !== undefined ? afterIndex + 1 : slides.length;
  slides.splice(insertIndex, 0, newSlide);

  return {
    ...presentation,
    slides,
    updatedAt: new Date().toISOString(),
  };
};

export const applyTheme = (presentation: Presentation, theme: PresentationTheme): Presentation => {
  const updatedSlides = presentation.slides.map((slide) => ({
    ...slide,
    layout: {
      ...slide.layout,
      backgroundColor: theme.backgroundColor,
      textColor: theme.textColor,
      titleFont: theme.titleFont,
      contentFont: theme.fontFamily,
    },
  }));

  return {
    ...presentation,
    theme,
    slides: updatedSlides,
    updatedAt: new Date().toISOString(),
  };
};

/**
 * Generate AI content using API
 * @param topic - The topic or prompt for generation
 * @param options - Additional generation options
 * @returns Generated presentation
 */
export const generateAIContent = async (
  topic: string,
  options?: {
    language?: string;
    format?: 'presentation' | 'document' | 'webpage';
    themeId?: string;
    imageUrls?: string[];
  }
): Promise<{ presentation: Presentation; gammaResponse: GammaGenerateResponse }> => {
  // Validate text length
  const validation = validateTextLength(topic);
  if (!validation.valid) {
    throw new Error(validation.message);
  }

  try {
    // Generate using API
    const response = await gammaApi.generate({
      text: topic,
      language: options?.language || 'ar',
      format: options?.format || 'presentation',
      theme_id: options?.themeId,
      title: topic,
      image_urls: options?.imageUrls,
      include_header: true,
      include_footer: true,
    });

    // Wait for generation to complete
    const completed = await gammaApi.waitForGeneration(response.id);

    // Create local presentation object
    const presentation = createNewPresentation(completed.title, themes[0]);
    presentation.presentationUrl = completed.url;
    presentation.presentationId = completed.id;

    // Add generated slides (simplified representation)
    presentation.slides = [
      {
        id: `slide-1`,
        type: 'title',
        title: completed.title,
        content: 'تم إنشاء هذا العرض بالذكاء الاصطناعي',
        images: [],
        layout: presentation.slides[0].layout,
        animation: presentation.slides[0].animation,
        notes: `تم الإنشاء في: ${new Date(completed.created_at).toLocaleString('ar')}`,
      },
      {
        id: `slide-2`,
        type: 'content',
        title: 'عرض تم إنشاؤه تلقائياً',
        content: `✨ تم إنشاء هذا العرض التقديمي بالذكاء الاصطناعي\n\n🔗 رابط العرض الكامل:\n${completed.url}\n\nيمكنك فتح الرابط لعرض المحتوى الكامل والتفاعل معه.`,
        images: [],
        layout: presentation.slides[0].layout,
        animation: { transition: 'slide', duration: 0.5, elementAnimations: [] },
        notes: 'افتح الرابط لعرض المحتوى الكامل',
      },
    ];

    return { presentation, gammaResponse: completed };
  } catch (error: unknown) {
    console.error('API Error:', error);
    
    // Fallback to local generation if API fails
    const fallbackSlides: Slide[] = [
      {
        id: `slide-ai-1`,
        type: 'title',
        title: topic,
        content: 'عرض تقديمي تم إنشاؤه محلياً',
        images: [],
        layout: {
          backgroundColor: '#FFFFFF',
          textColor: '#1F2937',
          titleFont: 'Georgia, serif',
          contentFont: 'Arial, sans-serif',
          titleSize: 48,
          contentSize: 24,
        },
        animation: {
          transition: 'fade',
          duration: 0.5,
          elementAnimations: [],
        },
        notes: 'شريحة العنوان',
      },
      {
        id: `slide-ai-2`,
        type: 'content',
        title: 'المقدمة',
        content: `• نظرة عامة على ${topic}\n• أهمية الموضوع\n• الأهداف الرئيسية`,
        images: [],
        layout: {
          backgroundColor: '#FFFFFF',
          textColor: '#1F2937',
          titleFont: 'Georgia, serif',
          contentFont: 'Arial, sans-serif',
          titleSize: 36,
          contentSize: 18,
        },
        animation: {
          transition: 'slide',
          duration: 0.5,
          elementAnimations: [],
        },
        notes: 'شريحة المقدمة',
      },
      {
        id: `slide-ai-3`,
        type: 'content',
        title: 'النقاط الرئيسية',
        content: `• النقطة الأولى\n• النقطة الثانية\n• النقطة الثالثة\n• النقطة الرابعة`,
        images: [],
        layout: {
          backgroundColor: '#FFFFFF',
          textColor: '#1F2937',
          titleFont: 'Georgia, serif',
          contentFont: 'Arial, sans-serif',
          titleSize: 36,
          contentSize: 18,
        },
        animation: {
          transition: 'slide',
          duration: 0.5,
          elementAnimations: [],
        },
        notes: 'النقاط الرئيسية',
      },
    ];

    const presentation = createNewPresentation(topic, themes[0]);
    presentation.slides = fallbackSlides;
    
    throw error; // Re-throw to let the caller handle it
  }
};

/**
 * Load available themes
 * @returns Array of available themes
 */
export const loadAvailableThemes = async (): Promise<GammaApiTheme[]> => {
  try {
    return await gammaApi.getThemes();
  } catch (error) {
    console.error('Failed to load themes:', error);
    return [];
  }
};

/**
 * Translate presentation (fallback to local simulation if API not available)
 */
export const translatePresentation = async (
  presentation: Presentation,
  targetLanguage: string
): Promise<Presentation> => {
  // For now, use local translation simulation
  // In future, could use API to regenerate in different language
  return new Promise((resolve) => {
    setTimeout(() => {
      const translatedSlides = presentation.slides.map((slide) => ({
        ...slide,
        title: `[${targetLanguage}] ${slide.title}`,
        content: `[${targetLanguage}] ${slide.content}`,
        notes: `[${targetLanguage}] ${slide.notes}`,
      }));

      resolve({
        ...presentation,
        slides: translatedSlides,
        updatedAt: new Date().toISOString(),
      });
    }, 2000);
  });
};

export const checkSpelling = (text: string): { text: string; corrections: number } => {
  // Simulate spelling correction
  const corrections = Math.floor(Math.random() * 3);
  return {
    text: text,
    corrections,
  };
};

export const exportToPowerPoint = async (presentation: Presentation): Promise<Blob> => {
  return new Promise((resolve) => {
    setTimeout(() => {
      const blob = new Blob(['PowerPoint content'], { type: 'application/vnd.openxmlformats-officedocument.presentationml.presentation' });
      resolve(blob);
    }, 1500);
  });
};

export const exportToPDF = async (presentation: Presentation): Promise<Blob> => {
  return new Promise((resolve) => {
    setTimeout(() => {
      const blob = new Blob(['PDF content'], { type: 'application/pdf' });
      resolve(blob);
    }, 1500);
  });
};

export const exportToHTML = async (presentation: Presentation): Promise<string> => {
  const html = `<!DOCTYPE html>
<html lang="ar" dir="rtl">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${presentation.title}</title>
  <style>
    * { margin: 0; padding: 0; box-sizing: border-box; }
    body { font-family: ${presentation.theme.fontFamily}; background: #000; }
    .slide {
      width: 100vw;
      height: 100vh;
      display: flex;
      flex-direction: column;
      justify-content: center;
      align-items: center;
      padding: 4rem;
      background: ${presentation.theme.backgroundColor};
      color: ${presentation.theme.textColor};
    }
    .slide h1 {
      font-family: ${presentation.theme.titleFont};
      font-size: 3rem;
      margin-bottom: 2rem;
      color: ${presentation.theme.primaryColor};
    }
    .slide p {
      font-size: 1.5rem;
      line-height: 1.8;
      white-space: pre-line;
    }
    .controls {
      position: fixed;
      bottom: 2rem;
      right: 2rem;
      display: flex;
      gap: 1rem;
    }
    button {
      padding: 1rem 2rem;
      font-size: 1rem;
      background: ${presentation.theme.primaryColor};
      color: white;
      border: none;
      border-radius: 0.5rem;
      cursor: pointer;
    }
    .link {
      position: fixed;
      top: 2rem;
      right: 2rem;
      padding: 1rem 2rem;
      background: ${presentation.theme.primaryColor};
      color: white;
      text-decoration: none;
      border-radius: 0.5rem;
      font-weight: bold;
    }
  </style>
</head>
<body>
  ${presentation.presentationUrl ? `<a href="${presentation.presentationUrl}" target="_blank" class="link">🔗 فتح العرض الكامل</a>` : ''}
  ${presentation.slides
    .map(
      (slide, index) => `
  <div class="slide" id="slide-${index}" style="display: ${index === 0 ? 'flex' : 'none'}">
    <h1>${slide.title}</h1>
    <p>${slide.content}</p>
  </div>
  `
    )
    .join('')}
  <div class="controls">
    <button onclick="prevSlide()">السابق</button>
    <button onclick="nextSlide()">التالي</button>
  </div>
  <script>
    let currentSlide = 0;
    const slides = document.querySelectorAll('.slide');
    function showSlide(n) {
      slides.forEach(s => s.style.display = 'none');
      currentSlide = (n + slides.length) % slides.length;
      slides[currentSlide].style.display = 'flex';
    }
    function nextSlide() { showSlide(currentSlide + 1); }
    function prevSlide() { showSlide(currentSlide - 1); }
    document.addEventListener('keydown', e => {
      if (e.key === 'ArrowRight') nextSlide();
      if (e.key === 'ArrowLeft') prevSlide();
    });
  </script>
</body>
</html>`;

  return Promise.resolve(html);
};

export const supportedLanguages = GAMMA_SUPPORTED_LANGUAGES;