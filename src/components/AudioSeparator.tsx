import { useState, useRef, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Slider } from '@/components/ui/slider';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import {
  AudioTrack,
  AudioSeparationResult,
  separateAudioTracks,
  extractAudioFromFile,
} from '@/lib/audioAnalysis';
import {
  Play,
  Pause,
  Download,
  Volume2,
  Mic,
  Waves,
  Loader2,
} from 'lucide-react';
import { toast } from 'sonner';

interface AudioSeparatorProps {
  file: File;
}

export default function AudioSeparator({ file }: AudioSeparatorProps) {
  const [isProcessing, setIsProcessing] = useState(false);
  const [progress, setProgress] = useState(0);
  const [separationResult, setSeparationResult] = useState<AudioSeparationResult | null>(null);
  const [playingTrackId, setPlayingTrackId] = useState<string | null>(null);
  const audioRefs = useRef<{ [key: string]: HTMLAudioElement }>({});

  useEffect(() => {
    return () => {
      Object.values(audioRefs.current).forEach(audio => {
        audio.pause();
        audio.src = '';
      });
    };
  }, []);

  const handleSeparate = async () => {
    setIsProcessing(true);
    setProgress(0);

    const progressInterval = setInterval(() => {
      setProgress(prev => {
        if (prev >= 90) {
          clearInterval(progressInterval);
          return 90;
        }
        return prev + 10;
      });
    }, 500);

    try {
      const audioUrl = await extractAudioFromFile(file);
      const result = await separateAudioTracks(audioUrl);
      setSeparationResult(result);
      setProgress(100);
      
      toast.success('تم فصل الأصوات بنجاح!', {
        description: `تم فصل ${result.tracks.length} مسار صوتي`,
      });
    } catch (error) {
      console.error('Error separating audio:', error);
      toast.error('حدث خطأ أثناء فصل الأصوات', {
        description: 'يرجى المحاولة مرة أخرى',
      });
    } finally {
      clearInterval(progressInterval);
      setIsProcessing(false);
    }
  };

  const togglePlay = (trackId: string, audioUrl: string) => {
    if (!audioRefs.current[trackId]) {
      audioRefs.current[trackId] = new Audio(audioUrl);
      audioRefs.current[trackId].addEventListener('ended', () => {
        setPlayingTrackId(null);
      });
    }

    const audio = audioRefs.current[trackId];

    if (playingTrackId === trackId) {
      audio.pause();
      setPlayingTrackId(null);
    } else {
      Object.values(audioRefs.current).forEach(a => a.pause());
      audio.play();
      setPlayingTrackId(trackId);
    }
  };

  const handleVolumeChange = (trackId: string, value: number[]) => {
    if (audioRefs.current[trackId]) {
      audioRefs.current[trackId].volume = value[0];
    }
    
    if (separationResult) {
      const updatedTracks = separationResult.tracks.map(track =>
        track.id === trackId ? { ...track, volume: value[0] } : track
      );
      setSeparationResult({ ...separationResult, tracks: updatedTracks });
    }
  };

  const downloadTrack = (track: AudioTrack) => {
    const a = document.createElement('a');
    a.href = track.audioUrl;
    a.download = `${track.name}.webm`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
  };

  const formatDuration = (seconds: number): string => {
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  return (
    <Card className="border-2">
      <CardHeader className="bg-gradient-to-r from-purple-50 to-pink-50">
        <CardTitle className="flex items-center gap-2">
          <Waves className="w-5 h-5" />
          فصل الأصوات المتعددة
        </CardTitle>
      </CardHeader>
      <CardContent className="pt-6 space-y-6">
        {!separationResult && !isProcessing && (
          <div className="space-y-4">
            <div className="flex items-start gap-3 p-4 rounded-lg bg-gradient-to-r from-blue-50 to-indigo-50 border-2 border-blue-200">
              <Mic className="w-5 h-5 text-blue-600 mt-0.5 flex-shrink-0" />
              <div className="space-y-1">
                <p className="text-sm font-medium text-blue-900">
                  فصل الأصوات الذكي
                </p>
                <p className="text-xs text-blue-700">
                  هذه الأداة تستخدم تقنيات متقدمة لفصل الأصوات المتعددة في الملف الصوتي
                  أو الفيديو، مما يتيح لك التحكم في كل صوت بشكل منفصل.
                </p>
              </div>
            </div>

            <Button
              onClick={handleSeparate}
              className="w-full bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700"
              size="lg"
            >
              <Waves className="w-5 h-5 mr-2" />
              بدء فصل الأصوات
            </Button>
          </div>
        )}

        {isProcessing && (
          <div className="space-y-3 p-6 rounded-lg border-2 border-dashed border-primary bg-primary/5">
            <div className="flex items-center justify-between text-sm">
              <span className="font-medium flex items-center gap-2">
                <Loader2 className="w-4 h-4 animate-spin" />
                جاري فصل الأصوات...
              </span>
              <span className="text-muted-foreground font-bold">{progress}%</span>
            </div>
            <Progress value={progress} className="h-3" />
            <p className="text-xs text-muted-foreground text-center">
              قد تستغرق هذه العملية بضع دقائق حسب طول الملف
            </p>
          </div>
        )}

        {separationResult && (
          <div className="space-y-4">
            <div className="flex items-center justify-between p-4 rounded-lg bg-gradient-to-r from-green-50 to-emerald-50 border-2 border-green-200">
              <div className="flex items-center gap-2">
                <Waves className="w-5 h-5 text-green-600" />
                <div>
                  <p className="text-sm font-bold text-green-900">
                    تم فصل الأصوات بنجاح!
                  </p>
                  <p className="text-xs text-green-700">
                    المدة الكلية: {formatDuration(separationResult.totalDuration)}
                  </p>
                </div>
              </div>
              <Badge variant="secondary" className="text-sm">
                {separationResult.tracks.length} مسار
              </Badge>
            </div>

            <div className="space-y-3">
              {separationResult.tracks.map((track, index) => (
                <Card key={track.id} className="border-2 hover:shadow-md transition-shadow">
                  <CardContent className="p-4 space-y-3">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-full bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center text-white font-bold">
                          {index + 1}
                        </div>
                        <div>
                          <p className="font-medium">{track.name}</p>
                          <p className="text-xs text-muted-foreground">
                            {formatDuration(track.duration)}
                          </p>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <Button
                          variant="outline"
                          size="icon"
                          onClick={() => togglePlay(track.id, track.audioUrl)}
                        >
                          {playingTrackId === track.id ? (
                            <Pause className="w-4 h-4" />
                          ) : (
                            <Play className="w-4 h-4" />
                          )}
                        </Button>
                        <Button
                          variant="outline"
                          size="icon"
                          onClick={() => downloadTrack(track)}
                        >
                          <Download className="w-4 h-4" />
                        </Button>
                      </div>
                    </div>

                    <div className="space-y-2">
                      <div className="flex items-center justify-between text-sm">
                        <span className="flex items-center gap-1 text-muted-foreground">
                          <Volume2 className="w-4 h-4" />
                          مستوى الصوت
                        </span>
                        <span className="font-medium">{Math.round(track.volume * 100)}%</span>
                      </div>
                      <Slider
                        value={[track.volume]}
                        min={0}
                        max={1}
                        step={0.01}
                        onValueChange={(value) => handleVolumeChange(track.id, value)}
                        className="w-full"
                      />
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}