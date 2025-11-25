// Gamma API Client
// Documentation: https://developers.gamma.app/docs/getting-started

const GAMMA_API_KEY = 'sk-gamma-TYTJXABuSxDG6mK2ST7YJkJIFVm64izoSENVlRIQ';
const GAMMA_BASE_URL = 'https://public-api.gamma.app/v1.0';

interface GammaApiError {
  error: string;
  message: string;
  statusCode: number;
}

interface GammaTheme {
  id: string;
  name: string;
  description?: string;
}

interface GammaFolder {
  id: string;
  name: string;
  created_at: string;
}

interface GammaGenerateRequest {
  text: string;
  language?: string;
  format?: 'presentation' | 'document' | 'webpage';
  theme_id?: string;
  folder_id?: string;
  title?: string;
  image_urls?: string[];
  include_header?: boolean;
  include_footer?: boolean;
}

interface GammaGenerateResponse {
  id: string;
  title: string;
  url: string;
  status: 'processing' | 'completed' | 'failed';
  created_at: string;
  updated_at: string;
}

interface GammaTemplateRequest {
  template_id: string;
  variables?: Record<string, string>;
  folder_id?: string;
  title?: string;
}

interface GammaCard {
  id: string;
  title: string;
  url: string;
  thumbnail_url?: string;
  created_at: string;
  updated_at: string;
  folder_id?: string;
}

class GammaApiClient {
  private apiKey: string;
  private baseUrl: string;

  constructor(apiKey: string = GAMMA_API_KEY, baseUrl: string = GAMMA_BASE_URL) {
    this.apiKey = apiKey;
    this.baseUrl = baseUrl;
  }

