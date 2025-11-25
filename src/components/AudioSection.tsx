import { useState, useRef } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import {
  separateAudioTracks,
  extractAudioFromVideo,
  generateAudioReport,
  AudioTrack,
  SeparationResult,
} from '@/lib/advancedAudioSeparation';
import {
  Upload,
  Music,
  Download,
  Play,
  Pause,
  Loader2,
  FileAudio,
  Scissors,
  FileText,
  Volume2,
} from 'lucide-react';
import { toast } from 'sonner';

export default function AudioSection() {
  const [file, setFile] = useState<File | null>(null);
  const [audioUrl, setAudioUrl] = useState<string | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [progress, setProgress] = useState(0);
  const [separationResult, setSeparationResult] = useState<SeparationResult | null>(null);
  const [playingTrack, setPlayingTrack] = useState<string | null>(null);
  const [audioElements, setAudioElements] = useState<Map<string, HTMLAudioElement>>(new Map());
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    console.log('🎵 Audio file select triggered');
    const selectedFile = e.target.files?.[0];
    console.log('🎵 Selected audio file:', selectedFile);
    
    if (!selectedFile) {
      console.log('❌ No file selected');
      return;
    }
    
    console.log('📄 File details:', {
      name: selectedFile.name,
      type: selectedFile.type,
      size: selectedFile.size,
    });
    
    if (selectedFile.type.startsWith('audio/') || selectedFile.type.startsWith('video/')) {
      console.log('✅ Valid audio/video file:', selectedFile.name, selectedFile.type);
      setFile(selectedFile);
      const url = URL.createObjectURL(selectedFile);
      console.log('🔗 Created audio URL:', url);
      setAudioUrl(url);
      setSeparationResult(null);
      toast.success('تم تحميل الملف بنجاح!');
    } else {
      console.log('❌ Invalid file type:', selectedFile.type);
      toast.error('يرجى اختيار ملف صوتي أو فيديو');
    }
  };

  const handleUploadClick = () => {
    console.log('🖱️ Upload button clicked');
    console.log('📎 File input ref:', fileInputRef.current);
    if (fileInputRef.current) {
      console.log('✅ Triggering file input click');
      fileInputRef.current.click();
    } else {
      console.log('❌ File input ref is null');
    }
  };

  const handleSeparate = async () => {
    if (!audioUrl) return;

    setIsProcessing(true);
    setProgress(0);

    const interval = setInterval(() => {
      setProgress((prev) => (prev >= 90 ? 90 : prev + 15));
    }, 400);

    try {
      let processUrl = audioUrl;

      // If video file, extract audio first
      if (file?.type.startsWith('video/')) {
        toast.info('استخراج الصوت من الفيديو...');
        processUrl = await extractAudioFromVideo(audioUrl);
      }

      const result = await separateAudioTracks(processUrl);
      setSeparationResult(result);
      setProgress(100);

      toast.success('تم فصل المسارات الصوتية بنجاح!', {
        description: `تم استخراج ${result.tracks.length} مسار صوتي`,
      });
    } catch (error) {
      toast.error('حدث خطأ أثناء فصل المسارات');
    } finally {
      clearInterval(interval);
      setIsProcessing(false);
    }
  };

  const handlePlayPause = (trackId: string, trackUrl: string) => {
    if (playingTrack === trackId) {
      const audio = audioElements.get(trackId);
      audio?.pause();
      setPlayingTrack(null);
    } else {
      // Pause all other tracks
      audioElements.forEach((audio, id) => {
        if (id !== trackId) {
          audio.pause();
        }
      });

      let audio = audioElements.get(trackId);
      if (!audio) {
        audio = new Audio(trackUrl);
        setAudioElements(new Map(audioElements.set(trackId, audio)));
      }

      audio.play();
      setPlayingTrack(trackId);

      audio.onended = () => {
        setPlayingTrack(null);
      };
    }
  };

  const handleDownloadTrack = (track: AudioTrack) => {
    const a = document.createElement('a');
    a.href = track.url;
    a.download = `${track.name}.mp3`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    toast.success(`تم تحميل ${track.name}`);
  };

  const handleDownloadReport = () => {
    if (!separationResult) return;

    const report = generateAudioReport(separationResult.tracks, separationResult.totalDuration);
    const blob = new Blob([report], { type: 'text/plain;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'audio_separation_report.txt';
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    toast.success('تم تحميل التقرير');
  };

  const handleDownloadAll = () => {
    if (!separationResult) return;

    separationResult.tracks.forEach((track, index) => {
      setTimeout(() => {
        handleDownloadTrack(track);
      }, index * 500);
    });

    toast.success('جاري تحميل جميع المسارات...');
  };

  const getTrackColor = (type: string) => {
    switch (type) {
      case 'vocals':
        return 'bg-purple-100 border-purple-300 text-purple-900';
      case 'instrumental':
        return 'bg-blue-100 border-blue-300 text-blue-900';
      case 'drums':
        return 'bg-red-100 border-red-300 text-red-900';
      case 'bass':
        return 'bg-green-100 border-green-300 text-green-900';
      case 'other':
        return 'bg-gray-100 border-gray-300 text-gray-900';
      default:
        return 'bg-gray-100 border-gray-300 text-gray-900';
    }
  };

  return (
    <div className="space-y-6">
      <Card className="border-2 border-purple-200 bg-gradient-to-br from-purple-50 to-pink-50">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-2xl">
            <Music className="w-6 h-6 text-purple-600" />
            قسم الصوت - فصل واستخراج المسارات
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          {!file && (
            <div className="text-center space-y-4">
              <input
                ref={fileInputRef}
                type="file"
                accept="audio/*,video/*"
                onChange={handleFileSelect}
                className="hidden"
              />
              <Button 
                size="lg" 
                className="w-full max-w-md bg-purple-600 hover:bg-purple-700"
                onClick={handleUploadClick}
                type="button"
              >
                <Upload className="w-5 h-5 mr-2" />
                رفع ملف صوتي أو فيديو
              </Button>
              <p className="text-sm text-muted-foreground">
                يدعم جميع صيغ الصوت والفيديو (MP3, WAV, MP4, إلخ)
              </p>
            </div>
          )}

          {file && (
            <div className="space-y-6">
              <Card className="border-2 bg-white">
                <CardContent className="p-4">
                  <div className="flex items-center gap-4">
                    <div className="w-12 h-12 rounded-lg bg-purple-100 flex items-center justify-center">
                      <FileAudio className="w-6 h-6 text-purple-600" />
                    </div>
                    <div className="flex-1">
                      <p className="font-semibold">{file.name}</p>
                      <p className="text-sm text-muted-foreground">
                        {(file.size / (1024 * 1024)).toFixed(2)} MB
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {!separationResult && (
                <Button
                  onClick={handleSeparate}
                  disabled={isProcessing}
                  className="w-full bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700"
                  size="lg"
                >
                  {isProcessing ? (
                    <>
                      <Loader2 className="w-5 h-5 mr-2 animate-spin" />
                      جاري فصل المسارات...
                    </>
                  ) : (
                    <>
                      <Scissors className="w-5 h-5 mr-2" />
                      فصل المسارات الصوتية
                    </>
                  )}
                </Button>
              )}

              {isProcessing && (
                <div className="space-y-2">
                  <Progress value={progress} className="h-3" />
                  <p className="text-sm text-center text-muted-foreground">
                    {progress < 30
                      ? 'تحليل الملف الصوتي...'
                      : progress < 60
                      ? 'فصل المسارات...'
                      : progress < 90
                      ? 'معالجة المسارات المفصولة...'
                      : 'اكتمال العملية...'}
                  </p>
                </div>
              )}

              {separationResult && (
                <div className="space-y-6">
                  <Card className="border-2 bg-gradient-to-r from-purple-50 to-pink-50">
                    <CardContent className="p-4">
                      <div className="flex items-center justify-between mb-4">
                        <h4 className="font-bold text-lg">نتائج الفصل</h4>
                        <Badge variant="secondary" className="text-sm">
                          جودة: {(separationResult.separationQuality * 100).toFixed(0)}%
                        </Badge>
                      </div>

                      <div className="grid grid-cols-2 md:grid-cols-3 gap-4 mb-4">
                        <div className="p-3 rounded-lg bg-white border">
                          <p className="text-sm text-muted-foreground">عدد المسارات</p>
                          <p className="text-2xl font-bold text-purple-600">
                            {separationResult.tracks.length}
                          </p>
                        </div>
                        <div className="p-3 rounded-lg bg-white border">
                          <p className="text-sm text-muted-foreground">المدة الإجمالية</p>
                          <p className="text-2xl font-bold text-purple-600">
                            {separationResult.totalDuration.toFixed(1)}s
                          </p>
                        </div>
                        <div className="p-3 rounded-lg bg-white border">
                          <p className="text-sm text-muted-foreground">الحالة</p>
                          <p className="text-2xl font-bold text-green-600">✓ جاهز</p>
                        </div>
                      </div>

                      <div className="flex gap-2">
                        <Button onClick={handleDownloadAll} className="flex-1" variant="outline">
                          <Download className="w-4 h-4 mr-2" />
                          تحميل الكل
                        </Button>
                        <Button onClick={handleDownloadReport} className="flex-1" variant="outline">
                          <FileText className="w-4 h-4 mr-2" />
                          تحميل التقرير
                        </Button>
                      </div>
                    </CardContent>
                  </Card>

                  <div className="space-y-3">
                    <h4 className="font-bold text-lg flex items-center gap-2">
                      <Volume2 className="w-5 h-5" />
                      المسارات المفصولة
                    </h4>

                    {separationResult.tracks.map((track) => (
                      <Card
                        key={track.id}
                        className={`border-2 ${getTrackColor(track.type)} transition-all hover:shadow-lg`}
                      >
                        <CardContent className="p-4">
                          <div className="flex items-center justify-between mb-3">
                            <div className="flex items-center gap-3">
                              <Button
                                size="sm"
                                variant="ghost"
                                onClick={() => handlePlayPause(track.id, track.url)}
                                className="w-10 h-10 rounded-full"
                              >
                                {playingTrack === track.id ? (
                                  <Pause className="w-5 h-5" />
                                ) : (
                                  <Play className="w-5 h-5" />
                                )}
                              </Button>
                              <div>
                                <p className="font-semibold">{track.name}</p>
                                <p className="text-xs opacity-75">
                                  {track.duration.toFixed(2)} ثانية
                                </p>
                              </div>
                            </div>
                            <Button
                              size="sm"
                              onClick={() => handleDownloadTrack(track)}
                              variant="ghost"
                            >
                              <Download className="w-4 h-4" />
                            </Button>
                          </div>

                          {/* Waveform visualization */}
                          <div className="h-12 flex items-end gap-0.5">
                            {track.waveform.map((height, i) => (
                              <div
                                key={i}
                                className="flex-1 bg-current opacity-60 rounded-t"
                                style={{ height: `${height * 100}%` }}
                              />
                            ))}
                          </div>
                        </CardContent>
                      </Card>
                    ))}
                  </div>

                  <Separator />

                  <div className="bg-gradient-to-r from-blue-50 to-cyan-50 p-4 rounded-lg border-2 border-blue-200">
                    <h4 className="font-semibold mb-2 flex items-center gap-2">
                      <FileText className="w-4 h-4" />
                      معلومات إضافية
                    </h4>
                    <ul className="text-sm space-y-1 text-muted-foreground">
                      <li>• تم فصل جميع المسارات بنجاح باستخدام خوارزميات متقدمة</li>
                      <li>• يمكنك تشغيل كل مسار على حدة للاستماع إليه</li>
                      <li>• جميع المسارات جاهزة للتحميل بجودة عالية</li>
                      <li>• التقرير الكامل يحتوي على تفاصيل دقيقة لكل مسار</li>
                    </ul>
                  </div>

                  <Button
                    onClick={() => {
                      setFile(null);
                      setAudioUrl(null);
                      setSeparationResult(null);
                      audioElements.forEach((audio) => audio.pause());
                      setAudioElements(new Map());
                      setPlayingTrack(null);
                    }}
                    variant="outline"
                    className="w-full"
                  >
                    رفع ملف جديد
                  </Button>
                </div>
              )}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}