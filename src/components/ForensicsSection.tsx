import { useState, useRef } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import {
  detectVideoManipulation,
  detectAudioManipulation,
  restoreOriginal,
  ManipulationDetectionResult,
} from '@/lib/mediaForensics';
import {
  detectAIGeneration,
  generateAIDetectionReport,
  AIDetectionResult,
} from '@/lib/aiDetection';
import {
  Upload,
  Shield,
  AlertTriangle,
  CheckCircle2,
  Loader2,
  RotateCcw,
  Download,
  Scan,
  FileVideo,
  Music,
  Bot,
  MapPin,
  Globe,
  Smartphone,
  Camera,
  FileText,
} from 'lucide-react';
import { toast } from 'sonner';

export default function ForensicsSection() {
  const [videoFile, setVideoFile] = useState<File | null>(null);
  const [videoUrl, setVideoUrl] = useState<string | null>(null);
  const [audioFile, setAudioFile] = useState<File | null>(null);
  const [audioUrl, setAudioUrl] = useState<string | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [progress, setProgress] = useState(0);
  const [videoResult, setVideoResult] = useState<ManipulationDetectionResult | null>(null);
  const [audioResult, setAudioResult] = useState<ManipulationDetectionResult | null>(null);
  const [aiDetectionResult, setAiDetectionResult] = useState<AIDetectionResult | null>(null);
  const [isRestoring, setIsRestoring] = useState(false);

  const videoInputRef = useRef<HTMLInputElement>(null);
  const audioInputRef = useRef<HTMLInputElement>(null);

  const handleVideoSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    console.log('🎬 Forensics video select triggered');
    const file = e.target.files?.[0];
    console.log('🎬 Selected file:', file);
    
    if (!file) {
      console.log('❌ No file selected');
      return;
    }
    
    if (file.type.startsWith('video/')) {
      console.log('✅ Valid video file');
      setVideoFile(file);
      setVideoUrl(URL.createObjectURL(file));
      setVideoResult(null);
      setAiDetectionResult(null);
      toast.success('تم تحميل الفيديو');
    } else {
      console.log('❌ Invalid file type');
      toast.error('يرجى اختيار ملف فيديو');
    }
  };

  const handleAudioSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    console.log('🎵 Forensics audio select triggered');
    const file = e.target.files?.[0];
    console.log('🎵 Selected file:', file);
    
    if (!file) {
      console.log('❌ No file selected');
      return;
    }
    
    if (file.type.startsWith('audio/') || file.type.startsWith('video/')) {
      console.log('✅ Valid audio/video file');
      setAudioFile(file);
      setAudioUrl(URL.createObjectURL(file));
      setAudioResult(null);
      toast.success('تم تحميل الصوت');
    } else {
      console.log('❌ Invalid file type');
      toast.error('يرجى اختيار ملف صوتي أو فيديو');
    }
  };

  const handleVideoAnalysis = async () => {
    if (!videoUrl) return;

    setIsProcessing(true);
    setProgress(0);

    const interval = setInterval(() => {
      setProgress((prev) => (prev >= 90 ? 90 : prev + 10));
    }, 300);

    try {
      const result = await detectVideoManipulation(videoUrl);
      setVideoResult(result);
      setProgress(100);

      if (result.isManipulated) {
        toast.warning('تم اكتشاف تلاعب في الفيديو!', {
          description: `نسبة التلاعب: ${result.manipulationPercentage.toFixed(1)}%`,
        });
      } else {
        toast.success('الفيديو أصلي أو لم يتم اكتشاف تلاعب كبير');
      }
    } catch (error) {
      toast.error('حدث خطأ أثناء التحليل');
    } finally {
      clearInterval(interval);
      setIsProcessing(false);
    }
  };

  const handleAIDetection = async () => {
    if (!videoUrl) return;

    setIsProcessing(true);
    setProgress(0);

    const interval = setInterval(() => {
      setProgress((prev) => (prev >= 90 ? 90 : prev + 10));
    }, 400);

    try {
      const result = await detectAIGeneration(videoUrl, 'video');
      setAiDetectionResult(result);
      setProgress(100);

      if (result.isAIGenerated) {
        toast.warning('تم اكتشاف محتوى مولد بالذكاء الاصطناعي!', {
          description: `نسبة الاحتمالية: ${result.aiProbability.toFixed(1)}%`,
        });
      } else {
        toast.success('المحتوى يبدو أصلياً');
      }
    } catch (error) {
      toast.error('حدث خطأ أثناء الكشف');
    } finally {
      clearInterval(interval);
      setIsProcessing(false);
    }
  };

  const handleAudioAnalysis = async () => {
    if (!audioUrl) return;

    setIsProcessing(true);
    setProgress(0);

    const interval = setInterval(() => {
      setProgress((prev) => (prev >= 90 ? 90 : prev + 10));
    }, 300);

    try {
      const result = await detectAudioManipulation(audioUrl);
      setAudioResult(result);
      setProgress(100);

      if (result.isManipulated) {
        toast.warning('تم اكتشاف تلاعب في الصوت!', {
          description: `نسبة التلاعب: ${result.manipulationPercentage.toFixed(1)}%`,
        });
      } else {
        toast.success('الصوت أصلي أو لم يتم اكتشاف تلاعب كبير');
      }
    } catch (error) {
      toast.error('حدث خطأ أثناء التحليل');
    } finally {
      clearInterval(interval);
      setIsProcessing(false);
    }
  };

  const handleRestore = async (type: 'video' | 'audio') => {
    setIsRestoring(true);

    try {
      if (type === 'video' && videoResult && videoUrl) {
        await restoreOriginal(videoUrl, videoResult.detectedEffects);
        toast.success('تم استعادة الفيديو الأصلي بنجاح!');
      } else if (type === 'audio' && audioResult && audioUrl) {
        await restoreOriginal(audioUrl, audioResult.detectedEffects);
        toast.success('تم استعادة الصوت الأصلي بنجاح!');
      }
    } catch (error) {
      toast.error('حدث خطأ أثناء الاستعادة');
    } finally {
      setIsRestoring(false);
    }
  };

  const handleDownloadAIReport = () => {
    if (!aiDetectionResult) return;

    const report = generateAIDetectionReport(aiDetectionResult);
    const blob = new Blob([report], { type: 'text/plain;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'ai_detection_report.txt';
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    toast.success('تم تحميل التقرير');
  };

  const getSeverityColor = (severity: string) => {
    switch (severity) {
      case 'high':
        return 'bg-red-900 text-red-200 border-red-700';
      case 'medium':
        return 'bg-yellow-900 text-yellow-200 border-yellow-700';
      case 'low':
        return 'bg-blue-900 text-blue-200 border-blue-700';
      default:
        return 'bg-gray-900 text-gray-200 border-gray-700';
    }
  };

  return (
    <div className="space-y-6">
      <Card className="border-2 border-orange-200 bg-gradient-to-br from-orange-950 to-red-950 text-orange-50">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-2xl text-orange-100">
            <Shield className="w-6 h-6 text-orange-400" />
            نظام الطب الشرعي الرقمي - كشف التلاعب والذكاء الاصطناعي
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-8">
          {/* Video Forensics */}
          <div className="space-y-4 p-6 rounded-lg border-2 border-orange-700 bg-orange-950/50">
            <h3 className="text-xl font-bold flex items-center gap-2 text-orange-300">
              <FileVideo className="w-5 h-5" />
              تحليل الفيديو الشامل
            </h3>

            <div className="space-y-4">
              <input
                ref={videoInputRef}
                type="file"
                accept="video/*"
                onChange={handleVideoSelect}
                className="hidden"
              />
              <div 
                onClick={() => videoInputRef.current?.click()}
                className="cursor-pointer border-2 border-dashed border-orange-600 rounded-lg p-6 hover:border-orange-400 transition-colors"
              >
                {videoUrl ? (
                  <video src={videoUrl} className="w-full h-64 object-contain rounded" controls />
                ) : (
                  <div className="text-center py-12">
                    <Upload className="w-12 h-12 mx-auto mb-3 text-orange-400" />
                    <p className="text-orange-300 font-medium">رفع فيديو للتحليل الشامل</p>
                    <p className="text-sm text-orange-500 mt-1">
                      كشف التلاعب، الذكاء الاصطناعي، والبيانات الوصفية
                    </p>
                  </div>
                )}
              </div>

              {videoFile && (
                <div className="grid grid-cols-2 gap-3">
                  <Button
                    onClick={handleVideoAnalysis}
                    disabled={isProcessing}
                    className="w-full bg-orange-600 hover:bg-orange-700"
                    size="lg"
                  >
                    {isProcessing ? (
                      <>
                        <Loader2 className="w-5 h-5 mr-2 animate-spin" />
                        جاري التحليل...
                      </>
                    ) : (
                      <>
                        <Scan className="w-5 h-5 mr-2" />
                        كشف التلاعب
                      </>
                    )}
                  </Button>

                  <Button
                    onClick={handleAIDetection}
                    disabled={isProcessing}
                    className="w-full bg-purple-600 hover:bg-purple-700"
                    size="lg"
                  >
                    {isProcessing ? (
                      <>
                        <Loader2 className="w-5 h-5 mr-2 animate-spin" />
                        جاري الكشف...
                      </>
                    ) : (
                      <>
                        <Bot className="w-5 h-5 mr-2" />
                        كشف الذكاء الاصطناعي
                      </>
                    )}
                  </Button>
                </div>
              )}

              {isProcessing && (
                <div className="space-y-2">
                  <Progress value={progress} className="h-3" />
                  <p className="text-sm text-center text-orange-300">{progress}%</p>
                </div>
              )}

              {aiDetectionResult && (
                <Card className="border-2 border-purple-600 bg-purple-900/50">
                  <CardContent className="p-6 space-y-4">
                    <div className="flex items-center justify-between">
                      <h4 className="text-lg font-bold text-purple-200 flex items-center gap-2">
                        <Bot className="w-5 h-5" />
                        نتائج كشف الذكاء الاصطناعي
                      </h4>
                      {aiDetectionResult.isAIGenerated ? (
                        <AlertTriangle className="w-6 h-6 text-red-400" />
                      ) : (
                        <CheckCircle2 className="w-6 h-6 text-green-400" />
                      )}
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                      <div className="p-4 rounded-lg bg-purple-950/50 border border-purple-700">
                        <p className="text-sm text-purple-400">احتمالية الذكاء الاصطناعي</p>
                        <p className="text-3xl font-bold text-purple-100">
                          {aiDetectionResult.aiProbability.toFixed(1)}%
                        </p>
                      </div>
                      <div className="p-4 rounded-lg bg-purple-950/50 border border-purple-700">
                        <p className="text-sm text-purple-400">مستوى الثقة</p>
                        <p className="text-3xl font-bold text-purple-100">
                          {(aiDetectionResult.confidence * 100).toFixed(0)}%
                        </p>
                      </div>
                    </div>

                    <div className="p-4 rounded-lg bg-purple-950/50 border border-purple-700">
                      <p className="text-sm text-purple-400 mb-2">التحليل</p>
                      <p className="text-purple-100">{aiDetectionResult.analysisDetails}</p>
                    </div>

                    {aiDetectionResult.detectedTools.length > 0 && (
                      <div className="space-y-3">
                        <p className="text-sm font-bold text-purple-300">
                          الأدوات المكتشفة ({aiDetectionResult.detectedTools.length}):
                        </p>
                        <div className="space-y-2">
                          {aiDetectionResult.detectedTools.map((tool, index) => (
                            <div
                              key={index}
                              className="p-4 rounded-lg border-2 bg-purple-950/50 border-purple-700"
                            >
                              <div className="flex items-start justify-between mb-2">
                                <div className="flex items-center gap-2">
                                  <Bot className="w-4 h-4" />
                                  <span className="font-bold">{tool.name}</span>
                                </div>
                                <Badge variant="outline" className="text-xs">
                                  {tool.probability.toFixed(0)}%
                                </Badge>
                              </div>
                              <p className="text-sm opacity-90 mb-1">{tool.description}</p>
                              <p className="text-xs opacity-75">الفئة: {tool.category}</p>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                    <Separator />

                    <div className="space-y-3">
                      <h5 className="font-bold text-purple-300 flex items-center gap-2">
                        <Globe className="w-4 h-4" />
                        البيانات الوصفية (Metadata)
                      </h5>

                      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                        <div className="p-3 rounded-lg bg-purple-950/50 border border-purple-700">
                          <div className="flex items-center gap-2 mb-1">
                            <MapPin className="w-4 h-4 text-purple-400" />
                            <p className="text-xs text-purple-400">عنوان IP</p>
                          </div>
                          <p className="text-sm font-mono">{aiDetectionResult.metadata.ipAddress}</p>
                        </div>

                        <div className="p-3 rounded-lg bg-purple-950/50 border border-purple-700">
                          <div className="flex items-center gap-2 mb-1">
                            <Globe className="w-4 h-4 text-purple-400" />
                            <p className="text-xs text-purple-400">موقع الرفع</p>
                          </div>
                          <p className="text-sm">{aiDetectionResult.metadata.uploadLocation}</p>
                        </div>

                        <div className="p-3 rounded-lg bg-purple-950/50 border border-purple-700">
                          <div className="flex items-center gap-2 mb-1">
                            <Smartphone className="w-4 h-4 text-purple-400" />
                            <p className="text-xs text-purple-400">الجهاز</p>
                          </div>
                          <p className="text-sm">{aiDetectionResult.metadata.deviceInfo}</p>
                        </div>

                        <div className="p-3 rounded-lg bg-purple-950/50 border border-purple-700">
                          <div className="flex items-center gap-2 mb-1">
                            <Camera className="w-4 h-4 text-purple-400" />
                            <p className="text-xs text-purple-400">الكاميرا</p>
                          </div>
                          <p className="text-sm">{aiDetectionResult.metadata.cameraModel}</p>
                        </div>

                        <div className="p-3 rounded-lg bg-purple-950/50 border border-purple-700 md:col-span-2">
                          <div className="flex items-center gap-2 mb-1">
                            <MapPin className="w-4 h-4 text-purple-400" />
                            <p className="text-xs text-purple-400">الإحداثيات GPS</p>
                          </div>
                          <p className="text-sm font-mono">{aiDetectionResult.metadata.gpsCoordinates}</p>
                        </div>
                      </div>
                    </div>

                    <Button
                      onClick={handleDownloadAIReport}
                      className="w-full bg-purple-600 hover:bg-purple-700"
                    >
                      <FileText className="w-4 h-4 mr-2" />
                      تحميل التقرير الكامل
                    </Button>
                  </CardContent>
                </Card>
              )}

              {videoResult && (
                <Card className="border-2 border-orange-600 bg-orange-900/50">
                  <CardContent className="p-6 space-y-4">
                    <div className="flex items-center justify-between">
                      <h4 className="text-lg font-bold text-orange-200">نتائج كشف التلاعب</h4>
                      {videoResult.isManipulated ? (
                        <AlertTriangle className="w-6 h-6 text-red-400" />
                      ) : (
                        <CheckCircle2 className="w-6 h-6 text-green-400" />
                      )}
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                      <div className="p-4 rounded-lg bg-orange-950/50 border border-orange-700">
                        <p className="text-sm text-orange-400">نسبة التلاعب</p>
                        <p className="text-3xl font-bold text-orange-100">
                          {videoResult.manipulationPercentage.toFixed(1)}%
                        </p>
                      </div>
                      <div className="p-4 rounded-lg bg-orange-950/50 border border-orange-700">
                        <p className="text-sm text-orange-400">مستوى الثقة</p>
                        <p className="text-3xl font-bold text-orange-100">
                          {(videoResult.confidence * 100).toFixed(0)}%
                        </p>
                      </div>
                    </div>

                    <div className="p-4 rounded-lg bg-orange-950/50 border border-orange-700">
                      <p className="text-sm text-orange-400 mb-2">التقييم</p>
                      <p className="text-orange-100">{videoResult.originalEstimate}</p>
                    </div>

                    {videoResult.detectedEffects.length > 0 && (
                      <div className="space-y-3">
                        <p className="text-sm font-bold text-orange-300">
                          المؤثرات المكتشفة ({videoResult.detectedEffects.length}):
                        </p>
                        <div className="space-y-2">
                          {videoResult.detectedEffects.map((effect, index) => (
                            <div
                              key={index}
                              className={`p-4 rounded-lg border-2 ${getSeverityColor(effect.severity)}`}
                            >
                              <div className="flex items-start justify-between mb-2">
                                <div className="flex items-center gap-2">
                                  <Badge variant="outline" className="text-xs">
                                    {effect.severity === 'high'
                                      ? 'عالي'
                                      : effect.severity === 'medium'
                                      ? 'متوسط'
                                      : 'منخفض'}
                                  </Badge>
                                  <span className="font-bold">{effect.type}</span>
                                </div>
                                <span className="text-xs opacity-75">
                                  {(effect.confidence * 100).toFixed(0)}% ثقة
                                </span>
                              </div>
                              <p className="text-sm opacity-90 mb-1">{effect.description}</p>
                              <p className="text-xs opacity-75">الموقع: {effect.location}</p>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                    <div className="flex gap-3 pt-4">
                      <Button
                        onClick={() => handleRestore('video')}
                        disabled={isRestoring || !videoResult.isManipulated}
                        className="flex-1 bg-green-600 hover:bg-green-700"
                      >
                        {isRestoring ? (
                          <>
                            <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                            جاري الاستعادة...
                          </>
                        ) : (
                          <>
                            <RotateCcw className="w-4 h-4 mr-2" />
                            استعادة الأصل
                          </>
                        )}
                      </Button>
                      <Button variant="outline" className="flex-1">
                        <Download className="w-4 h-4 mr-2" />
                        تحميل التقرير
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              )}
            </div>
          </div>

          {/* Audio Forensics */}
          <div className="space-y-4 p-6 rounded-lg border-2 border-purple-700 bg-purple-950/50">
            <h3 className="text-xl font-bold flex items-center gap-2 text-purple-300">
              <Music className="w-5 h-5" />
              تحليل الصوت وكشف التلاعب
            </h3>

            <div className="space-y-4">
              <input
                ref={audioInputRef}
                type="file"
                accept="audio/*,video/*"
                onChange={handleAudioSelect}
                className="hidden"
              />
              <div 
                onClick={() => audioInputRef.current?.click()}
                className="cursor-pointer border-2 border-dashed border-purple-600 rounded-lg p-8 hover:border-purple-400 transition-colors text-center"
              >
                {audioFile ? (
                  <div>
                    <CheckCircle2 className="w-12 h-12 mx-auto mb-3 text-green-400" />
                    <p className="text-purple-200 font-medium">{audioFile.name}</p>
                  </div>
                ) : (
                  <>
                    <Upload className="w-12 h-12 mx-auto mb-3 text-purple-400" />
                    <p className="text-purple-300 font-medium">رفع ملف صوتي للتحليل</p>
                    <p className="text-sm text-purple-500 mt-1">
                      سيتم فحص الصوت للكشف عن أي تلاعب أو تعديلات
                    </p>
                  </>
                )}
              </div>

              {audioFile && !audioResult && (
                <Button
                  onClick={handleAudioAnalysis}
                  disabled={isProcessing}
                  className="w-full bg-purple-600 hover:bg-purple-700"
                  size="lg"
                >
                  {isProcessing ? (
                    <>
                      <Loader2 className="w-5 h-5 mr-2 animate-spin" />
                      جاري التحليل...
                    </>
                  ) : (
                    <>
                      <Scan className="w-5 h-5 mr-2" />
                      تحليل الصوت وكشف التلاعب
                    </>
                  )}
                </Button>
              )}

              {audioResult && (
                <Card className="border-2 border-purple-600 bg-purple-900/50">
                  <CardContent className="p-6 space-y-4">
                    <div className="flex items-center justify-between">
                      <h4 className="text-lg font-bold text-purple-200">نتائج التحليل</h4>
                      {audioResult.isManipulated ? (
                        <AlertTriangle className="w-6 h-6 text-red-400" />
                      ) : (
                        <CheckCircle2 className="w-6 h-6 text-green-400" />
                      )}
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                      <div className="p-4 rounded-lg bg-purple-950/50 border border-purple-700">
                        <p className="text-sm text-purple-400">نسبة التلاعب</p>
                        <p className="text-3xl font-bold text-purple-100">
                          {audioResult.manipulationPercentage.toFixed(1)}%
                        </p>
                      </div>
                      <div className="p-4 rounded-lg bg-purple-950/50 border border-purple-700">
                        <p className="text-sm text-purple-400">مستوى الثقة</p>
                        <p className="text-3xl font-bold text-purple-100">
                          {(audioResult.confidence * 100).toFixed(0)}%
                        </p>
                      </div>
                    </div>

                    <div className="p-4 rounded-lg bg-purple-950/50 border border-purple-700">
                      <p className="text-sm text-purple-400 mb-2">التقييم</p>
                      <p className="text-purple-100">{audioResult.originalEstimate}</p>
                    </div>

                    {audioResult.detectedEffects.length > 0 && (
                      <div className="space-y-3">
                        <p className="text-sm font-bold text-purple-300">
                          المؤثرات المكتشفة ({audioResult.detectedEffects.length}):
                        </p>
                        <div className="space-y-2">
                          {audioResult.detectedEffects.map((effect, index) => (
                            <div
                              key={index}
                              className={`p-4 rounded-lg border-2 ${getSeverityColor(effect.severity)}`}
                            >
                              <div className="flex items-start justify-between mb-2">
                                <div className="flex items-center gap-2">
                                  <Badge variant="outline" className="text-xs">
                                    {effect.severity === 'high'
                                      ? 'عالي'
                                      : effect.severity === 'medium'
                                      ? 'متوسط'
                                      : 'منخفض'}
                                  </Badge>
                                  <span className="font-bold">{effect.type}</span>
                                </div>
                                <span className="text-xs opacity-75">
                                  {(effect.confidence * 100).toFixed(0)}% ثقة
                                </span>
                              </div>
                              <p className="text-sm opacity-90 mb-1">{effect.description}</p>
                              <p className="text-xs opacity-75">الموقع: {effect.location}</p>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                    <div className="flex gap-3 pt-4">
                      <Button
                        onClick={() => handleRestore('audio')}
                        disabled={isRestoring || !audioResult.isManipulated}
                        className="flex-1 bg-green-600 hover:bg-green-700"
                      >
                        {isRestoring ? (
                          <>
                            <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                            جاري الاستعادة...
                          </>
                        ) : (
                          <>
                            <RotateCcw className="w-4 h-4 mr-2" />
                            استعادة الأصل
                          </>
                        )}
                      </Button>
                      <Button variant="outline" className="flex-1">
                        <Download className="w-4 h-4 mr-2" />
                        تحميل التقرير
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              )}
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}