  private async request<T>(
    endpoint: string,
    options: RequestInit = {}
  ): Promise<T> {
    const url = `${this.baseUrl}${endpoint}`;
    
    const headers = {
      'X-API-KEY': this.apiKey,
      'Content-Type': 'application/json',
      ...options.headers,
    };

    try {
      const response = await fetch(url, {
        ...options,
        headers,
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw {
          error: 'API Error',
          message: errorData.message || `HTTP ${response.status}: ${response.statusText}`,
          statusCode: response.status,
        } as GammaApiError;
      }

      return await response.json();
    } catch (error) {
      if ((error as GammaApiError).statusCode) {
        throw error;
      }
      throw {
        error: 'Network Error',
        message: error instanceof Error ? error.message : 'Failed to connect to Gamma API',
        statusCode: 0,
      } as GammaApiError;
    }
  }

  /**
   * Generate a new presentation from text
   * @param request - Generation request parameters
   * @returns Generated presentation details
   */
  async generate(request: GammaGenerateRequest): Promise<GammaGenerateResponse> {
    return this.request<GammaGenerateResponse>('/generate', {
      method: 'POST',
      body: JSON.stringify(request),
    });
  }

  /**
   * Create from a template
   * @param request - Template creation request
   * @returns Created presentation details
   */
  async createFromTemplate(request: GammaTemplateRequest): Promise<GammaGenerateResponse> {
    return this.request<GammaGenerateResponse>('/templates/create', {
      method: 'POST',
      body: JSON.stringify(request),
    });
  }

  /**
   * Get available themes
   * @returns List of available themes
   */
  async getThemes(): Promise<GammaTheme[]> {
    return this.request<GammaTheme[]>('/themes');
  }

  /**
   * Get user folders
   * @returns List of user folders
   */
  async getFolders(): Promise<GammaFolder[]> {
    return this.request<GammaFolder[]>('/folders');
  }

  /**
   * Get a specific card by ID
   * @param cardId - The card ID
   * @returns Card details
   */
  async getCard(cardId: string): Promise<GammaCard> {
    return this.request<GammaCard>(`/cards/${cardId}`);
  }

  /**
   * List all cards
   * @param folderId - Optional folder ID to filter by
   * @returns List of cards
   */
  async listCards(folderId?: string): Promise<GammaCard[]> {
    const endpoint = folderId ? `/folders/${folderId}/cards` : '/cards';
    return this.request<GammaCard[]>(endpoint);
  }

  /**
   * Delete a card
   * @param cardId - The card ID to delete
   */
  async deleteCard(cardId: string): Promise<void> {
    return this.request<void>(`/cards/${cardId}`, {
      method: 'DELETE',
    });
  }

  /**
   * Share a card via email
   * @param cardId - The card ID
   * @param emails - Array of email addresses
   * @param message - Optional message to include
   */
  async shareCard(
    cardId: string,
    emails: string[],
    message?: string
  ): Promise<void> {
    return this.request<void>(`/cards/${cardId}/share`, {
      method: 'POST',
      body: JSON.stringify({ emails, message }),
    });
  }

  /**
   * Check the status of a generation job
   * @param jobId - The generation job ID
   * @returns Job status
   */
  async getGenerationStatus(jobId: string): Promise<GammaGenerateResponse> {
    return this.request<GammaGenerateResponse>(`/generate/${jobId}`);
  }

  /**
   * Poll for generation completion
   * @param jobId - The generation job ID
   * @param maxAttempts - Maximum number of polling attempts (default: 60)
   * @param interval - Polling interval in ms (default: 2000)
   * @returns Completed generation response
   */
  async waitForGeneration(
    jobId: string,
    maxAttempts: number = 60,
    interval: number = 2000
  ): Promise<GammaGenerateResponse> {
    for (let attempt = 0; attempt < maxAttempts; attempt++) {
      const status = await this.getGenerationStatus(jobId);
      
      if (status.status === 'completed') {
        return status;
      }
      
      if (status.status === 'failed') {
        throw {
          error: 'Generation Failed',
          message: 'The generation job failed',
          statusCode: 500,
        } as GammaApiError;
      }
      
      // Wait before next poll
      await new Promise(resolve => setTimeout(resolve, interval));
    }
    
    throw {
      error: 'Timeout',
      message: 'Generation timed out',
      statusCode: 408,
    } as GammaApiError;
  }
}

// Export singleton instance
export const gammaApi = new GammaApiClient();

// Export types
export type {
  GammaApiError,
  GammaTheme,
  GammaFolder,
  GammaGenerateRequest,
  GammaGenerateResponse,
  GammaTemplateRequest,
  GammaCard,
};

// Supported languages (60+ languages)
export const GAMMA_SUPPORTED_LANGUAGES = [
  { code: 'ar', name: 'العربية', nativeName: 'Arabic' },
  { code: 'en', name: 'English', nativeName: 'English' },
  { code: 'es', name: 'Español', nativeName: 'Spanish' },
  { code: 'fr', name: 'Français', nativeName: 'French' },
  { code: 'de', name: 'Deutsch', nativeName: 'German' },
  { code: 'it', name: 'Italiano', nativeName: 'Italian' },
  { code: 'pt', name: 'Português', nativeName: 'Portuguese' },
  { code: 'ru', name: 'Русский', nativeName: 'Russian' },
  { code: 'ja', name: '日本語', nativeName: 'Japanese' },
  { code: 'ko', name: '한국어', nativeName: 'Korean' },
  { code: 'zh', name: '中文', nativeName: 'Chinese' },
  { code: 'hi', name: 'हिन्दी', nativeName: 'Hindi' },
  { code: 'bn', name: 'বাংলা', nativeName: 'Bengali' },
  { code: 'pa', name: 'ਪੰਜਾਬੀ', nativeName: 'Punjabi' },
  { code: 'te', name: 'తెలుగు', nativeName: 'Telugu' },
  { code: 'mr', name: 'मराठी', nativeName: 'Marathi' },
  { code: 'ta', name: 'தமிழ்', nativeName: 'Tamil' },
  { code: 'ur', name: 'اردو', nativeName: 'Urdu' },
  { code: 'tr', name: 'Türkçe', nativeName: 'Turkish' },
  { code: 'vi', name: 'Tiếng Việt', nativeName: 'Vietnamese' },
  { code: 'pl', name: 'Polski', nativeName: 'Polish' },
  { code: 'uk', name: 'Українська', nativeName: 'Ukrainian' },
  { code: 'nl', name: 'Nederlands', nativeName: 'Dutch' },
  { code: 'ro', name: 'Română', nativeName: 'Romanian' },
  { code: 'el', name: 'Ελληνικά', nativeName: 'Greek' },
  { code: 'cs', name: 'Čeština', nativeName: 'Czech' },
  { code: 'sv', name: 'Svenska', nativeName: 'Swedish' },
  { code: 'hu', name: 'Magyar', nativeName: 'Hungarian' },
  { code: 'fi', name: 'Suomi', nativeName: 'Finnish' },
  { code: 'no', name: 'Norsk', nativeName: 'Norwegian' },
  { code: 'da', name: 'Dansk', nativeName: 'Danish' },
  { code: 'th', name: 'ไทย', nativeName: 'Thai' },
  { code: 'id', name: 'Bahasa Indonesia', nativeName: 'Indonesian' },
  { code: 'ms', name: 'Bahasa Melayu', nativeName: 'Malay' },
  { code: 'he', name: 'עברית', nativeName: 'Hebrew' },
  { code: 'fa', name: 'فارسی', nativeName: 'Persian' },
  { code: 'sw', name: 'Kiswahili', nativeName: 'Swahili' },
  { code: 'af', name: 'Afrikaans', nativeName: 'Afrikaans' },
  { code: 'sq', name: 'Shqip', nativeName: 'Albanian' },
  { code: 'am', name: 'አማርኛ', nativeName: 'Amharic' },
  { code: 'hy', name: 'Հայերեն', nativeName: 'Armenian' },
  { code: 'az', name: 'Azərbaycan', nativeName: 'Azerbaijani' },
  { code: 'eu', name: 'Euskara', nativeName: 'Basque' },
  { code: 'be', name: 'Беларуская', nativeName: 'Belarusian' },
  { code: 'bs', name: 'Bosanski', nativeName: 'Bosnian' },
  { code: 'bg', name: 'Български', nativeName: 'Bulgarian' },
  { code: 'ca', name: 'Català', nativeName: 'Catalan' },
  { code: 'hr', name: 'Hrvatski', nativeName: 'Croatian' },
  { code: 'et', name: 'Eesti', nativeName: 'Estonian' },
  { code: 'tl', name: 'Filipino', nativeName: 'Filipino' },
  { code: 'gl', name: 'Galego', nativeName: 'Galician' },
  { code: 'ka', name: 'ქართული', nativeName: 'Georgian' },
  { code: 'gu', name: 'ગુજરાતી', nativeName: 'Gujarati' },
  { code: 'is', name: 'Íslenska', nativeName: 'Icelandic' },
  { code: 'kn', name: 'ಕನ್ನಡ', nativeName: 'Kannada' },
  { code: 'kk', name: 'Қазақ', nativeName: 'Kazakh' },
  { code: 'km', name: 'ខ្មែរ', nativeName: 'Khmer' },
  { code: 'lo', name: 'ລາວ', nativeName: 'Lao' },
  { code: 'lv', name: 'Latviešu', nativeName: 'Latvian' },
  { code: 'lt', name: 'Lietuvių', nativeName: 'Lithuanian' },
  { code: 'mk', name: 'Македонски', nativeName: 'Macedonian' },
  { code: 'ml', name: 'മലയാളം', nativeName: 'Malayalam' },
  { code: 'mn', name: 'Монгол', nativeName: 'Mongolian' },
];

// Helper function to get language name
export function getLanguageName(code: string): string {
  const lang = GAMMA_SUPPORTED_LANGUAGES.find(l => l.code === code);
  return lang?.name || code;
}

// Helper function to validate text length (max 100,000 tokens ≈ 400,000 characters)
export function validateTextLength(text: string): { valid: boolean; message?: string } {
  const MAX_CHARS = 400000;
  if (text.length > MAX_CHARS) {
    return {
      valid: false,
      message: `النص طويل جداً. الحد الأقصى ${MAX_CHARS.toLocaleString()} حرف (حالياً: ${text.length.toLocaleString()})`,
    };
  }
  return { valid: true };
}