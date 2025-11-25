import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Separator } from '@/components/ui/separator';
import { Badge } from '@/components/ui/badge';
import {
  Presentation,
  Slide,
  PresentationTheme,
  themes,
  createNewPresentation,
  addSlide,
  applyTheme,
  translatePresentation,
  checkSpelling,
  generateAIContent,
  exportToPowerPoint,
  exportToPDF,
  exportToHTML,
  supportedLanguages,
  loadAvailableThemes,
} from '@/lib/presentationStudio';
import { GammaTheme as ApiTheme, GammaApiError } from '@/lib/gammaApi';
import {
  Presentation as PresentationIcon,
  Plus,
  Download,
  Play,
  Wand2,
  Languages,
  Palette,
  FileText,
  Image as ImageIcon,
  Trash2,
  Copy,
  ChevronLeft,
  ChevronRight,
  Sparkles,
  Upload,
  Save,
  Eye,
  Settings,
  Loader2,
  ExternalLink,
  Globe,
  Zap,
  AlertCircle,
} from 'lucide-react';
import { toast } from 'sonner';

export default function PresentationStudio() {
  const [presentation, setPresentation] = useState<Presentation | null>(null);
  const [currentSlideIndex, setCurrentSlideIndex] = useState(0);
  const [isPreviewMode, setIsPreviewMode] = useState(false);
  const [isGenerating, setIsGenerating] = useState(false);
  const [showThemeSelector, setShowThemeSelector] = useState(false);
  const [availableThemes, setAvailableThemes] = useState<ApiTheme[]>([]);
  const [selectedLanguage, setSelectedLanguage] = useState('ar');
  const [selectedFormat, setSelectedFormat] = useState<'presentation' | 'document' | 'webpage'>('presentation');
  const [generationProgress, setGenerationProgress] = useState('');

  // Load themes on mount
  useEffect(() => {
    loadAvailableThemes().then(setAvailableThemes).catch(console.error);
  }, []);

  const handleCreateNew = () => {
    const newPres = createNewPresentation('عرض تقديمي جديد', themes[0]);
    setPresentation(newPres);
    setCurrentSlideIndex(0);
    toast.success('تم إنشاء عرض تقديمي جديد');
  };

  const handleAddSlide = (type: Slide['type']) => {
    if (!presentation) return;
    const updated = addSlide(presentation, type, currentSlideIndex);
    setPresentation(updated);
    setCurrentSlideIndex(currentSlideIndex + 1);
    toast.success('تم إضافة شريحة جديدة');
  };

  const handleDeleteSlide = (index: number) => {
    if (!presentation || presentation.slides.length <= 1) {
      toast.error('لا يمكن حذف الشريحة الوحيدة');
      return;
    }
    const slides = presentation.slides.filter((_, i) => i !== index);
    setPresentation({ ...presentation, slides });
    setCurrentSlideIndex(Math.max(0, currentSlideIndex - 1));
    toast.success('تم حذف الشريحة');
  };

  const handleUpdateSlide = (index: number, updates: Partial<Slide>) => {
    if (!presentation) return;
    const slides = [...presentation.slides];
    slides[index] = { ...slides[index], ...updates };
    setPresentation({ ...presentation, slides });
  };

  const handleApplyTheme = (theme: PresentationTheme) => {
    if (!presentation) return;
    const updated = applyTheme(presentation, theme);
    setPresentation(updated);
    setShowThemeSelector(false);
    toast.success(`تم تطبيق تصميم ${theme.name}`);
  };

  const handleTranslate = async (languageCode: string) => {
    if (!presentation) return;
    setIsGenerating(true);
    try {
      const translated = await translatePresentation(presentation, languageCode);
      setPresentation(translated);
      const language = supportedLanguages.find((l) => l.code === languageCode);
      toast.success(`تم الترجمة إلى ${language?.name}`);
    } catch (error) {
      toast.error('حدث خطأ أثناء الترجمة');
    } finally {
      setIsGenerating(false);
    }
  };

  const handleCheckSpelling = () => {
    if (!presentation) return;
    const currentSlide = presentation.slides[currentSlideIndex];
    const titleResult = checkSpelling(currentSlide.title);
    const contentResult = checkSpelling(currentSlide.content);
    const totalCorrections = titleResult.corrections + contentResult.corrections;

    if (totalCorrections > 0) {
      toast.success(`تم تصحيح ${totalCorrections} خطأ إملائي`);
    } else {
      toast.success('لا توجد أخطاء إملائية');
    }
  };

  const handleGenerateAI = async (topic: string) => {
    if (!topic.trim()) {
      toast.error('يرجى إدخال موضوع');
      return;
    }

    setIsGenerating(true);
    setGenerationProgress('جاري الإنشاء...');

    try {
      setGenerationProgress('جاري إنشاء العرض التقديمي...');
      
      const { presentation: newPres } = await generateAIContent(topic, {
        language: selectedLanguage,
        format: selectedFormat,
      });

      setPresentation(newPres);
      setCurrentSlideIndex(0);
      
      toast.success('✨ تم إنشاء العرض التقديمي بنجاح!');
    } catch (error) {
      const apiError = error as GammaApiError;
      console.error('Generation error:', apiError);
      
      if (apiError.statusCode === 401) {
        toast.error('خطأ في المصادقة');
      } else if (apiError.statusCode === 429) {
        toast.error('تم تجاوز الحد المسموح - يرجى المحاولة لاحقاً');
      } else if (apiError.statusCode === 0) {
        toast.error('خطأ في الاتصال بالشبكة');
      } else {
        toast.error('حدث خطأ أثناء الإنشاء');
      }
    } finally {
      setIsGenerating(false);
      setGenerationProgress('');
    }
  };

  const handleExport = async (format: 'pptx' | 'pdf' | 'html') => {
    if (!presentation) return;
    setIsGenerating(true);

    try {
      if (format === 'pptx') {
        const blob = await exportToPowerPoint(presentation);
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `${presentation.title}.pptx`;
        a.click();
        toast.success('تم تصدير PowerPoint');
      } else if (format === 'pdf') {
        const blob = await exportToPDF(presentation);
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `${presentation.title}.pdf`;
        a.click();
        toast.success('تم تصدير PDF');
      } else if (format === 'html') {
        const html = await exportToHTML(presentation);
        const blob = new Blob([html], { type: 'text/html' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `${presentation.title}.html`;
        a.click();
        toast.success('تم تصدير HTML');
      }
    } catch (error) {
      toast.error('حدث خطأ أثناء التصدير');
    } finally {
      setIsGenerating(false);
    }
  };

  const currentSlide = presentation?.slides[currentSlideIndex];

  if (!presentation) {
    return (
      <div className="space-y-6">
        <Card className="border-2 border-pink-200 bg-gradient-to-br from-pink-50 to-rose-50">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-2xl">
              <PresentationIcon className="w-6 h-6 text-pink-600" />
              استوديو العروض التقديمية
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="text-center space-y-6">
              <div className="space-y-4">
                <h3 className="text-xl font-bold">ابدأ عرضك التقديمي</h3>
                <div className="grid md:grid-cols-2 gap-4 max-w-2xl mx-auto">
                  <Button
                    onClick={handleCreateNew}
                    size="lg"
                    className="h-32 flex-col gap-3 bg-pink-600 hover:bg-pink-700"
                  >
                    <Plus className="w-8 h-8" />
                    <div>
                      <p className="font-bold">إنشاء جديد</p>
                      <p className="text-xs opacity-80">ابدأ من الصفر</p>
                    </div>
                  </Button>

                  <label className="cursor-pointer">
                    <input type="file" accept=".pptx,.pdf" className="hidden" />
                    <div className="h-32 flex flex-col items-center justify-center gap-3 rounded-lg border-2 border-dashed border-pink-300 hover:border-pink-500 hover:bg-pink-50 transition-colors">
                      <Upload className="w-8 h-8 text-pink-600" />
                      <div>
                        <p className="font-bold text-pink-900">رفع ملف</p>
                        <p className="text-xs text-pink-700">PowerPoint أو PDF</p>
                      </div>
                    </div>
                  </label>
                </div>
              </div>

              <Separator />

              <div className="space-y-4">
                <h3 className="text-xl font-bold flex items-center justify-center gap-2">
                  <Sparkles className="w-6 h-6 text-pink-600" />
                  إنشاء بالذكاء الاصطناعي
                </h3>
                
                <div className="max-w-2xl mx-auto space-y-4">
                  {/* Language and Format Selection */}
                  <div className="grid grid-cols-2 gap-3">
                    <div className="space-y-2">
                      <Label className="text-sm flex items-center gap-2">
                        <Globe className="w-4 h-4" />
                        اللغة
                      </Label>
                      <Select value={selectedLanguage} onValueChange={setSelectedLanguage}>
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent className="max-h-60">
                          {supportedLanguages.map((lang) => (
                            <SelectItem key={lang.code} value={lang.code}>
                              {lang.name}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>

                    <div className="space-y-2">
                      <Label className="text-sm flex items-center gap-2">
                        <FileText className="w-4 h-4" />
                        النوع
                      </Label>
                      <Select value={selectedFormat} onValueChange={(v) => setSelectedFormat(v as 'presentation' | 'document' | 'webpage')}>
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="presentation">عرض تقديمي</SelectItem>
                          <SelectItem value="document">مستند</SelectItem>
                          <SelectItem value="webpage">صفحة ويب</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Textarea
                      placeholder="أدخل موضوع العرض التقديمي أو وصف مفصل..."
                      id="ai-topic"
                      rows={4}
                      className="resize-none"
                    />
                    <p className="text-xs text-muted-foreground text-right">
                      💡 نصيحة: كلما كان الوصف أكثر تفصيلاً، كانت النتائج أفضل
                    </p>
                  </div>

                  <Button
                    onClick={() => {
                      const input = document.getElementById('ai-topic') as HTMLTextAreaElement;
                      handleGenerateAI(input.value.trim());
                    }}
                    disabled={isGenerating}
                    className="w-full bg-gradient-to-r from-pink-600 to-purple-600 hover:from-pink-700 hover:to-purple-700"
                    size="lg"
                  >
                    {isGenerating ? (
                      <>
                        <Loader2 className="w-5 h-5 mr-2 animate-spin" />
                        {generationProgress || 'جاري الإنشاء...'}
                      </>
                    ) : (
                      <>
                        <Sparkles className="w-5 h-5 mr-2" />
                        إنشاء تلقائي
                      </>
                    )}
                  </Button>

                  {/* Info Box */}
                  <div className="p-4 bg-blue-50 border-2 border-blue-200 rounded-lg text-sm text-right space-y-2">
                    <div className="flex items-start gap-2">
                      <AlertCircle className="w-4 h-4 text-blue-600 mt-0.5 flex-shrink-0" />
                      <div className="space-y-1">
                        <p className="font-semibold text-blue-900">ميزات الإنشاء التلقائي:</p>
                        <ul className="text-blue-800 space-y-1 mr-4">
                          <li>• دعم أكثر من 60 لغة</li>
                          <li>• إنشاء تلقائي للمحتوى والتصميم</li>
                          <li>• تنسيق احترافي فوري</li>
                          <li>• إضافة صور ورسومات تلقائية</li>
                        </ul>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (isPreviewMode) {
    return (
      <div className="fixed inset-0 bg-black z-50 flex flex-col">
        <div className="flex items-center justify-between p-4 bg-gray-900 text-white">
          <h2 className="text-xl font-bold">{presentation.title}</h2>
          <div className="flex items-center gap-4">
            <span className="text-sm">
              {currentSlideIndex + 1} / {presentation.slides.length}
            </span>
            <Button
              onClick={() => setIsPreviewMode(false)}
              variant="ghost"
              className="text-white hover:bg-gray-800"
            >
              إغلاق المعاينة
            </Button>
          </div>
        </div>

        <div className="flex-1 flex items-center justify-center p-8">
          <div
            className="w-full max-w-5xl aspect-video rounded-lg shadow-2xl flex flex-col items-center justify-center p-12"
            style={{
              backgroundColor: currentSlide?.layout.backgroundColor,
              color: currentSlide?.layout.textColor,
            }}
          >
            <h1
              className="text-5xl font-bold mb-8 text-center"
              style={{
                fontFamily: currentSlide?.layout.titleFont,
                color: presentation.theme.primaryColor,
              }}
            >
              {currentSlide?.title}
            </h1>
            <p
              className="text-2xl text-center whitespace-pre-line"
              style={{ fontFamily: currentSlide?.layout.contentFont }}
            >
              {currentSlide?.content}
            </p>
          </div>
        </div>

        <div className="flex items-center justify-center gap-4 p-4 bg-gray-900">
          <Button
            onClick={() => setCurrentSlideIndex(Math.max(0, currentSlideIndex - 1))}
            disabled={currentSlideIndex === 0}
            variant="ghost"
            className="text-white"
          >
            <ChevronRight className="w-6 h-6" />
          </Button>
          <Button
            onClick={() =>
              setCurrentSlideIndex(
                Math.min(presentation.slides.length - 1, currentSlideIndex + 1)
              )
            }
            disabled={currentSlideIndex === presentation.slides.length - 1}
            variant="ghost"
            className="text-white"
          >
            <ChevronLeft className="w-6 h-6" />
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <Card className="border-2 border-pink-200 bg-gradient-to-br from-pink-50 to-rose-50">
        <CardHeader>
          <div className="flex items-center justify-between">
            <div className="space-y-2">
              <CardTitle className="flex items-center gap-2 text-2xl">
                <PresentationIcon className="w-6 h-6 text-pink-600" />
                {presentation.title}
              </CardTitle>
            </div>
            <div className="flex items-center gap-2">
              <Button onClick={() => setIsPreviewMode(true)} variant="outline" size="sm">
                <Eye className="w-4 h-4 mr-2" />
                معاينة
              </Button>
              <Button onClick={() => setShowThemeSelector(!showThemeSelector)} variant="outline" size="sm">
                <Palette className="w-4 h-4 mr-2" />
                التصميم
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent className="space-y-6">
          {showThemeSelector && (
            <Card className="border-2 bg-white">
              <CardHeader>
                <CardTitle className="text-lg">اختر التصميم</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
                  {themes.map((theme) => (
                    <div
                      key={theme.name}
                      onClick={() => handleApplyTheme(theme)}
                      className="cursor-pointer p-4 rounded-lg border-2 hover:border-pink-500 transition-colors"
                      style={{
                        backgroundColor: theme.backgroundColor,
                        borderColor: theme.primaryColor,
                      }}
                    >
                      <div className="space-y-2">
                        <div
                          className="h-16 rounded flex items-center justify-center font-bold"
                          style={{
                            backgroundColor: theme.primaryColor,
                            color: theme.backgroundColor,
                          }}
                        >
                          Aa
                        </div>
                        <p className="text-xs text-center font-medium" style={{ color: theme.textColor }}>
                          {theme.name}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}

          <div className="grid md:grid-cols-4 gap-6">
            {/* Slides Panel */}
            <div className="md:col-span-1 space-y-3">
              <div className="flex items-center justify-between">
                <h3 className="font-bold">الشرائح ({presentation.slides.length})</h3>
                <Button
                  onClick={() => handleAddSlide('content')}
                  size="sm"
                  variant="outline"
                >
                  <Plus className="w-4 h-4" />
                </Button>
              </div>

              <div className="space-y-2 max-h-[600px] overflow-y-auto">
                {presentation.slides.map((slide, index) => (
                  <div
                    key={slide.id}
                    onClick={() => setCurrentSlideIndex(index)}
                    className={`p-3 rounded-lg border-2 cursor-pointer transition-all ${
                      index === currentSlideIndex
                        ? 'border-pink-500 bg-pink-50'
                        : 'border-gray-200 hover:border-pink-300'
                    }`}
                  >
                    <div className="flex items-start justify-between gap-2">
                      <div className="flex-1 min-w-0">
                        <p className="text-xs text-muted-foreground">شريحة {index + 1}</p>
                        <p className="text-sm font-medium truncate">{slide.title}</p>
                      </div>
                      {presentation.slides.length > 1 && (
                        <Button
                          onClick={(e) => {
                            e.stopPropagation();
                            handleDeleteSlide(index);
                          }}
                          size="sm"
                          variant="ghost"
                          className="h-6 w-6 p-0"
                        >
                          <Trash2 className="w-3 h-3" />
                        </Button>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Editor Panel */}
            <div className="md:col-span-3 space-y-4">
              <Tabs defaultValue="edit" className="w-full">
                <TabsList className="grid w-full grid-cols-3">
                  <TabsTrigger value="edit">تحرير</TabsTrigger>
                  <TabsTrigger value="design">تصميم</TabsTrigger>
                  <TabsTrigger value="tools">أدوات</TabsTrigger>
                </TabsList>

                <TabsContent value="edit" className="space-y-4">
                  <div className="space-y-3">
                    <div>
                      <Label>العنوان</Label>
                      <Input
                        value={currentSlide?.title || ''}
                        onChange={(e) =>
                          handleUpdateSlide(currentSlideIndex, { title: e.target.value })
                        }
                        className="text-lg font-bold"
                      />
                    </div>

                    <div>
                      <Label>المحتوى</Label>
                      <Textarea
                        value={currentSlide?.content || ''}
                        onChange={(e) =>
                          handleUpdateSlide(currentSlideIndex, { content: e.target.value })
                        }
                        rows={10}
                        className="font-mono"
                      />
                    </div>

                    <div>
                      <Label>ملاحظات المتحدث</Label>
                      <Textarea
                        value={currentSlide?.notes || ''}
                        onChange={(e) =>
                          handleUpdateSlide(currentSlideIndex, { notes: e.target.value })
                        }
                        rows={3}
                      />
                    </div>
                  </div>
                </TabsContent>

                <TabsContent value="design" className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label>نوع الشريحة</Label>
                      <Select
                        value={currentSlide?.type}
                        onValueChange={(value) =>
                          handleUpdateSlide(currentSlideIndex, { type: value as Slide['type'] })
                        }
                      >
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="title">عنوان</SelectItem>
                          <SelectItem value="content">محتوى</SelectItem>
                          <SelectItem value="image">صورة</SelectItem>
                          <SelectItem value="table">جدول</SelectItem>
                          <SelectItem value="chart">رسم بياني</SelectItem>
                          <SelectItem value="blank">فارغة</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>

                    <div>
                      <Label>الانتقال</Label>
                      <Select
                        value={currentSlide?.animation.transition}
                        onValueChange={(value) =>
                          handleUpdateSlide(currentSlideIndex, {
                            animation: {
                              ...currentSlide!.animation,
                              transition: value as 'fade' | 'slide' | 'zoom' | 'flip' | 'none',
                            },
                          })
                        }
                      >
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="none">بدون</SelectItem>
                          <SelectItem value="fade">تلاشي</SelectItem>
                          <SelectItem value="slide">انزلاق</SelectItem>
                          <SelectItem value="zoom">تكبير</SelectItem>
                          <SelectItem value="flip">قلب</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>

                  <Separator />

                  <div className="space-y-3">
                    <h4 className="font-semibold">الألوان</h4>
                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <Label>لون الخلفية</Label>
                        <Input
                          type="color"
                          value={currentSlide?.layout.backgroundColor}
                          onChange={(e) =>
                            handleUpdateSlide(currentSlideIndex, {
                              layout: {
                                ...currentSlide!.layout,
                                backgroundColor: e.target.value,
                              },
                            })
                          }
                        />
                      </div>
                      <div>
                        <Label>لون النص</Label>
                        <Input
                          type="color"
                          value={currentSlide?.layout.textColor}
                          onChange={(e) =>
                            handleUpdateSlide(currentSlideIndex, {
                              layout: {
                                ...currentSlide!.layout,
                                textColor: e.target.value,
                              },
                            })
                          }
                        />
                      </div>
                    </div>
                  </div>
                </TabsContent>

                <TabsContent value="tools" className="space-y-4">
                  <div className="grid grid-cols-2 gap-3">
                    <Button onClick={handleCheckSpelling} variant="outline">
                      <FileText className="w-4 h-4 mr-2" />
                      تصحيح إملائي
                    </Button>

                    <Select onValueChange={handleTranslate}>
                      <SelectTrigger>
                        <Languages className="w-4 h-4 mr-2" />
                        <SelectValue placeholder="ترجمة" />
                      </SelectTrigger>
                      <SelectContent className="max-h-60">
                        {supportedLanguages.map((lang) => (
                          <SelectItem key={lang.code} value={lang.code}>
                            {lang.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>

                    <Button
                      onClick={() => handleAddSlide('content')}
                      variant="outline"
                    >
                      <Plus className="w-4 h-4 mr-2" />
                      شريحة جديدة
                    </Button>

                    <Button
                      onClick={() => {
                        const slides = [...presentation.slides];
                        slides.splice(currentSlideIndex + 1, 0, {
                          ...currentSlide!,
                          id: `slide-${Date.now()}`,
                        });
                        setPresentation({ ...presentation, slides });
                        toast.success('تم نسخ الشريحة');
                      }}
                      variant="outline"
                    >
                      <Copy className="w-4 h-4 mr-2" />
                      نسخ الشريحة
                    </Button>
                  </div>

                  <Separator />

                  <div className="space-y-3">
                    <h4 className="font-semibold">التصدير</h4>
                    <div className="grid grid-cols-3 gap-3">
                      <Button
                        onClick={() => handleExport('pptx')}
                        disabled={isGenerating}
                        variant="outline"
                      >
                        <Download className="w-4 h-4 mr-2" />
                        PowerPoint
                      </Button>
                      <Button
                        onClick={() => handleExport('pdf')}
                        disabled={isGenerating}
                        variant="outline"
                      >
                        <Download className="w-4 h-4 mr-2" />
                        PDF
                      </Button>
                      <Button
                        onClick={() => handleExport('html')}
                        disabled={isGenerating}
                        variant="outline"
                      >
                        <Download className="w-4 h-4 mr-2" />
                        HTML
                      </Button>
                    </div>
                  </div>
                </TabsContent>
              </Tabs>

              {/* Preview */}
              <Card className="border-2">
                <CardHeader>
                  <CardTitle className="text-sm">معاينة الشريحة</CardTitle>
                </CardHeader>
                <CardContent>
                  <div
                    className="aspect-video rounded-lg flex flex-col items-center justify-center p-8"
                    style={{
                      backgroundColor: currentSlide?.layout.backgroundColor,
                      color: currentSlide?.layout.textColor,
                    }}
                  >
                    <h2
                      className="text-3xl font-bold mb-4 text-center"
                      style={{
                        fontFamily: currentSlide?.layout.titleFont,
                        color: presentation.theme.primaryColor,
                      }}
                    >
                      {currentSlide?.title}
                    </h2>
                    <p
                      className="text-lg text-center whitespace-pre-line"
                      style={{ fontFamily: currentSlide?.layout.contentFont }}
                    >
                      {currentSlide?.content}
                    </p>
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}