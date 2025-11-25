import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import {
  analyzeVideoFromURL,
  extractClearImages,
  extractAudioFromURLVideo,
  URLAnalysisResult,
} from '@/lib/urlAnalysis';
import {
  Link as LinkIcon,
  Loader2,
  Download,
  Image as ImageIcon,
  Users,
  Music,
  Play,
  Search,
  FileText,
  CheckCircle2,
} from 'lucide-react';
import { toast } from 'sonner';

export default function URLAnalysisSection() {
  const [url, setUrl] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);
  const [progress, setProgress] = useState(0);
  const [analysisResult, setAnalysisResult] = useState<URLAnalysisResult | null>(null);
  const [clearImages, setClearImages] = useState<string[]>([]);
  const [extractedAudio, setExtractedAudio] = useState<string[]>([]);

  const handleAnalyze = async () => {
    if (!url.trim()) {
      toast.error('يرجى إدخال رابط الفيديو');
      return;
    }

    setIsProcessing(true);
    setProgress(0);
    setAnalysisResult(null);
    setClearImages([]);
    setExtractedAudio([]);

    const interval = setInterval(() => {
      setProgress((prev) => (prev >= 90 ? 90 : prev + 15));
    }, 400);

    try {
      toast.info('جاري تحليل الفيديو من الرابط...');
      const result = await analyzeVideoFromURL(url);
      setAnalysisResult(result);
      setProgress(100);

      toast.success('تم تحليل الفيديو بنجاح!', {
        description: `تم اكتشاف ${result.detectedPersons.length} شخص`,
      });
    } catch (error) {
      toast.error('حدث خطأ أثناء التحليل', {
        description: error instanceof Error ? error.message : 'رابط غير صالح',
      });
    } finally {
      clearInterval(interval);
      setIsProcessing(false);
    }
  };

  const handleExtractClearImages = async () => {
    if (!analysisResult) return;

    setIsProcessing(true);
    toast.info('استخراج الصور الواضحة...');

    try {
      const images = await extractClearImages(analysisResult.videoUrl);
      setClearImages(images);
      toast.success(`تم استخراج ${images.length} صورة واضحة`);
    } catch (error) {
      toast.error('حدث خطأ أثناء استخراج الصور');
    } finally {
      setIsProcessing(false);
    }
  };

  const handleExtractAudio = async () => {
    if (!analysisResult) return;

    setIsProcessing(true);
    toast.info('استخراج المسارات الصوتية...');

    try {
      const audio = await extractAudioFromURLVideo(analysisResult.videoUrl);
      setExtractedAudio(audio);
      toast.success('تم استخراج المسارات الصوتية بنجاح');
    } catch (error) {
      toast.error('حدث خطأ أثناء استخراج الصوت');
    } finally {
      setIsProcessing(false);
    }
  };

  const handleDownloadImage = (imageUrl: string, index: number) => {
    const a = document.createElement('a');
    a.href = imageUrl;
    a.download = `person_${index + 1}.jpg`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    toast.success('تم تحميل الصورة');
  };

  return (
    <div className="space-y-6">
      <Card className="border-2 border-indigo-200 bg-gradient-to-br from-indigo-950 to-purple-950 text-indigo-50">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-2xl text-indigo-100">
            <LinkIcon className="w-6 h-6 text-indigo-400" />
            تحليل الفيديو من الرابط
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="space-y-4">
            <div className="flex gap-3">
              <Input
                type="url"
                placeholder="أدخل رابط الفيديو (YouTube, Vimeo, إلخ)"
                value={url}
                onChange={(e) => setUrl(e.target.value)}
                className="flex-1 bg-indigo-950/50 border-indigo-700 text-indigo-100 placeholder:text-indigo-400"
                disabled={isProcessing}
              />
              <Button
                onClick={handleAnalyze}
                disabled={isProcessing || !url.trim()}
                className="bg-indigo-600 hover:bg-indigo-700"
                size="lg"
              >
                {isProcessing ? (
                  <>
                    <Loader2 className="w-5 h-5 mr-2 animate-spin" />
                    جاري التحليل...
                  </>
                ) : (
                  <>
                    <Search className="w-5 h-5 mr-2" />
                    تحليل
                  </>
                )}
              </Button>
            </div>

            {isProcessing && (
              <div className="space-y-2">
                <Progress value={progress} className="h-3" />
                <p className="text-sm text-center text-indigo-300">
                  {progress < 30
                    ? 'جاري الاتصال بالرابط...'
                    : progress < 60
                    ? 'تحميل الفيديو...'
                    : progress < 90
                    ? 'تحليل المحتوى...'
                    : 'اكتمال التحليل...'}
                </p>
              </div>
            )}
          </div>

          {analysisResult && (
            <div className="space-y-6">
              {/* Video Metadata */}
              <Card className="border-2 bg-indigo-900/50">
                <CardHeader>
                  <CardTitle className="text-lg text-indigo-200 flex items-center gap-2">
                    <FileText className="w-5 h-5" />
                    معلومات الفيديو
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    <div className="p-3 rounded-lg bg-indigo-950/50 border border-indigo-700">
                      <p className="text-sm text-indigo-400">المدة</p>
                      <p className="text-xl font-bold text-indigo-100">
                        {analysisResult.metadata.duration.toFixed(1)}s
                      </p>
                    </div>
                    <div className="p-3 rounded-lg bg-indigo-950/50 border border-indigo-700">
                      <p className="text-sm text-indigo-400">الأبعاد</p>
                      <p className="text-xl font-bold text-indigo-100">
                        {analysisResult.metadata.width}×{analysisResult.metadata.height}
                      </p>
                    </div>
                    <div className="p-3 rounded-lg bg-indigo-950/50 border border-indigo-700">
                      <p className="text-sm text-indigo-400">FPS</p>
                      <p className="text-xl font-bold text-indigo-100">
                        {analysisResult.metadata.fps}
                      </p>
                    </div>
                    <div className="p-3 rounded-lg bg-indigo-950/50 border border-indigo-700">
                      <p className="text-sm text-indigo-400">الصيغة</p>
                      <p className="text-xl font-bold text-indigo-100">
                        {analysisResult.metadata.format.toUpperCase()}
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Thumbnails */}
              <Card className="border-2 bg-indigo-900/50">
                <CardHeader>
                  <CardTitle className="text-lg text-indigo-200 flex items-center gap-2">
                    <Play className="w-5 h-5" />
                    معاينة الإطارات
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                    {analysisResult.thumbnails.map((thumb, index) => (
                      <div
                        key={index}
                        className="aspect-video rounded-lg overflow-hidden border-2 border-indigo-700"
                      >
                        <img src={thumb} alt={`Frame ${index + 1}`} className="w-full h-full object-cover" />
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>

              {/* Detected Persons */}
              <Card className="border-2 bg-purple-900/50">
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <CardTitle className="text-lg text-purple-200 flex items-center gap-2">
                      <Users className="w-5 h-5" />
                      الأشخاص المكتشفون ({analysisResult.detectedPersons.length})
                    </CardTitle>
                    <Button
                      onClick={handleExtractClearImages}
                      disabled={isProcessing}
                      size="sm"
                      variant="outline"
                      className="border-purple-600 text-purple-200 hover:bg-purple-800"
                    >
                      <ImageIcon className="w-4 h-4 mr-2" />
                      استخراج صور واضحة
                    </Button>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    {analysisResult.detectedPersons.map((person, index) => (
                      <div
                        key={person.id}
                        className="space-y-2 p-3 rounded-lg bg-purple-950/50 border border-purple-700"
                      >
                        <div className="aspect-square rounded-lg overflow-hidden bg-purple-900">
                          <img
                            src={person.imageUrl}
                            alt={`Person ${index + 1}`}
                            className="w-full h-full object-cover"
                          />
                        </div>
                        <div className="space-y-1">
                          <div className="flex items-center justify-between">
                            <Badge variant="secondary" className="text-xs">
                              شخص {index + 1}
                            </Badge>
                            <span className="text-xs text-purple-400">
                              {(person.confidence * 100).toFixed(0)}%
                            </span>
                          </div>
                          <p className="text-xs text-purple-300">
                            الوقت: {person.timestamp.toFixed(1)}s
                          </p>
                          <Button
                            onClick={() => handleDownloadImage(person.imageUrl, index)}
                            size="sm"
                            variant="ghost"
                            className="w-full text-xs"
                          >
                            <Download className="w-3 h-3 mr-1" />
                            تحميل
                          </Button>
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>

              {/* Clear Images */}
              {clearImages.length > 0 && (
                <Card className="border-2 bg-cyan-900/50">
                  <CardHeader>
                    <CardTitle className="text-lg text-cyan-200 flex items-center gap-2">
                      <ImageIcon className="w-5 h-5" />
                      الصور الواضحة المستخرجة ({clearImages.length})
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                      {clearImages.map((image, index) => (
                        <div key={index} className="space-y-2">
                          <div className="aspect-video rounded-lg overflow-hidden border-2 border-cyan-700">
                            <img src={image} alt={`Clear ${index + 1}`} className="w-full h-full object-cover" />
                          </div>
                          <Button
                            onClick={() => handleDownloadImage(image, index)}
                            size="sm"
                            variant="outline"
                            className="w-full border-cyan-600 text-cyan-200"
                          >
                            <Download className="w-3 h-3 mr-1" />
                            تحميل
                          </Button>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              )}

              {/* Audio Tracks */}
              <Card className="border-2 bg-pink-900/50">
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <CardTitle className="text-lg text-pink-200 flex items-center gap-2">
                      <Music className="w-5 h-5" />
                      المسارات الصوتية
                    </CardTitle>
                    <Button
                      onClick={handleExtractAudio}
                      disabled={isProcessing}
                      size="sm"
                      variant="outline"
                      className="border-pink-600 text-pink-200 hover:bg-pink-800"
                    >
                      <Music className="w-4 h-4 mr-2" />
                      استخراج الصوت
                    </Button>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    {analysisResult.audioTracks.map((track) => (
                      <div
                        key={track.id}
                        className="flex items-center justify-between p-4 rounded-lg bg-pink-950/50 border border-pink-700"
                      >
                        <div className="flex items-center gap-3">
                          <Music className="w-5 h-5 text-pink-400" />
                          <div>
                            <p className="font-medium text-pink-200">{track.name}</p>
                            <p className="text-sm text-pink-400">
                              {track.duration.toFixed(1)}s • {track.sampleRate}Hz • {track.channels}ch
                            </p>
                          </div>
                        </div>
                        <Button size="sm" variant="ghost">
                          <Download className="w-4 h-4" />
                        </Button>
                      </div>
                    ))}

                    {extractedAudio.length > 0 && (
                      <>
                        <Separator className="bg-pink-700" />
                        <div className="space-y-2">
                          <p className="text-sm font-bold text-pink-300">المسارات المفصولة:</p>
                          {['الصوت الكامل', 'الصوت البشري', 'الموسيقى'].map((name, index) => (
                            <div
                              key={index}
                              className="flex items-center justify-between p-3 rounded-lg bg-pink-950/50 border border-pink-700"
                            >
                              <div className="flex items-center gap-2">
                                <CheckCircle2 className="w-4 h-4 text-green-400" />
                                <span className="text-sm text-pink-200">{name}</span>
                              </div>
                              <Button size="sm" variant="ghost">
                                <Download className="w-3 h-3" />
                              </Button>
                            </div>
                          ))}
                        </div>
                      </>
                    )}
                  </div>
                </CardContent>
              </Card>

              <Button
                onClick={() => {
                  setUrl('');
                  setAnalysisResult(null);
                  setClearImages([]);
                  setExtractedAudio([]);
                }}
                variant="outline"
                className="w-full border-indigo-600 text-indigo-200"
              >
                تحليل رابط جديد
              </Button>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}