import { useState, useRef } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { detectFaces, compareImageWithVideo, FaceDetectionResult } from '@/lib/faceRecognition';
import { extractVoicePrint, compareVoices, VoicePrint, VoiceMatchResult } from '@/lib/voiceMatching';
import {
  Upload,
  Scan,
  User,
  CheckCircle2,
  XCircle,
  Loader2,
  Zap,
  Target,
} from 'lucide-react';
import { toast } from 'sonner';

interface FaceMatchResultType {
  matches: Array<{ frameIndex: number; face: unknown; matchResult: unknown }>;
  overallConfidence: number;
}

export default function FaceMatchingSection() {
  const [referenceImage, setReferenceImage] = useState<File | null>(null);
  const [referenceImageUrl, setReferenceImageUrl] = useState<string | null>(null);
  const [targetVideo, setTargetVideo] = useState<File | null>(null);
  const [targetVideoUrl, setTargetVideoUrl] = useState<string | null>(null);
  const [referenceAudio, setReferenceAudio] = useState<File | null>(null);
  const [targetAudio, setTargetAudio] = useState<File | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [progress, setProgress] = useState(0);
  const [faceResult, setFaceResult] = useState<FaceMatchResultType | null>(null);
  const [voiceResult, setVoiceResult] = useState<VoiceMatchResult | null>(null);
  const [referenceFaces, setReferenceFaces] = useState<FaceDetectionResult | null>(null);

  const refImageInputRef = useRef<HTMLInputElement>(null);
  const targetVideoInputRef = useRef<HTMLInputElement>(null);
  const refAudioInputRef = useRef<HTMLInputElement>(null);
  const targetAudioInputRef = useRef<HTMLInputElement>(null);

  const handleReferenceImageSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    console.log('🖼️ Face matching - reference image select triggered');
    const file = e.target.files?.[0];
    console.log('🖼️ Selected file:', file);
    
    if (!file) {
      console.log('❌ No file selected');
      return;
    }
    
    if (file.type.startsWith('image/')) {
      console.log('✅ Valid image file');
      setReferenceImage(file);
      const url = URL.createObjectURL(file);
      setReferenceImageUrl(url);
      
      // Auto-detect faces
      const faces = await detectFaces(url);
      setReferenceFaces(faces);
      toast.success(`تم اكتشاف ${faces.faceCount} وجه في الصورة المرجعية`);
    } else {
      console.log('❌ Invalid file type');
      toast.error('يرجى اختيار ملف صورة');
    }
  };

  const handleTargetVideoSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    console.log('🎬 Face matching - target video select triggered');
    const file = e.target.files?.[0];
    console.log('🎬 Selected file:', file);
    
    if (!file) {
      console.log('❌ No file selected');
      return;
    }
    
    if (file.type.startsWith('video/')) {
      console.log('✅ Valid video file');
      setTargetVideo(file);
      setTargetVideoUrl(URL.createObjectURL(file));
      toast.success('تم تحميل الفيديو المستهدف');
    } else {
      console.log('❌ Invalid file type');
      toast.error('يرجى اختيار ملف فيديو');
    }
  };

  const handleReferenceAudioSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    console.log('🎵 Face matching - reference audio select triggered');
    const file = e.target.files?.[0];
    console.log('🎵 Selected file:', file);
    
    if (!file) {
      console.log('❌ No file selected');
      return;
    }
    
    if (file.type.startsWith('audio/') || file.type.startsWith('video/')) {
      console.log('✅ Valid audio/video file');
      setReferenceAudio(file);
      toast.success('تم تحميل الصوت المرجعي');
    } else {
      console.log('❌ Invalid file type');
      toast.error('يرجى اختيار ملف صوتي أو فيديو');
    }
  };

  const handleTargetAudioSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    console.log('🎵 Face matching - target audio select triggered');
    const file = e.target.files?.[0];
    console.log('🎵 Selected file:', file);
    
    if (!file) {
      console.log('❌ No file selected');
      return;
    }
    
    if (file.type.startsWith('audio/') || file.type.startsWith('video/')) {
      console.log('✅ Valid audio/video file');
      setTargetAudio(file);
      toast.success('تم تحميل الصوت المستهدف');
    } else {
      console.log('❌ Invalid file type');
      toast.error('يرجى اختيار ملف صوتي أو فيديو');
    }
  };

  const handleFaceMatching = async () => {
    if (!referenceImageUrl || !targetVideoUrl) {
      toast.error('يرجى رفع صورة مرجعية وفيديو مستهدف');
      return;
    }

    setIsProcessing(true);
    setProgress(0);

    const interval = setInterval(() => {
      setProgress((prev) => (prev >= 90 ? 90 : prev + 10));
    }, 300);

    try {
      const result = await compareImageWithVideo(referenceImageUrl, targetVideoUrl);
      setFaceResult(result);
      setProgress(100);
      
      if (result.overallConfidence > 0) {
        toast.success('تم العثور على تطابقات!', {
          description: `نسبة التطابق: ${result.overallConfidence.toFixed(1)}%`,
        });
      } else {
        toast.info('لم يتم العثور على تطابقات');
      }
    } catch (error) {
      toast.error('حدث خطأ أثناء المطابقة');
    } finally {
      clearInterval(interval);
      setIsProcessing(false);
    }
  };

  const handleVoiceMatching = async () => {
    if (!referenceAudio || !targetAudio) {
      toast.error('يرجى رفع ملفين صوتيين للمقارنة');
      return;
    }

    setIsProcessing(true);
    setProgress(0);

    const interval = setInterval(() => {
      setProgress((prev) => (prev >= 90 ? 90 : prev + 10));
    }, 200);

    try {
      const voice1 = await extractVoicePrint(URL.createObjectURL(referenceAudio));
      const voice2 = await extractVoicePrint(URL.createObjectURL(targetAudio));
      const result = compareVoices(voice1, voice2);
      
      setVoiceResult(result);
      setProgress(100);
      
      toast.success('تم تحليل الأصوات!', {
        description: `نسبة التطابق: ${result.similarity.toFixed(1)}%`,
      });
    } catch (error) {
      toast.error('حدث خطأ أثناء مقارنة الأصوات');
    } finally {
      clearInterval(interval);
      setIsProcessing(false);
    }
  };

  return (
    <div className="space-y-6">
      <Card className="border-2 border-cyan-200 bg-gradient-to-br from-cyan-950 to-blue-950 text-cyan-50">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-2xl text-cyan-100">
            <Target className="w-6 h-6 text-cyan-400" />
            نظام المطابقة البيومترية المتقدم
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-8">
          {/* Face Matching Section */}
          <div className="space-y-4 p-6 rounded-lg border-2 border-cyan-700 bg-cyan-950/50">
            <h3 className="text-xl font-bold flex items-center gap-2 text-cyan-300">
              <User className="w-5 h-5" />
              مطابقة الوجوه (صورة مع فيديو)
            </h3>
            
            <div className="grid md:grid-cols-2 gap-4">
              <div className="space-y-3">
                <span className="block text-sm font-medium text-cyan-300">الصورة المرجعية</span>
                <input
                  ref={refImageInputRef}
                  type="file"
                  accept="image/*"
                  onChange={handleReferenceImageSelect}
                  className="hidden"
                />
                <div 
                  onClick={() => refImageInputRef.current?.click()}
                  className="cursor-pointer border-2 border-dashed border-cyan-600 rounded-lg p-4 hover:border-cyan-400 transition-colors"
                >
                  {referenceImageUrl ? (
                    <div className="space-y-2">
                      <img
                        src={referenceImageUrl}
                        alt="Reference"
                        className="w-full h-48 object-contain rounded"
                      />
                      {referenceFaces && (
                        <Badge variant="secondary" className="w-full justify-center">
                          {referenceFaces.faceCount} وجه مكتشف
                        </Badge>
                      )}
                    </div>
                  ) : (
                    <div className="text-center py-8">
                      <Upload className="w-8 h-8 mx-auto mb-2 text-cyan-400" />
                      <p className="text-sm text-cyan-300">رفع صورة مرجعية</p>
                    </div>
                  )}
                </div>
              </div>

              <div className="space-y-3">
                <span className="block text-sm font-medium text-cyan-300">الفيديو المستهدف</span>
                <input
                  ref={targetVideoInputRef}
                  type="file"
                  accept="video/*"
                  onChange={handleTargetVideoSelect}
                  className="hidden"
                />
                <div 
                  onClick={() => targetVideoInputRef.current?.click()}
                  className="cursor-pointer border-2 border-dashed border-cyan-600 rounded-lg p-4 hover:border-cyan-400 transition-colors"
                >
                  {targetVideoUrl ? (
                    <video
                      src={targetVideoUrl}
                      className="w-full h-48 object-contain rounded"
                      controls
                    />
                  ) : (
                    <div className="text-center py-8">
                      <Upload className="w-8 h-8 mx-auto mb-2 text-cyan-400" />
                      <p className="text-sm text-cyan-300">رفع فيديو مستهدف</p>
                    </div>
                  )}
                </div>
              </div>
            </div>

            <Button
              onClick={handleFaceMatching}
              disabled={isProcessing || !referenceImageUrl || !targetVideoUrl}
              className="w-full bg-cyan-600 hover:bg-cyan-700"
              size="lg"
            >
              {isProcessing ? (
                <>
                  <Loader2 className="w-5 h-5 mr-2 animate-spin" />
                  جاري المطابقة...
                </>
              ) : (
                <>
                  <Scan className="w-5 h-5 mr-2" />
                  بدء مطابقة الوجوه
                </>
              )}
            </Button>

            {isProcessing && (
              <div className="space-y-2">
                <Progress value={progress} className="h-3" />
                <p className="text-sm text-center text-cyan-300">{progress}%</p>
              </div>
            )}

            {faceResult && (
              <Card className="border-2 border-cyan-600 bg-cyan-900/50">
                <CardContent className="p-6 space-y-4">
                  <div className="flex items-center justify-between">
                    <h4 className="text-lg font-bold text-cyan-200">نتائج المطابقة</h4>
                    {faceResult.overallConfidence >= 70 ? (
                      <CheckCircle2 className="w-6 h-6 text-green-400" />
                    ) : (
                      <XCircle className="w-6 h-6 text-red-400" />
                    )}
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div className="p-4 rounded-lg bg-cyan-950/50 border border-cyan-700">
                      <p className="text-sm text-cyan-400">نسبة التطابق الإجمالية</p>
                      <p className="text-3xl font-bold text-cyan-100">
                        {faceResult.overallConfidence.toFixed(1)}%
                      </p>
                    </div>
                    <div className="p-4 rounded-lg bg-cyan-950/50 border border-cyan-700">
                      <p className="text-sm text-cyan-400">عدد التطابقات</p>
                      <p className="text-3xl font-bold text-cyan-100">
                        {faceResult.matches.length}
                      </p>
                    </div>
                  </div>

                  <div className="p-4 rounded-lg bg-cyan-950/50 border border-cyan-700">
                    <p className="text-sm text-cyan-400 mb-2">التقييم</p>
                    <p className="text-cyan-100">
                      {faceResult.overallConfidence >= 95
                        ? '✓ تطابق شبه مؤكد - نفس الشخص في الفيديو'
                        : faceResult.overallConfidence >= 85
                        ? '✓ تطابق عالي جداً - على الأرجح نفس الشخص'
                        : faceResult.overallConfidence >= 70
                        ? '✓ تطابق جيد - احتمال كبير أن يكون نفس الشخص'
                        : faceResult.overallConfidence >= 50
                        ? '⚠ تشابه متوسط - قد يكون نفس الشخص'
                        : '✗ لا يوجد تطابق - أشخاص مختلفون'}
                    </p>
                  </div>
                </CardContent>
              </Card>
            )}
          </div>

          {/* Voice Matching Section */}
          <div className="space-y-4 p-6 rounded-lg border-2 border-purple-700 bg-purple-950/50">
            <h3 className="text-xl font-bold flex items-center gap-2 text-purple-300">
              <Zap className="w-5 h-5" />
              مطابقة الأصوات (صوت مع صوت)
            </h3>

            <div className="grid md:grid-cols-2 gap-4">
              <div className="space-y-3">
                <span className="block text-sm font-medium text-purple-300">الصوت المرجعي</span>
                <input
                  ref={refAudioInputRef}
                  type="file"
                  accept="audio/*,video/*"
                  onChange={handleReferenceAudioSelect}
                  className="hidden"
                />
                <div 
                  onClick={() => refAudioInputRef.current?.click()}
                  className="cursor-pointer border-2 border-dashed border-purple-600 rounded-lg p-6 hover:border-purple-400 transition-colors text-center"
                >
                  {referenceAudio ? (
                    <div>
                      <CheckCircle2 className="w-8 h-8 mx-auto mb-2 text-green-400" />
                      <p className="text-sm text-purple-200">{referenceAudio.name}</p>
                    </div>
                  ) : (
                    <>
                      <Upload className="w-8 h-8 mx-auto mb-2 text-purple-400" />
                      <p className="text-sm text-purple-300">رفع صوت مرجعي</p>
                    </>
                  )}
                </div>
              </div>

              <div className="space-y-3">
                <span className="block text-sm font-medium text-purple-300">الصوت المستهدف</span>
                <input
                  ref={targetAudioInputRef}
                  type="file"
                  accept="audio/*,video/*"
                  onChange={handleTargetAudioSelect}
                  className="hidden"
                />
                <div 
                  onClick={() => targetAudioInputRef.current?.click()}
                  className="cursor-pointer border-2 border-dashed border-purple-600 rounded-lg p-6 hover:border-purple-400 transition-colors text-center"
                >
                  {targetAudio ? (
                    <div>
                      <CheckCircle2 className="w-8 h-8 mx-auto mb-2 text-green-400" />
                      <p className="text-sm text-purple-200">{targetAudio.name}</p>
                    </div>
                  ) : (
                    <>
                      <Upload className="w-8 h-8 mx-auto mb-2 text-purple-400" />
                      <p className="text-sm text-purple-300">رفع صوت مستهدف</p>
                    </>
                  )}
                </div>
              </div>
            </div>

            <Button
              onClick={handleVoiceMatching}
              disabled={isProcessing || !referenceAudio || !targetAudio}
              className="w-full bg-purple-600 hover:bg-purple-700"
              size="lg"
            >
              {isProcessing ? (
                <>
                  <Loader2 className="w-5 h-5 mr-2 animate-spin" />
                  جاري المطابقة...
                </>
              ) : (
                <>
                  <Zap className="w-5 h-5 mr-2" />
                  بدء مطابقة الأصوات
                </>
              )}
            </Button>

            {voiceResult && (
              <Card className="border-2 border-purple-600 bg-purple-900/50">
                <CardContent className="p-6 space-y-4">
                  <div className="flex items-center justify-between">
                    <h4 className="text-lg font-bold text-purple-200">نتائج المطابقة الصوتية</h4>
                    {voiceResult.isMatch ? (
                      <CheckCircle2 className="w-6 h-6 text-green-400" />
                    ) : (
                      <XCircle className="w-6 h-6 text-red-400" />
                    )}
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div className="p-4 rounded-lg bg-purple-950/50 border border-purple-700">
                      <p className="text-sm text-purple-400">نسبة التطابق</p>
                      <p className="text-3xl font-bold text-purple-100">
                        {voiceResult.similarity.toFixed(1)}%
                      </p>
                    </div>
                    <div className="p-4 rounded-lg bg-purple-950/50 border border-purple-700">
                      <p className="text-sm text-purple-400">مستوى الثقة</p>
                      <p className="text-3xl font-bold text-purple-100">
                        {(voiceResult.confidence * 100).toFixed(0)}%
                      </p>
                    </div>
                  </div>

                  <div className="p-4 rounded-lg bg-purple-950/50 border border-purple-700">
                    <p className="text-sm text-purple-400 mb-2">التقييم</p>
                    <p className="text-purple-100">{voiceResult.details}</p>
                  </div>
                </CardContent>
              </Card>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}