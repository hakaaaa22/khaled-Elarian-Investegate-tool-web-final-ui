import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { VideoAnalysisResult } from '@/lib/videoAnalysis';
import {
  removeVideoEffects,
  VideoRestorationResult,
  calculateVideoQuality,
} from '@/lib/videoRestoration';
import {
  Wand2,
  Download,
  Volume2,
  VolumeX,
  CheckCircle2,
  AlertCircle,
  Sparkles,
  Gauge,
  Monitor,
} from 'lucide-react';
import { toast } from 'sonner';

interface VideoRestorationProps {
  video: VideoAnalysisResult;
}

export default function VideoRestoration({ video }: VideoRestorationProps) {
  const [isRestoring, setIsRestoring] = useState(false);
  const [progress, setProgress] = useState(0);
  const [restorationResult, setRestorationResult] =
    useState<VideoRestorationResult | null>(null);

  const originalQuality = calculateVideoQuality(
    video.metadata.width,
    video.metadata.height
  );

  const handleRestore = async () => {
    setIsRestoring(true);
    setProgress(0);

    const progressInterval = setInterval(() => {
      setProgress((prev) => {
        if (prev >= 90) {
          clearInterval(progressInterval);
          return 90;
        }
        return prev + 10;
      });
    }, 500);

    try {
      const result = await removeVideoEffects(video.file);
      setRestorationResult(result);
      setProgress(100);
      toast.success('تم استعادة الفيديو بنجاح!', {
        description: 'تم إزالة المؤثرات وإرجاع الفيديو للحالة الأصلية',
      });
    } catch (error) {
      console.error('Error restoring video:', error);
      toast.error('حدث خطأ أثناء استعادة الفيديو', {
        description: 'يرجى المحاولة مرة أخرى',
      });
    } finally {
      clearInterval(progressInterval);
      setIsRestoring(false);
    }
  };

  const downloadVideo = () => {
    if (!restorationResult) return;

    const a = document.createElement('a');
    a.href = restorationResult.originalVideo;
    a.download = `restored_${video.metadata.name}`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
  };

  const downloadAudio = () => {
    if (!restorationResult?.audioTrack) return;

    const a = document.createElement('a');
    a.href = restorationResult.audioTrack;
    a.download = `audio_${video.metadata.name.replace(/\.[^/.]+$/, '')}.webm`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
  };

  const getQualityColor = (score: number) => {
    if (score >= 90) return 'text-green-600';
    if (score >= 70) return 'text-blue-600';
    if (score >= 50) return 'text-yellow-600';
    return 'text-red-600';
  };

  const getQualityBgColor = (score: number) => {
    if (score >= 90) return 'bg-green-50 border-green-200';
    if (score >= 70) return 'bg-blue-50 border-blue-200';
    if (score >= 50) return 'bg-yellow-50 border-yellow-200';
    return 'bg-red-50 border-red-200';
  };

  return (
    <div className="space-y-6">
      <Card className="border-2">
        <CardHeader className="bg-gradient-to-r from-blue-50 to-indigo-50">
          <CardTitle className="flex items-center gap-2">
            <Monitor className="w-5 h-5" />
            تحليل جودة الفيديو الأصلي
          </CardTitle>
        </CardHeader>
        <CardContent className="pt-6 space-y-4">
          <div className="grid md:grid-cols-2 gap-6">
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium text-muted-foreground">
                  دقة الفيديو
                </span>
                <Badge variant="secondary" className="text-base font-bold">
                  {originalQuality.quality}
                </Badge>
              </div>

              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium">نسبة الجودة</span>
                  <span className={`text-2xl font-bold ${getQualityColor(originalQuality.score)}`}>
                    {originalQuality.score}%
                  </span>
                </div>
                <Progress value={originalQuality.score} className="h-3" />
              </div>

              <div className="grid grid-cols-2 gap-3 pt-2">
                <div className={`p-3 rounded-lg border ${getQualityBgColor(originalQuality.score)}`}>
                  <p className="text-xs text-muted-foreground mb-1">العرض</p>
                  <p className="text-lg font-bold">{video.metadata.width}px</p>
                </div>
                <div className={`p-3 rounded-lg border ${getQualityBgColor(originalQuality.score)}`}>
                  <p className="text-xs text-muted-foreground mb-1">الارتفاع</p>
                  <p className="text-lg font-bold">{video.metadata.height}px</p>
                </div>
              </div>
            </div>

            <div className={`p-6 rounded-xl border-2 ${getQualityBgColor(originalQuality.score)} flex flex-col items-center justify-center space-y-3`}>
              <Gauge className={`w-16 h-16 ${getQualityColor(originalQuality.score)}`} />
              <div className="text-center">
                <p className="text-sm text-muted-foreground mb-1">تقييم الجودة الإجمالي</p>
                <p className={`text-4xl font-bold ${getQualityColor(originalQuality.score)}`}>
                  {originalQuality.score}%
                </p>
                <p className="text-xs text-muted-foreground mt-2">
                  {originalQuality.score >= 90 && 'جودة ممتازة - دقة عالية جداً'}
                  {originalQuality.score >= 70 && originalQuality.score < 90 && 'جودة جيدة جداً - دقة عالية'}
                  {originalQuality.score >= 50 && originalQuality.score < 70 && 'جودة متوسطة - دقة مقبولة'}
                  {originalQuality.score < 50 && 'جودة منخفضة - دقة ضعيفة'}
                </p>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      <Card className="border-2">
        <CardHeader className="bg-gradient-to-r from-purple-50 to-pink-50">
          <CardTitle className="flex items-center gap-2">
            <Wand2 className="w-5 h-5" />
            استعادة الفيديو الأصلي
          </CardTitle>
        </CardHeader>
        <CardContent className="pt-6 space-y-6">
          <div className="space-y-4">
            <div className="flex items-start gap-3 p-4 rounded-lg bg-gradient-to-r from-blue-50 to-indigo-50 border-2 border-blue-200">
              <Sparkles className="w-5 h-5 text-blue-600 mt-0.5 flex-shrink-0" />
              <div className="space-y-1">
                <p className="text-sm font-medium text-blue-900">
                  ميزة إزالة المؤثرات المتقدمة
                </p>
                <p className="text-xs text-blue-700">
                  هذه الأداة تستخدم تقنيات متقدمة لإزالة المؤثرات المضافة على الفيديو
                  واستخراج الصوت الأصلي. النتائج تعتمد على نوع وقوة المؤثرات المطبقة.
                </p>
              </div>
            </div>

            {!restorationResult && !isRestoring && (
              <Button
                onClick={handleRestore}
                className="w-full bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700"
                size="lg"
                disabled={isRestoring}
              >
                <Wand2 className="w-5 h-5 mr-2" />
                بدء استعادة الفيديو الاحترافية
              </Button>
            )}

            {isRestoring && (
              <div className="space-y-3 p-6 rounded-lg border-2 border-dashed border-primary bg-primary/5">
                <div className="flex items-center justify-between text-sm">
                  <span className="font-medium flex items-center gap-2">
                    <div className="w-4 h-4 border-2 border-primary border-t-transparent rounded-full animate-spin" />
                    جاري المعالجة الاحترافية...
                  </span>
                  <span className="text-muted-foreground font-bold">{progress}%</span>
                </div>
                <Progress value={progress} className="h-3" />
                <p className="text-xs text-muted-foreground text-center">
                  قد تستغرق هذه العملية بضع دقائق للحصول على أفضل النتائج
                </p>
              </div>
            )}

            {restorationResult && (
              <div className="space-y-4">
                <div className="flex items-center gap-2 p-4 rounded-lg bg-gradient-to-r from-green-50 to-emerald-50 border-2 border-green-200">
                  <CheckCircle2 className="w-6 h-6 text-green-600 flex-shrink-0" />
                  <div>
                    <p className="text-sm font-bold text-green-900">
                      تم استعادة الفيديو بنجاح!
                    </p>
                    <p className="text-xs text-green-700">
                      جودة الفيديو المستعاد: {restorationResult.qualityScore}%
                    </p>
                  </div>
                </div>

                <Separator />

                <div className="space-y-3">
                  <h4 className="font-bold text-lg flex items-center gap-2">
                    <Monitor className="w-5 h-5" />
                    الفيديو المستعاد
                  </h4>
                  <div className="relative rounded-xl overflow-hidden bg-black border-2 border-border shadow-lg">
                    <video
                      src={restorationResult.originalVideo}
                      controls
                      className="w-full h-auto"
                    />
                  </div>

                  <div className="grid grid-cols-3 gap-3">
                    <div className="p-3 rounded-lg bg-gradient-to-br from-blue-50 to-indigo-50 border border-blue-200">
                      <p className="text-xs text-muted-foreground mb-1">معدل الإطارات</p>
                      <Badge variant="secondary" className="text-sm font-bold">
                        {restorationResult.frameRate} FPS
                      </Badge>
                    </div>
                    <div className="p-3 rounded-lg bg-gradient-to-br from-purple-50 to-pink-50 border border-purple-200">
                      <p className="text-xs text-muted-foreground mb-1">الجودة</p>
                      <Badge variant="secondary" className="text-sm font-bold">
                        {restorationResult.resolutionQuality}
                      </Badge>
                    </div>
                    <div className="p-3 rounded-lg bg-gradient-to-br from-green-50 to-emerald-50 border border-green-200">
                      <p className="text-xs text-muted-foreground mb-1">حالة الصوت</p>
                      <Badge
                        variant={restorationResult.hasAudio ? 'default' : 'outline'}
                        className="text-sm"
                      >
                        {restorationResult.hasAudio ? (
                          <>
                            <Volume2 className="w-3 h-3 mr-1" />
                            متوفر
                          </>
                        ) : (
                          <>
                            <VolumeX className="w-3 h-3 mr-1" />
                            غير متوفر
                          </>
                        )}
                      </Badge>
                    </div>
                  </div>

                  <div className="flex gap-2">
                    <Button 
                      onClick={downloadVideo} 
                      className="flex-1 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700"
                    >
                      <Download className="w-4 h-4 mr-2" />
                      تحميل الفيديو المستعاد
                    </Button>
                    {restorationResult.hasAudio && (
                      <Button
                        onClick={downloadAudio}
                        variant="outline"
                        className="flex-1 border-2"
                      >
                        <Download className="w-4 h-4 mr-2" />
                        تحميل الصوت المستخرج
                      </Button>
                    )}
                  </div>
                </div>

                {!restorationResult.hasAudio && (
                  <div className="flex items-start gap-3 p-4 rounded-lg bg-gradient-to-r from-amber-50 to-orange-50 border-2 border-amber-200">
                    <AlertCircle className="w-5 h-5 text-amber-600 mt-0.5 flex-shrink-0" />
                    <div className="space-y-1">
                      <p className="text-sm font-medium text-amber-900">
                        لم يتم العثور على مسار صوتي
                      </p>
                      <p className="text-xs text-amber-700">
                        الفيديو الأصلي قد لا يحتوي على صوت، أو تم إزالته بالكامل من الملف.
                      </p>
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}