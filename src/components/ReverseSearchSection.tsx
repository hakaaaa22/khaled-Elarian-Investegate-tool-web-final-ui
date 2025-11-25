import { useState, useRef } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Separator } from '@/components/ui/separator';
import { Checkbox } from '@/components/ui/checkbox';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  performReverseImageSearch,
  generateReverseSearchReport,
  ComprehensiveSearchResult,
  SearchResultItem,
  SearchEngine,
  SearchQuality,
  SearchOptions,
} from '@/lib/reverseImageSearch';
import {
  Upload,
  Search,
  Loader2,
  ExternalLink,
  Download,
  AlertTriangle,
  CheckCircle2,
  Image as ImageIcon,
  FileText,
  Globe,
  Calendar,
  Maximize2,
  Link2,
  Settings,
} from 'lucide-react';
import { toast } from 'sonner';

export default function ReverseSearchSection() {
  const [file, setFile] = useState<File | null>(null);
  const [imageUrl, setImageUrl] = useState<string | null>(null);
  const [isSearching, setIsSearching] = useState(false);
  const [progress, setProgress] = useState(0);
  const [searchResult, setSearchResult] = useState<ComprehensiveSearchResult | null>(null);
  const [selectedResult, setSelectedResult] = useState<SearchResultItem | null>(null);
  const [showSettings, setShowSettings] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Search settings
  const [selectedEngines, setSelectedEngines] = useState<SearchEngine[]>([
    'google',
    'tineye',
    'yandex',
    'bing',
    'baidu',
  ]);
  const [searchQuality, setSearchQuality] = useState<SearchQuality>('maximum');

  const engines: { value: SearchEngine; label: string }[] = [
    { value: 'google', label: 'Google Images' },
    { value: 'tineye', label: 'TinEye' },
    { value: 'yandex', label: 'Yandex Images' },
    { value: 'bing', label: 'Bing Images' },
    { value: 'baidu', label: 'Baidu Images' },
  ];

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    console.log('🔍 Reverse search file select triggered');
    const selectedFile = e.target.files?.[0];
    console.log('🔍 Selected file:', selectedFile);

    if (!selectedFile) {
      console.log('❌ No file selected');
      return;
    }

    console.log('📄 File details:', {
      name: selectedFile.name,
      type: selectedFile.type,
      size: selectedFile.size,
    });

    if (selectedFile.type.startsWith('image/')) {
      console.log('✅ Valid image file');
      setFile(selectedFile);
      setImageUrl(URL.createObjectURL(selectedFile));
      setSearchResult(null);
      toast.success('تم تحميل الصورة');
    } else {
      console.log('❌ Invalid file type');
      toast.error('يرجى اختيار ملف صورة');
    }
  };

  const handleUploadClick = () => {
    console.log('🖱️ Reverse search upload button clicked');
    console.log('📎 File input ref:', fileInputRef.current);
    if (fileInputRef.current) {
      console.log('✅ Triggering file input click');
      fileInputRef.current.click();
    } else {
      console.log('❌ File input ref is null');
    }
  };

  const toggleEngine = (engine: SearchEngine) => {
    setSelectedEngines((prev) =>
      prev.includes(engine)
        ? prev.filter((e) => e !== engine)
        : [...prev, engine]
    );
  };

  const handleSearch = async () => {
    if (!imageUrl) return;

    if (selectedEngines.length === 0) {
      toast.error('يرجى اختيار محرك بحث واحد على الأقل');
      return;
    }

    setIsSearching(true);
    setProgress(0);

    const interval = setInterval(() => {
      setProgress((prev) => (prev >= 90 ? 90 : prev + 10));
    }, 400);

    try {
      const options: SearchOptions = {
        engines: selectedEngines,
        quality: searchQuality,
      };

      const result = await performReverseImageSearch(imageUrl, options);
      setSearchResult(result);
      setProgress(100);

      toast.success('تم البحث بنجاح!', {
        description: `تم العثور على ${result.totalMatches} نتيجة`,
      });

      if (result.adultContentFound) {
        toast.warning('تحذير: تم العثور على محتوى للبالغين');
      }
    } catch (error) {
      toast.error('حدث خطأ أثناء البحث');
    } finally {
      clearInterval(interval);
      setIsSearching(false);
    }
  };

  const handleDownloadReport = () => {
    if (!searchResult) return;

    const report = generateReverseSearchReport(searchResult);
    const blob = new Blob([report], { type: 'text/plain;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'reverse_search_report.txt';
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    toast.success('تم تحميل التقرير');
  };

  const getContentTypeColor = (type: SearchResultItem['contentType']) => {
    switch (type) {
      case 'adult':
        return 'bg-red-100 text-red-900 border-red-300';
      case 'social':
        return 'bg-blue-100 text-blue-900 border-blue-300';
      case 'news':
        return 'bg-green-100 text-green-900 border-green-300';
      case 'profile':
        return 'bg-purple-100 text-purple-900 border-purple-300';
      default:
        return 'bg-gray-100 text-gray-900 border-gray-300';
    }
  };

  const getContentTypeLabel = (type: SearchResultItem['contentType']) => {
    switch (type) {
      case 'adult':
        return '⚠️ محتوى للبالغين';
      case 'social':
        return '📱 وسائل التواصل';
      case 'news':
        return '📰 أخبار';
      case 'profile':
        return '👤 ملف شخصي';
      case 'general':
        return '🌐 عام';
      default:
        return '📄 أخرى';
    }
  };

  const getProgressMessage = () => {
    if (progress < 20) return 'جاري تحضير الصورة...';
    if (progress < 40) return `البحث في ${selectedEngines[0]}...`;
    if (progress < 60) return selectedEngines[1] ? `البحث في ${selectedEngines[1]}...` : 'جاري المعالجة...';
    if (progress < 80) return selectedEngines[2] ? `البحث في ${selectedEngines[2]}...` : 'جاري المعالجة...';
    if (progress < 90) return 'جمع النتائج وترتيبها...';
    return 'اكتمل البحث!';
  };

  return (
    <div className="space-y-6">
      <Card className="border-2 border-violet-200 bg-gradient-to-br from-violet-50 to-purple-50">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-2xl">
            <Search className="w-6 h-6 text-violet-600" />
            البحث العكسي عن الصور - محسّن
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          {!file && (
            <div className="text-center space-y-4">
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                onChange={handleFileSelect}
                className="hidden"
              />
              <Button
                size="lg"
                className="w-full max-w-md bg-violet-600 hover:bg-violet-700"
                onClick={handleUploadClick}
                type="button"
              >
                <Upload className="w-5 h-5 mr-2" />
                رفع صورة للبحث
              </Button>
              <p className="text-sm text-muted-foreground">
                ابحث في 5 محركات بحث: Google, TinEye, Yandex, Bing, Baidu
              </p>
            </div>
          )}

          {file && (
            <div className="space-y-6">
              <div className="grid md:grid-cols-2 gap-6">
                <div className="space-y-3">
                  <p className="font-semibold">الصورة المرفوعة</p>
                  <div className="aspect-video bg-black rounded-lg overflow-hidden border-2 border-violet-200">
                    <img
                      src={imageUrl!}
                      alt="Uploaded"
                      className="w-full h-full object-contain"
                    />
                  </div>

                  {/* Search Settings */}
                  <Card className="border-2 border-violet-200">
                    <CardContent className="p-4 space-y-4">
                      <div className="flex items-center justify-between">
                        <h4 className="font-semibold flex items-center gap-2">
                          <Settings className="w-4 h-4" />
                          إعدادات البحث
                        </h4>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => setShowSettings(!showSettings)}
                        >
                          {showSettings ? 'إخفاء' : 'عرض'}
                        </Button>
                      </div>

                      {showSettings && (
                        <>
                          <Separator />
                          <div className="space-y-3">
                            <Label>جودة البحث:</Label>
                            <Select
                              value={searchQuality}
                              onValueChange={(value) => setSearchQuality(value as SearchQuality)}
                            >
                              <SelectTrigger>
                                <SelectValue />
                              </SelectTrigger>
                              <SelectContent>
                                <SelectItem value="standard">قياسية (سريع)</SelectItem>
                                <SelectItem value="high">عالية (متوسط)</SelectItem>
                                <SelectItem value="maximum">أقصى دقة (بطيء)</SelectItem>
                              </SelectContent>
                            </Select>
                          </div>

                          <Separator />

                          <div className="space-y-3">
                            <Label>محركات البحث:</Label>
                            <div className="space-y-2">
                              {engines.map((engine) => (
                                <div key={engine.value} className="flex items-center space-x-2 space-x-reverse">
                                  <Checkbox
                                    id={engine.value}
                                    checked={selectedEngines.includes(engine.value)}
                                    onCheckedChange={() => toggleEngine(engine.value)}
                                  />
                                  <Label
                                    htmlFor={engine.value}
                                    className="text-sm font-normal cursor-pointer"
                                  >
                                    {engine.label}
                                  </Label>
                                </div>
                              ))}
                            </div>
                            <p className="text-xs text-muted-foreground">
                              محركات مختارة: {selectedEngines.length} من {engines.length}
                            </p>
                          </div>
                        </>
                      )}
                    </CardContent>
                  </Card>

                  <Button
                    onClick={handleSearch}
                    disabled={isSearching || selectedEngines.length === 0}
                    className="w-full bg-violet-600 hover:bg-violet-700"
                    size="lg"
                  >
                    {isSearching ? (
                      <>
                        <Loader2 className="w-5 h-5 mr-2 animate-spin" />
                        جاري البحث...
                      </>
                    ) : (
                      <>
                        <Search className="w-5 h-5 mr-2" />
                        بدء البحث ({selectedEngines.length} محرك)
                      </>
                    )}
                  </Button>
                </div>

                {searchResult && (
                  <Card className="border-2 bg-white">
                    <CardContent className="p-4 space-y-4">
                      <h4 className="font-bold text-lg">ملخص النتائج</h4>

                      <div className="grid grid-cols-2 gap-3">
                        <div className="p-3 rounded-lg bg-violet-50 border border-violet-200">
                          <p className="text-sm text-muted-foreground">إجمالي النتائج</p>
                          <p className="text-2xl font-bold text-violet-600">
                            {searchResult.totalMatches}
                          </p>
                        </div>
                        <div className="p-3 rounded-lg bg-violet-50 border border-violet-200">
                          <p className="text-sm text-muted-foreground">المحركات</p>
                          <p className="text-2xl font-bold text-violet-600">
                            {searchResult.allResults.length}
                          </p>
                        </div>
                      </div>

                      {searchResult.personDetected && (
                        <div className="flex items-center gap-2 p-3 rounded-lg bg-blue-50 border border-blue-200">
                          <CheckCircle2 className="w-5 h-5 text-blue-600" />
                          <span className="text-sm font-medium text-blue-900">
                            تم اكتشاف شخص في الصورة
                          </span>
                        </div>
                      )}

                      {searchResult.adultContentFound && (
                        <div className="flex items-center gap-2 p-3 rounded-lg bg-red-50 border border-red-200">
                          <AlertTriangle className="w-5 h-5 text-red-600" />
                          <span className="text-sm font-medium text-red-900">
                            تحذير: تم العثور على محتوى للبالغين
                          </span>
                        </div>
                      )}

                      <div className="p-3 rounded-lg bg-gray-50 border">
                        <p className="text-sm">{searchResult.summary}</p>
                      </div>

                      <Button
                        onClick={handleDownloadReport}
                        variant="outline"
                        className="w-full"
                      >
                        <FileText className="w-4 h-4 mr-2" />
                        تحميل التقرير الكامل
                      </Button>
                    </CardContent>
                  </Card>
                )}
              </div>

              {isSearching && (
                <div className="space-y-2">
                  <Progress value={progress} className="h-3" />
                  <p className="text-sm text-center text-muted-foreground">
                    {getProgressMessage()}
                  </p>
                </div>
              )}

              {searchResult && (
                <div className="space-y-6">
                  <Tabs defaultValue="all" className="w-full">
                    <TabsList className="grid w-full" style={{ gridTemplateColumns: `repeat(${searchResult.allResults.length + 1}, 1fr)` }}>
                      <TabsTrigger value="all">
                        الكل ({searchResult.totalMatches})
                      </TabsTrigger>
                      {searchResult.allResults.map((result) => (
                        <TabsTrigger key={result.source} value={result.source}>
                          {result.source.charAt(0).toUpperCase() + result.source.slice(1)} ({result.totalFound})
                        </TabsTrigger>
                      ))}
                    </TabsList>

                    <TabsContent value="all" className="mt-6">
                      <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
                        {searchResult.allResults.map((sourceResult) =>
                          sourceResult.results.slice(0, 3).map((result) => (
                            <Card
                              key={result.id}
                              className="border-2 hover:shadow-lg transition-shadow cursor-pointer overflow-hidden"
                              onClick={() => setSelectedResult(result)}
                            >
                              <div className="aspect-video bg-gray-100 overflow-hidden">
                                <img
                                  src={result.imageUrl}
                                  alt={result.title}
                                  className="w-full h-full object-cover hover:scale-105 transition-transform"
                                  onError={(e) => {
                                    e.currentTarget.src = result.thumbnailUrl;
                                  }}
                                />
                              </div>
                              <CardContent className="p-3 space-y-2">
                                <div className="flex items-start justify-between gap-2">
                                  <h5 className="font-semibold text-sm line-clamp-2">{result.title}</h5>
                                  <Badge
                                    variant="outline"
                                    className={`${getContentTypeColor(result.contentType)} text-xs flex-shrink-0`}
                                  >
                                    {result.similarity.toFixed(0)}%
                                  </Badge>
                                </div>
                                <div className="flex items-center gap-2 text-xs text-muted-foreground">
                                  <Globe className="w-3 h-3" />
                                  <span className="truncate">{result.domain}</span>
                                </div>
                                {result.dimensions && (
                                  <p className="text-xs text-muted-foreground">
                                    {result.dimensions.width} × {result.dimensions.height}
                                  </p>
                                )}
                              </CardContent>
                            </Card>
                          ))
                        )}
                      </div>
                    </TabsContent>

                    {searchResult.allResults.map((sourceResult) => (
                      <TabsContent
                        key={sourceResult.source}
                        value={sourceResult.source}
                        className="mt-6"
                      >
                        <div className="space-y-4">
                          <div className="p-4 rounded-lg bg-gray-50 border">
                            <div className="flex items-center justify-between">
                              <span className="font-medium">
                                وقت البحث: {sourceResult.searchTime.toFixed(2)} ثانية
                              </span>
                              <span className="font-medium">
                                {sourceResult.totalFound} نتيجة
                              </span>
                            </div>
                          </div>

                          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
                            {sourceResult.results.map((result) => (
                              <Card
                                key={result.id}
                                className="border-2 hover:shadow-lg transition-shadow overflow-hidden"
                              >
                                <div className="aspect-video bg-gray-100 overflow-hidden">
                                  <img
                                    src={result.imageUrl}
                                    alt={result.title}
                                    className="w-full h-full object-cover hover:scale-105 transition-transform cursor-pointer"
                                    onClick={() => setSelectedResult(result)}
                                    onError={(e) => {
                                      e.currentTarget.src = result.thumbnailUrl;
                                    }}
                                  />
                                </div>
                                <CardContent className="p-3 space-y-2">
                                  <div className="flex items-start justify-between gap-2">
                                    <h5 className="font-semibold text-sm line-clamp-2">{result.title}</h5>
                                    <Badge
                                      variant="outline"
                                      className={getContentTypeColor(result.contentType)}
                                    >
                                      {result.similarity.toFixed(0)}%
                                    </Badge>
                                  </div>
                                  <p className="text-xs text-muted-foreground truncate">
                                    {result.domain}
                                  </p>
                                  <div className="flex items-center justify-between pt-2">
                                    <Button
                                      size="sm"
                                      variant="outline"
                                      onClick={() => window.open(result.sourceUrl, '_blank')}
                                    >
                                      <ExternalLink className="w-3 h-3 mr-1" />
                                      المصدر
                                    </Button>
                                    <Button
                                      size="sm"
                                      variant="ghost"
                                      onClick={() => window.open(result.imageUrl, '_blank')}
                                    >
                                      <Link2 className="w-3 h-3 mr-1" />
                                      الصورة
                                    </Button>
                                  </div>
                                </CardContent>
                              </Card>
                            ))}
                          </div>
                        </div>
                      </TabsContent>
                    ))}
                  </Tabs>
                </div>
              )}

              <Button
                onClick={() => {
                  setFile(null);
                  setImageUrl(null);
                  setSearchResult(null);
                  setSelectedResult(null);
                }}
                variant="outline"
                className="w-full"
              >
                بحث عن صورة جديدة
              </Button>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Image Detail Modal */}
      {selectedResult && (
        <div
          className="fixed inset-0 bg-black/80 flex items-center justify-center z-50 p-4"
          onClick={() => setSelectedResult(null)}
        >
          <Card
            className="max-w-4xl w-full max-h-[90vh] overflow-auto"
            onClick={(e) => e.stopPropagation()}
          >
            <CardHeader>
              <CardTitle className="flex items-center justify-between">
                <span className="line-clamp-1">{selectedResult.title}</span>
                <Button
                  size="sm"
                  variant="ghost"
                  onClick={() => setSelectedResult(null)}
                >
                  ✕
                </Button>
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="aspect-video rounded-lg overflow-hidden bg-black">
                <img
                  src={selectedResult.imageUrl}
                  alt={selectedResult.title}
                  className="w-full h-full object-contain"
                  onError={(e) => {
                    e.currentTarget.src = selectedResult.thumbnailUrl;
                  }}
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="p-3 rounded-lg bg-gray-50 border">
                  <p className="text-sm text-muted-foreground">نسبة التشابه</p>
                  <p className="text-2xl font-bold">{selectedResult.similarity.toFixed(1)}%</p>
                </div>
                <div className="p-3 rounded-lg bg-gray-50 border">
                  <p className="text-sm text-muted-foreground">نوع المحتوى</p>
                  <Badge className={getContentTypeColor(selectedResult.contentType)}>
                    {getContentTypeLabel(selectedResult.contentType)}
                  </Badge>
                </div>
              </div>

              <Separator />

              <div className="space-y-2">
                <p className="font-semibold">معلومات المصدر:</p>
                <div className="space-y-1 text-sm">
                  <p>
                    <span className="text-muted-foreground">المجال:</span>{' '}
                    {selectedResult.domain}
                  </p>
                  <p className="flex items-start gap-2">
                    <span className="text-muted-foreground flex-shrink-0">رابط المصدر:</span>
                    <a
                      href={selectedResult.sourceUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-blue-600 hover:underline break-all"
                    >
                      {selectedResult.sourceUrl}
                    </a>
                  </p>
                  <p className="flex items-start gap-2">
                    <span className="text-muted-foreground flex-shrink-0">رابط الصورة:</span>
                    <a
                      href={selectedResult.imageUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-blue-600 hover:underline break-all"
                    >
                      {selectedResult.imageUrl}
                    </a>
                  </p>
                  {selectedResult.uploadDate && (
                    <p>
                      <span className="text-muted-foreground">تاريخ النشر:</span>{' '}
                      {new Date(selectedResult.uploadDate).toLocaleDateString('ar-EG')}
                    </p>
                  )}
                  {selectedResult.dimensions && (
                    <p>
                      <span className="text-muted-foreground">الأبعاد:</span>{' '}
                      {selectedResult.dimensions.width} × {selectedResult.dimensions.height}
                    </p>
                  )}
                  {selectedResult.fileSize && (
                    <p>
                      <span className="text-muted-foreground">حجم الملف:</span>{' '}
                      {selectedResult.fileSize}
                    </p>
                  )}
                </div>
              </div>

              {selectedResult.relatedImages && selectedResult.relatedImages.length > 0 && (
                <>
                  <Separator />
                  <div className="space-y-3">
                    <p className="font-semibold">صور ذات صلة:</p>
                    <div className="grid grid-cols-3 gap-3">
                      {selectedResult.relatedImages.map((img, index) => (
                        <div
                          key={index}
                          className="aspect-video rounded-lg overflow-hidden bg-gray-100 cursor-pointer hover:opacity-80 transition-opacity"
                          onClick={() => window.open(img, '_blank')}
                        >
                          <img
                            src={img}
                            alt={`Related ${index + 1}`}
                            className="w-full h-full object-cover"
                          />
                        </div>
                      ))}
                    </div>
                  </div>
                </>
              )}

              <div className="flex gap-3">
                <Button
                  onClick={() => window.open(selectedResult.sourceUrl, '_blank')}
                  className="flex-1"
                >
                  <ExternalLink className="w-4 h-4 mr-2" />
                  فتح المصدر
                </Button>
                <Button
                  onClick={() => window.open(selectedResult.imageUrl, '_blank')}
                  variant="outline"
                  className="flex-1"
                >
                  <Maximize2 className="w-4 h-4 mr-2" />
                  عرض الصورة الأصلية
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
}