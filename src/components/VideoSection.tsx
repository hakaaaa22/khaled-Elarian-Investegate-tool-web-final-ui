import { useState, useRef } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Progress } from '@/components/ui/progress';
import { Slider } from '@/components/ui/slider';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { analyzeVideo, VideoAnalysisResult } from '@/lib/videoAnalysis';
import {
  separateAudioTracks,
  extractAudioFromVideo,
  generateAudioReport,
  SeparationResult,
} from '@/lib/advancedAudioSeparation';
import {
  enhanceVideo,
  detectVideoEffects,
  VideoEnhancementSettings,
  VideoEnhancementResult,
} from '@/lib/videoEnhancement';
import {
  Upload,
  Video as VideoIcon,
  Scan,
  Download,
  Loader2,
  Music,
  FileText,
  Scissors,
  Wand2,
  Settings,
  RotateCcw,
  ArrowLeftRight,
} from 'lucide-react';
import { toast } from 'sonner';

export default function VideoSection() {
  const [file, setFile] = useState<File | null>(null);
  const [videoUrl, setVideoUrl] = useState<string | null>(null);
  const [analysis, setAnalysis] = useState<VideoAnalysisResult | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [audioSeparation, setAudioSeparation] = useState<SeparationResult | null>(null);
  const [detectedEffects, setDetectedEffects] = useState<string[]>([]);
  const [showEnhancementSettings, setShowEnhancementSettings] = useState(false);
  const [enhancementResult, setEnhancementResult] = useState<VideoEnhancementResult | null>(null);
  const [showComparison, setShowComparison] = useState(false);
  const [progress, setProgress] = useState(0);
  const [enhancementSettings, setEnhancementSettings] = useState<VideoEnhancementSettings>({
    removeBlur: false,
    sharpenAmount: 0.5,
    restoreBrightness: false,
    brightnessLevel: 0,
    restoreContrast: false,
    contrastLevel: 0,
    restoreSaturation: false,
    saturationLevel: 1.2,
    removeNoise: false,
    noiseReduction: 1,
    stabilize: false,
  });
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    console.log('🎬 Video file select triggered');
    const selectedFile = e.target.files?.[0];
    console.log('🎬 Selected video file:', selectedFile);
    
    if (!selectedFile) {
      console.log('❌ No file selected');
      return;
    }
    
    console.log('📄 File details:', {
      name: selectedFile.name,
      type: selectedFile.type,
      size: selectedFile.size,
    });
    
    if (selectedFile.type.startsWith('video/')) {
      console.log('✅ Valid video file');
      setFile(selectedFile);
      const url = URL.createObjectURL(selectedFile);
      console.log('🔗 Created video URL:', url);
      setVideoUrl(url);
      setAnalysis(null);
      setAudioSeparation(null);
      setEnhancementResult(null);
      setShowComparison(false);
      setDetectedEffects([]);
      
      // Auto-detect effects
      const effects = await detectVideoEffects(url);
      setDetectedEffects(effects);
      
      if (effects.length > 0) {
        toast.info(`تم اكتشاف ${effects.length} تأثير على الفيديو`);
      }
      
      toast.success('تم تحميل الفيديو بنجاح!');
    } else {
      console.log('❌ Invalid file type');
      toast.error('يرجى اختيار ملف فيديو');
    }
  };

  const handleUploadClick = () => {
    console.log('🖱️ Video upload button clicked');
    console.log('📎 File input ref:', fileInputRef.current);
    if (fileInputRef.current) {
      console.log('✅ Triggering file input click');
      fileInputRef.current.click();
    } else {
      console.log('❌ File input ref is null');
    }
  };

  const handleAnalyze = async () => {
    if (!file) return;
    setIsProcessing(true);
    try {
      const result = await analyzeVideo(file);
      setAnalysis(result);
      toast.success('تم تحليل الفيديو بنجاح!');
    } catch (error) {
      toast.error('حدث خطأ أثناء التحليل');
    } finally {
      setIsProcessing(false);
    }
  };

  const handleExtractAudio = async () => {
    if (!videoUrl) return;
    setIsProcessing(true);

    try {
      toast.info('استخراج الصوت من الفيديو...');
      const audioUrl = await extractAudioFromVideo(videoUrl);
      
      toast.info('فصل المسارات الصوتية...');
      const result = await separateAudioTracks(audioUrl);
      setAudioSeparation(result);

      toast.success('تم استخراج وفصل الصوت بنجاح!', {
        description: `تم استخراج ${result.tracks.length} مسار صوتي`,
      });
    } catch (error) {
      toast.error('حدث خطأ أثناء استخراج الصوت');
    } finally {
      setIsProcessing(false);
    }
  };

  const handleEnhanceVideo = async () => {
    if (!videoUrl) return;
    setIsProcessing(true);
    setProgress(0);

    try {
      const result = await enhanceVideo(videoUrl, enhancementSettings, (p) => {
        setProgress(p);
      });
      
      setEnhancementResult(result);
      setShowComparison(true);
      toast.success('تم تحسين الفيديو بنجاح!');
    } catch (error) {
      toast.error('حدث خطأ أثناء تحسين الفيديو');
      console.error(error);
    } finally {
      setIsProcessing(false);
      setProgress(0);
    }
  };

  const handleDownloadAudioReport = () => {
    if (!audioSeparation) return;

    const report = generateAudioReport(audioSeparation.tracks, audioSeparation.totalDuration);
    const blob = new Blob([report], { type: 'text/plain;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'video_audio_extraction_report.txt';
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    toast.success('تم تحميل تقرير الصوت');
  };

  const handleDownloadEnhancedVideo = () => {
    if (!enhancementResult) return;
    
    const a = document.createElement('a');
    a.href = enhancementResult.processedVideoUrl;
    a.download = `enhanced_${file?.name || 'video.webm'}`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    toast.success('تم تحميل الفيديو المحسّن');
  };

  const updateSetting = <K extends keyof VideoEnhancementSettings>(
    key: K,
    value: VideoEnhancementSettings[K]
  ) => {
    setEnhancementSettings((prev) => ({ ...prev, [key]: value }));
  };

  return (
    <div className="space-y-6">
      <Card className="border-2 border-green-200 bg-gradient-to-br from-green-50 to-emerald-50">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-2xl">
            <VideoIcon className="w-6 h-6 text-green-600" />
            قسم الفيديو - تحليل وتحسين
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          {!file && (
            <div className="text-center space-y-4">
              <input
                ref={fileInputRef}
                type="file"
                accept="video/*"
                onChange={handleFileSelect}
                className="hidden"
              />
              <Button 
                size="lg" 
                className="w-full max-w-md bg-green-600 hover:bg-green-700"
                onClick={handleUploadClick}
                type="button"
              >
                <Upload className="w-5 h-5 mr-2" />
                رفع فيديو
              </Button>
              <p className="text-sm text-muted-foreground">
                يدعم جميع صيغ الفيديو (MP4, AVI, MOV, إلخ)
              </p>
            </div>
          )}

          {file && (
            <div className="space-y-6">
              <div className="grid md:grid-cols-2 gap-6">
                <div className="space-y-3">
                  <p className="font-semibold">
                    {showComparison ? 'الفيديو الأصلي' : 'الفيديو'}
                  </p>
                  <div className="aspect-video bg-black rounded-lg overflow-hidden">
                    <video src={videoUrl!} controls className="w-full h-full" />
                  </div>
                </div>

                {showComparison && enhancementResult && (
                  <div className="space-y-3">
                    <p className="font-semibold">الفيديو المحسّن</p>
                    <div className="aspect-video bg-black rounded-lg overflow-hidden">
                      <video src={enhancementResult.processedVideoUrl} controls className="w-full h-full" />
                    </div>
                  </div>
                )}
              </div>

              {detectedEffects.length > 0 && (
                <Card className="border-2 bg-gradient-to-r from-amber-50 to-orange-50">
                  <CardContent className="p-4">
                    <div className="flex items-center justify-between mb-3">
                      <h4 className="font-semibold flex items-center gap-2">
                        <Wand2 className="w-4 h-4" />
                        التأثيرات المكتشفة ({detectedEffects.length})
                      </h4>
                      <Button
                        onClick={() => setShowEnhancementSettings(!showEnhancementSettings)}
                        variant="outline"
                        size="sm"
                      >
                        <Settings className="w-4 h-4 mr-2" />
                        {showEnhancementSettings ? 'إخفاء الإعدادات' : 'إعدادات التحسين'}
                      </Button>
                    </div>
                    <div className="flex flex-wrap gap-2">
                      {detectedEffects.map((effect, index) => (
                        <Badge key={index} variant="secondary">
                          {effect}
                        </Badge>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              )}

              {showEnhancementSettings && (
                <Card className="border-2 bg-white">
                  <CardHeader>
                    <CardTitle className="text-lg">إعدادات تحسين الفيديو</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-6">
                    <div className="space-y-3">
                      <div className="flex items-center justify-between">
                        <Label>إزالة التشويش (Sharpen)</Label>
                        <Switch
                          checked={enhancementSettings.removeBlur}
                          onCheckedChange={(checked) => updateSetting('removeBlur', checked)}
                        />
                      </div>
                      {enhancementSettings.removeBlur && (
                        <div className="space-y-2">
                          <div className="flex items-center justify-between text-sm">
                            <span>قوة الحدة</span>
                            <span>{(enhancementSettings.sharpenAmount * 100).toFixed(0)}%</span>
                          </div>
                          <Slider
                            value={[enhancementSettings.sharpenAmount]}
                            min={0}
                            max={1}
                            step={0.1}
                            onValueChange={([value]) => updateSetting('sharpenAmount', value)}
                          />
                        </div>
                      )}
                    </div>

                    <Separator />

                    <div className="space-y-3">
                      <div className="flex items-center justify-between">
                        <Label>استعادة السطوع</Label>
                        <Switch
                          checked={enhancementSettings.restoreBrightness}
                          onCheckedChange={(checked) => updateSetting('restoreBrightness', checked)}
                        />
                      </div>
                      {enhancementSettings.restoreBrightness && (
                        <div className="space-y-2">
                          <div className="flex items-center justify-between text-sm">
                            <span>مستوى السطوع</span>
                            <span>{enhancementSettings.brightnessLevel}</span>
                          </div>
                          <Slider
                            value={[enhancementSettings.brightnessLevel]}
                            min={-50}
                            max={50}
                            step={5}
                            onValueChange={([value]) => updateSetting('brightnessLevel', value)}
                          />
                        </div>
                      )}
                    </div>

                    <Separator />

                    <div className="space-y-3">
                      <div className="flex items-center justify-between">
                        <Label>استعادة التباين</Label>
                        <Switch
                          checked={enhancementSettings.restoreContrast}
                          onCheckedChange={(checked) => updateSetting('restoreContrast', checked)}
                        />
                      </div>
                      {enhancementSettings.restoreContrast && (
                        <div className="space-y-2">
                          <div className="flex items-center justify-between text-sm">
                            <span>مستوى التباين</span>
                            <span>{enhancementSettings.contrastLevel}</span>
                          </div>
                          <Slider
                            value={[enhancementSettings.contrastLevel]}
                            min={-50}
                            max={50}
                            step={5}
                            onValueChange={([value]) => updateSetting('contrastLevel', value)}
                          />
                        </div>
                      )}
                    </div>

                    <Separator />

                    <div className="space-y-3">
                      <div className="flex items-center justify-between">
                        <Label>استعادة التشبع اللوني</Label>
                        <Switch
                          checked={enhancementSettings.restoreSaturation}
                          onCheckedChange={(checked) => updateSetting('restoreSaturation', checked)}
                        />
                      </div>
                      {enhancementSettings.restoreSaturation && (
                        <div className="space-y-2">
                          <div className="flex items-center justify-between text-sm">
                            <span>مستوى التشبع</span>
                            <span>{enhancementSettings.saturationLevel.toFixed(1)}</span>
                          </div>
                          <Slider
                            value={[enhancementSettings.saturationLevel]}
                            min={0}
                            max={2}
                            step={0.1}
                            onValueChange={([value]) => updateSetting('saturationLevel', value)}
                          />
                        </div>
                      )}
                    </div>

                    <Separator />

                    <div className="space-y-3">
                      <div className="flex items-center justify-between">
                        <Label>إزالة الضوضاء</Label>
                        <Switch
                          checked={enhancementSettings.removeNoise}
                          onCheckedChange={(checked) => updateSetting('removeNoise', checked)}
                        />
                      </div>
                      {enhancementSettings.removeNoise && (
                        <div className="space-y-2">
                          <div className="flex items-center justify-between text-sm">
                            <span>قوة الإزالة</span>
                            <span>{enhancementSettings.noiseReduction}</span>
                          </div>
                          <Slider
                            value={[enhancementSettings.noiseReduction]}
                            min={0}
                            max={3}
                            step={0.5}
                            onValueChange={([value]) => updateSetting('noiseReduction', value)}
                          />
                        </div>
                      )}
                    </div>

                    <Button
                      onClick={handleEnhanceVideo}
                      disabled={isProcessing}
                      className="w-full bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700"
                      size="lg"
                    >
                      {isProcessing ? (
                        <>
                          <Loader2 className="w-5 h-5 mr-2 animate-spin" />
                          جاري التحسين...
                        </>
                      ) : (
                        <>
                          <Wand2 className="w-5 h-5 mr-2" />
                          تطبيق التحسين
                        </>
                      )}
                    </Button>

                    {isProcessing && progress > 0 && (
                      <div className="space-y-2">
                        <Progress value={progress} className="h-3" />
                        <p className="text-sm text-center text-muted-foreground">
                          {progress.toFixed(0)}% - معالجة الإطارات...
                        </p>
                      </div>
                    )}
                  </CardContent>
                </Card>
              )}

              <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                <Button
                  onClick={handleAnalyze}
                  disabled={isProcessing}
                  variant="outline"
                  className="w-full"
                >
                  {isProcessing ? (
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  ) : (
                    <Scan className="w-4 h-4 mr-2" />
                  )}
                  تحليل الفيديو
                </Button>

                <Button
                  onClick={handleExtractAudio}
                  disabled={isProcessing}
                  className="w-full bg-purple-600 hover:bg-purple-700"
                >
                  {isProcessing ? (
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  ) : (
                    <Scissors className="w-4 h-4 mr-2" />
                  )}
                  استخراج الصوت
                </Button>

                <Button
                  onClick={() => setShowComparison(!showComparison)}
                  disabled={!enhancementResult}
                  variant="outline"
                  className="w-full"
                >
                  <ArrowLeftRight className="w-4 h-4 mr-2" />
                  مقارنة
                </Button>

                <Button
                  onClick={() => {
                    setFile(null);
                    setVideoUrl(null);
                    setAnalysis(null);
                    setAudioSeparation(null);
                    setEnhancementResult(null);
                    setShowComparison(false);
                    setDetectedEffects([]);
                  }}
                  variant="outline"
                  className="w-full"
                >
                  <RotateCcw className="w-4 h-4 mr-2" />
                  إعادة تعيين
                </Button>
              </div>

              {enhancementResult && (
                <Button
                  onClick={handleDownloadEnhancedVideo}
                  className="w-full bg-green-600 hover:bg-green-700"
                  size="lg"
                >
                  <Download className="w-5 h-5 mr-2" />
                  تحميل الفيديو المحسّن
                </Button>
              )}

              {analysis && (
                <Card className="border-2 bg-white">
                  <CardHeader>
                    <CardTitle className="text-lg">نتائج التحليل</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                      <div>
                        <p className="text-sm text-muted-foreground">الحجم</p>
                        <p className="font-medium">{(analysis.size / (1024 * 1024)).toFixed(1)} MB</p>
                      </div>
                      <div>
                        <p className="text-sm text-muted-foreground">المدة</p>
                        <p className="font-medium">{analysis.duration.toFixed(1)}s</p>
                      </div>
                      <div>
                        <p className="text-sm text-muted-foreground">الأبعاد</p>
                        <p className="font-medium">
                          {analysis.width} × {analysis.height}
                        </p>
                      </div>
                      <div>
                        <p className="text-sm text-muted-foreground">معدل الإطارات</p>
                        <p className="font-medium">{analysis.fps} fps</p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              )}

              {audioSeparation && (
                <Card className="border-2 bg-gradient-to-r from-purple-50 to-pink-50">
                  <CardHeader>
                    <CardTitle className="text-lg flex items-center gap-2">
                      <Music className="w-5 h-5" />
                      المسارات الصوتية المستخرجة
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="grid grid-cols-2 gap-4">
                      <div className="p-3 rounded-lg bg-white border">
                        <p className="text-sm text-muted-foreground">عدد المسارات</p>
                        <p className="text-2xl font-bold text-purple-600">
                          {audioSeparation.tracks.length}
                        </p>
                      </div>
                      <div className="p-3 rounded-lg bg-white border">
                        <p className="text-sm text-muted-foreground">جودة الفصل</p>
                        <p className="text-2xl font-bold text-green-600">
                          {(audioSeparation.separationQuality * 100).toFixed(0)}%
                        </p>
                      </div>
                    </div>

                    <Separator />

                    <div className="space-y-2">
                      {audioSeparation.tracks.map((track) => (
                        <div
                          key={track.id}
                          className="flex items-center justify-between p-3 rounded-lg bg-white border"
                        >
                          <div className="flex items-center gap-3">
                            <Music className="w-4 h-4 text-purple-600" />
                            <div>
                              <p className="font-medium text-sm">{track.name}</p>
                              <p className="text-xs text-muted-foreground">
                                {track.duration.toFixed(2)} ثانية
                              </p>
                            </div>
                          </div>
                          <Button 
                            size="sm" 
                            variant="ghost"
                            onClick={() => {
                              const a = document.createElement('a');
                              a.href = track.url;
                              a.download = `${track.name}.wav`;
                              document.body.appendChild(a);
                              a.click();
                              document.body.removeChild(a);
                              toast.success(`تم تحميل ${track.name}`);
                            }}
                          >
                            <Download className="w-4 h-4" />
                          </Button>
                        </div>
                      ))}
                    </div>

                    <Button
                      onClick={handleDownloadAudioReport}
                      className="w-full"
                      variant="outline"
                    >
                      <FileText className="w-4 h-4 mr-2" />
                      تحميل تقرير الصوت الكامل
                    </Button>
                  </CardContent>
                </Card>
              )}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}