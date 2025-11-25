import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Slider } from '@/components/ui/slider';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Separator } from '@/components/ui/separator';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  VideoEnhancementSettings,
  EnhancementResult,
  enhanceVideo,
} from '@/lib/videoEnhancement';
import {
  Sparkles,
  Loader2,
  Download,
  Zap,
  Sun,
  Contrast,
  Droplets,
  Focus,
  Volume2,
  TrendingUp,
  CheckCircle2,
} from 'lucide-react';
import { toast } from 'sonner';

interface VideoEnhancerProps {
  videoFile: File;
}

export default function VideoEnhancer({ videoFile }: VideoEnhancerProps) {
  const [isProcessing, setIsProcessing] = useState(false);
  const [progress, setProgress] = useState(0);
  const [result, setResult] = useState<EnhancementResult | null>(null);
  const [settings, setSettings] = useState<VideoEnhancementSettings>({
    resolution: 'original',
    sharpness: 0.5,
    noiseReduction: 0.3,
    brightness: 10,
    contrast: 10,
    saturation: 1.2,
    stabilization: false,
    colorCorrection: true,
  });

  const handleEnhance = async () => {
    setIsProcessing(true);
    setProgress(0);

    const progressInterval = setInterval(() => {
      setProgress((prev) => {
        if (prev >= 90) {
          clearInterval(progressInterval);
          return 90;
        }
        return prev + 5;
      });
    }, 300);

    try {
      const enhancementResult = await enhanceVideo(videoFile, settings);
      setResult(enhancementResult);
      setProgress(100);

      toast.success('تم تحسين الفيديو بنجاح!', {
        description: `تم معالجة الفيديو في ${(enhancementResult.processingTime / 1000).toFixed(1)} ثانية`,
      });
    } catch (error) {
      console.error('Error enhancing video:', error);
      toast.error('حدث خطأ أثناء تحسين الفيديو');
    } finally {
      clearInterval(progressInterval);
      setIsProcessing(false);
    }
  };

  const downloadEnhancedVideo = () => {
    if (!result) return;
    const a = document.createElement('a');
    a.href = result.enhancedVideoUrl;
    a.download = `enhanced_${videoFile.name}`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
  };

  const updateSetting = <K extends keyof VideoEnhancementSettings>(
    key: K,
    value: VideoEnhancementSettings[K]
  ) => {
    setSettings((prev) => ({ ...prev, [key]: value }));
  };

  return (
    <Card className="border-2">
      <CardHeader className="bg-gradient-to-r from-violet-50 to-purple-50">
        <CardTitle className="flex items-center gap-2">
          <Sparkles className="w-5 h-5" />
          تحسين جودة الفيديو
        </CardTitle>
      </CardHeader>
      <CardContent className="pt-6 space-y-6">
        {!result && (
          <>
            <div className="flex items-start gap-3 p-4 rounded-lg bg-gradient-to-r from-violet-50 to-purple-50 border-2 border-violet-200">
              <Zap className="w-5 h-5 text-violet-600 mt-0.5 flex-shrink-0" />
              <div className="space-y-1">
                <p className="text-sm font-medium text-violet-900">
                  تحسين احترافي للفيديو
                </p>
                <p className="text-xs text-violet-700">
                  استخدم الأدوات أدناه لتحسين جودة الفيديو بشكل احترافي. يمكنك زيادة
                  الدقة، تحسين الوضوح، تقليل التشويش، وضبط الإضاءة والألوان.
                </p>
              </div>
            </div>

            <div className="space-y-6">
              <div className="space-y-4">
                <Label className="text-base font-semibold">دقة الفيديو</Label>
                <Select
                  value={settings.resolution}
                  onValueChange={(value: VideoEnhancementSettings['resolution']) =>
                    updateSetting('resolution', value)
                  }
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="original">الدقة الأصلية</SelectItem>
                    <SelectItem value="hd">HD (720p)</SelectItem>
                    <SelectItem value="fullhd">Full HD (1080p)</SelectItem>
                    <SelectItem value="4k">4K Ultra HD</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <Separator />

              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <Label className="flex items-center gap-2">
                    <Focus className="w-4 h-4" />
                    الحدة والوضوح
                  </Label>
                  <span className="text-sm font-medium">
                    {Math.round(settings.sharpness * 100)}%
                  </span>
                </div>
                <Slider
                  value={[settings.sharpness]}
                  min={0}
                  max={1}
                  step={0.1}
                  onValueChange={([value]) => updateSetting('sharpness', value)}
                />
              </div>

              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <Label className="flex items-center gap-2">
                    <Volume2 className="w-4 h-4" />
                    تقليل التشويش
                  </Label>
                  <span className="text-sm font-medium">
                    {Math.round(settings.noiseReduction * 100)}%
                  </span>
                </div>
                <Slider
                  value={[settings.noiseReduction]}
                  min={0}
                  max={1}
                  step={0.1}
                  onValueChange={([value]) => updateSetting('noiseReduction', value)}
                />
              </div>

              <Separator />

              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <Label className="flex items-center gap-2">
                    <Sun className="w-4 h-4" />
                    السطوع
                  </Label>
                  <span className="text-sm font-medium">{settings.brightness}</span>
                </div>
                <Slider
                  value={[settings.brightness]}
                  min={-50}
                  max={50}
                  step={5}
                  onValueChange={([value]) => updateSetting('brightness', value)}
                />
              </div>

              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <Label className="flex items-center gap-2">
                    <Contrast className="w-4 h-4" />
                    التباين
                  </Label>
                  <span className="text-sm font-medium">{settings.contrast}</span>
                </div>
                <Slider
                  value={[settings.contrast]}
                  min={-50}
                  max={50}
                  step={5}
                  onValueChange={([value]) => updateSetting('contrast', value)}
                />
              </div>

              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <Label className="flex items-center gap-2">
                    <Droplets className="w-4 h-4" />
                    التشبع اللوني
                  </Label>
                  <span className="text-sm font-medium">
                    {settings.saturation.toFixed(1)}
                  </span>
                </div>
                <Slider
                  value={[settings.saturation]}
                  min={0}
                  max={2}
                  step={0.1}
                  onValueChange={([value]) => updateSetting('saturation', value)}
                />
              </div>

              <Separator />

              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <Label>تثبيت الفيديو (إزالة الاهتزازات)</Label>
                  <Switch
                    checked={settings.stabilization}
                    onCheckedChange={(checked) => updateSetting('stabilization', checked)}
                  />
                </div>

                <div className="flex items-center justify-between">
                  <Label>تصحيح الألوان التلقائي</Label>
                  <Switch
                    checked={settings.colorCorrection}
                    onCheckedChange={(checked) => updateSetting('colorCorrection', checked)}
                  />
                </div>
              </div>
            </div>

            {isProcessing && (
              <div className="space-y-3 p-6 rounded-lg border-2 border-dashed border-primary bg-primary/5">
                <div className="flex items-center justify-between text-sm">
                  <span className="font-medium flex items-center gap-2">
                    <Loader2 className="w-4 h-4 animate-spin" />
                    جاري تحسين الفيديو...
                  </span>
                  <span className="text-muted-foreground font-bold">{progress}%</span>
                </div>
                <Progress value={progress} className="h-3" />
                <p className="text-xs text-muted-foreground text-center">
                  قد تستغرق هذه العملية بضع دقائق حسب حجم الفيديو
                </p>
              </div>
            )}

            {!isProcessing && (
              <Button
                onClick={handleEnhance}
                className="w-full bg-gradient-to-r from-violet-600 to-purple-600 hover:from-violet-700 hover:to-purple-700"
                size="lg"
              >
                <Sparkles className="w-5 h-5 mr-2" />
                تحسين الفيديو الآن
              </Button>
            )}
          </>
        )}

        {result && (
          <div className="space-y-6">
            <div className="flex items-center justify-between p-4 rounded-lg bg-gradient-to-r from-green-50 to-emerald-50 border-2 border-green-200">
              <div className="flex items-center gap-2">
                <CheckCircle2 className="w-5 h-5 text-green-600" />
                <div>
                  <p className="text-sm font-bold text-green-900">
                    تم تحسين الفيديو بنجاح!
                  </p>
                  <p className="text-xs text-green-700">
                    وقت المعالجة: {(result.processingTime / 1000).toFixed(1)} ثانية
                  </p>
                </div>
              </div>
              <Button onClick={downloadEnhancedVideo} size="sm">
                <Download className="w-4 h-4 mr-2" />
                تحميل
              </Button>
            </div>

            <div className="grid md:grid-cols-2 gap-4">
              <Card className="border-2">
                <CardContent className="p-4">
                  <h4 className="font-semibold mb-3 flex items-center gap-2">
                    <TrendingUp className="w-4 h-4" />
                    التحسينات المطبقة
                  </h4>
                  <div className="space-y-3">
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-muted-foreground">زيادة الدقة</span>
                      <Badge variant="secondary">
                        {result.improvements.resolutionIncrease}
                      </Badge>
                    </div>
                    <div className="space-y-1">
                      <div className="flex items-center justify-between text-sm">
                        <span className="text-muted-foreground">درجة الجودة</span>
                        <span className="font-medium text-green-600">
                          {Math.round(result.improvements.qualityScore)}%
                        </span>
                      </div>
                      <Progress value={result.improvements.qualityScore} className="h-2" />
                    </div>
                    <div className="space-y-1">
                      <div className="flex items-center justify-between text-sm">
                        <span className="text-muted-foreground">تقليل التشويش</span>
                        <span className="font-medium">
                          {Math.round(result.improvements.noiseReduction)}%
                        </span>
                      </div>
                      <Progress value={result.improvements.noiseReduction} className="h-2" />
                    </div>
                    <div className="space-y-1">
                      <div className="flex items-center justify-between text-sm">
                        <span className="text-muted-foreground">تحسين الحدة</span>
                        <span className="font-medium">
                          {Math.round(result.improvements.sharpnessImprovement)}%
                        </span>
                      </div>
                      <Progress
                        value={result.improvements.sharpnessImprovement}
                        className="h-2"
                      />
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card className="border-2">
                <CardContent className="p-4">
                  <h4 className="font-semibold mb-3">المعاينة</h4>
                  <div className="aspect-video bg-black rounded-lg overflow-hidden">
                    <img
                      src={result.enhancedVideoUrl}
                      alt="Enhanced preview"
                      className="w-full h-full object-contain"
                    />
                  </div>
                </CardContent>
              </Card>
            </div>

            <div className="flex gap-3">
              <Button
                onClick={() => setResult(null)}
                variant="outline"
                className="flex-1"
              >
                تحسين مرة أخرى
              </Button>
              <Button
                onClick={downloadEnhancedVideo}
                className="flex-1 bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700"
              >
                <Download className="w-4 h-4 mr-2" />
                تحميل الفيديو المحسّن
              </Button>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}