import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Separator } from '@/components/ui/separator';
import {
  AudioTrack,
  VoiceAnalysis,
  analyzeVoiceCharacteristics,
} from '@/lib/audioAnalysis';
import {
  User,
  MapPin,
  Calendar,
  Activity,
  TrendingUp,
  Mic2,
  Loader2,
  Volume2,
  Zap,
  Radio,
  Smile,
  Clock,
  Speaker,
} from 'lucide-react';
import { toast } from 'sonner';

interface VoiceAnalyzerProps {
  track: AudioTrack;
  onAnalysisComplete?: (analysis: VoiceAnalysis) => void;
}

export default function VoiceAnalyzer({ track, onAnalysisComplete }: VoiceAnalyzerProps) {
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [analysis, setAnalysis] = useState<VoiceAnalysis | null>(track.analysis || null);

  const handleAnalyze = async () => {
    setIsAnalyzing(true);

    try {
      const result = await analyzeVoiceCharacteristics(track.audioUrl);
      setAnalysis(result);
      
      if (onAnalysisComplete) {
        onAnalysisComplete(result);
      }

      toast.success('تم تحليل الصوت بنجاح!', {
        description: 'تم استخراج جميع المعلومات الصوتية',
      });
    } catch (error) {
      console.error('Error analyzing voice:', error);
      toast.error('حدث خطأ أثناء تحليل الصوت');
    } finally {
      setIsAnalyzing(false);
    }
  };

  const getGenderLabel = (gender: string) => {
    switch (gender) {
      case 'male':
        return 'ذكر';
      case 'female':
        return 'أنثى';
      default:
        return 'غير محدد';
    }
  };

  const getGenderColor = (gender: string) => {
    switch (gender) {
      case 'male':
        return 'bg-blue-100 text-blue-800 border-blue-300';
      case 'female':
        return 'bg-pink-100 text-pink-800 border-pink-300';
      default:
        return 'bg-gray-100 text-gray-800 border-gray-300';
    }
  };

  const getConfidenceColor = (confidence: number) => {
    if (confidence >= 0.8) return 'text-green-600';
    if (confidence >= 0.6) return 'text-yellow-600';
    return 'text-red-600';
  };

  const getNoiseColor = (noise: number) => {
    if (noise < 10) return 'text-green-600';
    if (noise < 20) return 'text-yellow-600';
    return 'text-red-600';
  };

  return (
    <Card className="border-2">
      <CardHeader className="bg-gradient-to-r from-indigo-50 to-purple-50">
        <CardTitle className="flex items-center gap-2">
          <Mic2 className="w-5 h-5" />
          تحليل الصوت المتقدم - {track.name}
        </CardTitle>
      </CardHeader>
      <CardContent className="pt-6 space-y-6">
        {!analysis && !isAnalyzing && (
          <div className="space-y-4">
            <div className="flex items-start gap-3 p-4 rounded-lg bg-gradient-to-r from-indigo-50 to-purple-50 border-2 border-indigo-200">
              <Activity className="w-5 h-5 text-indigo-600 mt-0.5 flex-shrink-0" />
              <div className="space-y-1">
                <p className="text-sm font-medium text-indigo-900">
                  تحليل ذكي شامل للخصائص الصوتية
                </p>
                <p className="text-xs text-indigo-700">
                  سيتم تحليل الصوت بشكل شامل لاستخراج معلومات مفصلة مثل: الجنس، العمر،
                  اللهجة، البلد، الحالة العاطفية، سرعة الكلام، مستوى الصوت، الطاقة،
                  الوضوح، والضوضاء الخلفية.
                </p>
              </div>
            </div>

            <Button
              onClick={handleAnalyze}
              className="w-full bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700"
              size="lg"
            >
              <Activity className="w-5 h-5 mr-2" />
              بدء التحليل الصوتي الشامل
            </Button>
          </div>
        )}

        {isAnalyzing && (
          <div className="flex flex-col items-center justify-center py-8 space-y-4">
            <Loader2 className="w-12 h-12 text-primary animate-spin" />
            <p className="text-sm font-medium text-muted-foreground">
              جاري تحليل الخصائص الصوتية بشكل شامل...
            </p>
          </div>
        )}

        {analysis && (
          <div className="space-y-6">
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
              <Card className="border-2">
                <CardContent className="p-4 space-y-3">
                  <div className="flex items-center gap-2">
                    <User className="w-5 h-5 text-muted-foreground" />
                    <p className="text-sm font-medium text-muted-foreground">الجنس</p>
                  </div>
                  <Badge className={`text-base px-4 py-2 ${getGenderColor(analysis.gender)}`}>
                    {getGenderLabel(analysis.gender)}
                  </Badge>
                </CardContent>
              </Card>

              <Card className="border-2">
                <CardContent className="p-4 space-y-3">
                  <div className="flex items-center gap-2">
                    <Calendar className="w-5 h-5 text-muted-foreground" />
                    <p className="text-sm font-medium text-muted-foreground">العمر التقريبي</p>
                  </div>
                  <Badge variant="secondary" className="text-base px-4 py-2">
                    {analysis.ageRange}
                  </Badge>
                </CardContent>
              </Card>

              <Card className="border-2">
                <CardContent className="p-4 space-y-3">
                  <div className="flex items-center gap-2">
                    <Mic2 className="w-5 h-5 text-muted-foreground" />
                    <p className="text-sm font-medium text-muted-foreground">اللهجة</p>
                  </div>
                  <Badge variant="outline" className="text-base px-4 py-2 border-2">
                    {analysis.dialect}
                  </Badge>
                </CardContent>
              </Card>

              <Card className="border-2">
                <CardContent className="p-4 space-y-3">
                  <div className="flex items-center gap-2">
                    <MapPin className="w-5 h-5 text-muted-foreground" />
                    <p className="text-sm font-medium text-muted-foreground">البلد المحتمل</p>
                  </div>
                  <Badge variant="outline" className="text-base px-4 py-2 border-2">
                    {analysis.country}
                  </Badge>
                </CardContent>
              </Card>

              <Card className="border-2">
                <CardContent className="p-4 space-y-3">
                  <div className="flex items-center gap-2">
                    <Smile className="w-5 h-5 text-muted-foreground" />
                    <p className="text-sm font-medium text-muted-foreground">الحالة العاطفية</p>
                  </div>
                  <Badge variant="secondary" className="text-base px-4 py-2">
                    {analysis.emotion}
                  </Badge>
                </CardContent>
              </Card>

              <Card className="border-2">
                <CardContent className="p-4 space-y-3">
                  <div className="flex items-center gap-2">
                    <Clock className="w-5 h-5 text-muted-foreground" />
                    <p className="text-sm font-medium text-muted-foreground">سرعة الكلام</p>
                  </div>
                  <Badge variant="secondary" className="text-base px-4 py-2">
                    {analysis.speakingRate}
                  </Badge>
                </CardContent>
              </Card>
            </div>

            <Separator />

            <div className="space-y-4">
              <h4 className="font-semibold flex items-center gap-2">
                <TrendingUp className="w-5 h-5" />
                الخصائص الصوتية التفصيلية
              </h4>

              <div className="grid gap-4">
                <div className="space-y-2">
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-muted-foreground flex items-center gap-2">
                      <Radio className="w-4 h-4" />
                      نبرة الصوت (Hz)
                    </span>
                    <span className="font-medium">{Math.round(analysis.pitch)} Hz</span>
                  </div>
                  <Progress value={(analysis.pitch / 300) * 100} className="h-2" />
                  <p className="text-xs text-muted-foreground">
                    {analysis.pitch < 165 ? 'نبرة منخفضة (صوت عميق)' : 'نبرة عالية (صوت حاد)'}
                  </p>
                </div>

                <div className="space-y-2">
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-muted-foreground flex items-center gap-2">
                      <Activity className="w-4 h-4" />
                      الإيقاع
                    </span>
                    <span className="font-medium">{Math.round(analysis.tempo)}%</span>
                  </div>
                  <Progress value={analysis.tempo} className="h-2" />
                  <p className="text-xs text-muted-foreground">
                    {analysis.tempo > 70
                      ? 'إيقاع سريع'
                      : analysis.tempo > 40
                      ? 'إيقاع متوسط'
                      : 'إيقاع بطيء'}
                  </p>
                </div>

                <div className="space-y-2">
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-muted-foreground flex items-center gap-2">
                      <Zap className="w-4 h-4" />
                      الطاقة الصوتية
                    </span>
                    <span className="font-medium">{Math.round(analysis.energy)}%</span>
                  </div>
                  <Progress value={analysis.energy} className="h-2" />
                  <p className="text-xs text-muted-foreground">
                    {analysis.energy > 70
                      ? 'طاقة عالية - صوت قوي ونشط'
                      : analysis.energy > 40
                      ? 'طاقة متوسطة - صوت معتدل'
                      : 'طاقة منخفضة - صوت هادئ'}
                  </p>
                </div>

                <div className="space-y-2">
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-muted-foreground flex items-center gap-2">
                      <Speaker className="w-4 h-4" />
                      وضوح النطق
                    </span>
                    <span className="font-medium">{Math.round(analysis.clarity)}%</span>
                  </div>
                  <Progress value={analysis.clarity} className="h-2" />
                  <p className="text-xs text-muted-foreground">
                    {analysis.clarity > 80
                      ? 'وضوح ممتاز - نطق واضح جداً'
                      : analysis.clarity > 60
                      ? 'وضوح جيد - نطق مفهوم'
                      : 'وضوح متوسط - قد يحتاج تحسين'}
                  </p>
                </div>

                <div className="space-y-2">
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-muted-foreground flex items-center gap-2">
                      <Volume2 className="w-4 h-4" />
                      مستوى الصوت
                    </span>
                    <Badge variant="secondary">{analysis.volumeLevel}</Badge>
                  </div>
                </div>

                <div className="space-y-2">
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-muted-foreground">الضوضاء الخلفية</span>
                    <span className={`font-medium ${getNoiseColor(analysis.backgroundNoise)}`}>
                      {Math.round(analysis.backgroundNoise)}%
                    </span>
                  </div>
                  <Progress value={analysis.backgroundNoise} className="h-2" />
                  <p className="text-xs text-muted-foreground">
                    {analysis.backgroundNoise < 10
                      ? 'بيئة هادئة جداً'
                      : analysis.backgroundNoise < 20
                      ? 'ضوضاء خفيفة'
                      : 'ضوضاء ملحوظة'}
                  </p>
                </div>

                <div className="space-y-2">
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-muted-foreground">دقة التحليل</span>
                    <span className={`font-medium ${getConfidenceColor(analysis.confidence)}`}>
                      {Math.round(analysis.confidence * 100)}%
                    </span>
                  </div>
                  <Progress value={analysis.confidence * 100} className="h-2" />
                  <p className="text-xs text-muted-foreground">
                    {analysis.confidence >= 0.8
                      ? 'دقة عالية جداً - نتائج موثوقة'
                      : analysis.confidence >= 0.6
                      ? 'دقة جيدة - نتائج مقبولة'
                      : 'دقة متوسطة - قد تحتاج تأكيد'}
                  </p>
                </div>
              </div>
            </div>

            <Separator />

            <div className="grid md:grid-cols-2 gap-4">
              <div className="p-4 rounded-lg bg-gradient-to-r from-blue-50 to-indigo-50 border-2 border-blue-200">
                <h5 className="font-semibold text-sm mb-3 text-blue-900">ملخص الخصائص الأساسية</h5>
                <div className="space-y-2 text-xs text-blue-800">
                  <p>• الجنس: {getGenderLabel(analysis.gender)}</p>
                  <p>• العمر: {analysis.ageRange}</p>
                  <p>• اللهجة: {analysis.dialect}</p>
                  <p>• البلد: {analysis.country}</p>
                  <p>• الحالة العاطفية: {analysis.emotion}</p>
                </div>
              </div>

              <div className="p-4 rounded-lg bg-gradient-to-r from-purple-50 to-pink-50 border-2 border-purple-200">
                <h5 className="font-semibold text-sm mb-3 text-purple-900">ملخص الأداء الصوتي</h5>
                <div className="space-y-2 text-xs text-purple-800">
                  <p>• نبرة الصوت: {Math.round(analysis.pitch)} Hz</p>
                  <p>• الطاقة: {Math.round(analysis.energy)}%</p>
                  <p>• الوضوح: {Math.round(analysis.clarity)}%</p>
                  <p>• سرعة الكلام: {analysis.speakingRate}</p>
                  <p>• مستوى الصوت: {analysis.volumeLevel}</p>
                </div>
              </div>
            </div>

            <div className="p-4 rounded-lg bg-gradient-to-r from-amber-50 to-orange-50 border-2 border-amber-200">
              <p className="text-xs text-amber-800">
                <strong>ملاحظة هامة:</strong> نتائج التحليل تعتمد على خوارزميات متقدمة
                لمعالجة الإشارات الصوتية وتحليل الترددات. قد تختلف الدقة حسب جودة التسجيل،
                الضوضاء المحيطة، ووضوح الصوت. للحصول على أفضل النتائج، يُنصح باستخدام
                تسجيلات عالية الجودة في بيئة هادئة.
              </p>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}