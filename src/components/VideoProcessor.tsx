import { useRef, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Slider } from '@/components/ui/slider';
import { VideoAnalysisResult, formatDuration } from '@/lib/videoAnalysis';
import { formatFileSize } from '@/lib/imageAnalysis';
import {
  Play,
  Pause,
  Volume2,
  VolumeX,
  Maximize,
  Calendar,
  Film,
} from 'lucide-react';

interface VideoProcessorProps {
  analysis: VideoAnalysisResult;
}

export default function VideoProcessor({ analysis }: VideoProcessorProps) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [volume, setVolume] = useState(1);
  const [isMuted, setIsMuted] = useState(false);

  const { metadata } = analysis;

  const togglePlay = () => {
    if (videoRef.current) {
      if (isPlaying) {
        videoRef.current.pause();
      } else {
        videoRef.current.play();
      }
      setIsPlaying(!isPlaying);
    }
  };

  const handleTimeUpdate = () => {
    if (videoRef.current) {
      setCurrentTime(videoRef.current.currentTime);
    }
  };

  const handleSeek = (value: number[]) => {
    if (videoRef.current) {
      videoRef.current.currentTime = value[0];
      setCurrentTime(value[0]);
    }
  };

  const handleVolumeChange = (value: number[]) => {
    const newVolume = value[0];
    setVolume(newVolume);
    if (videoRef.current) {
      videoRef.current.volume = newVolume;
    }
    if (newVolume === 0) {
      setIsMuted(true);
    } else if (isMuted) {
      setIsMuted(false);
    }
  };

  const toggleMute = () => {
    if (videoRef.current) {
      videoRef.current.muted = !isMuted;
      setIsMuted(!isMuted);
    }
  };

  const toggleFullscreen = () => {
    if (videoRef.current) {
      if (document.fullscreenElement) {
        document.exitFullscreen();
      } else {
        videoRef.current.requestFullscreen();
      }
    }
  };

  return (
    <div className="grid lg:grid-cols-2 gap-6">
      <Card className="overflow-hidden">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Film className="w-5 h-5" />
            مشغل الفيديو
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="relative rounded-lg overflow-hidden bg-black">
            <video
              ref={videoRef}
              src={analysis.dataUrl}
              className="w-full h-auto"
              onTimeUpdate={handleTimeUpdate}
              onEnded={() => setIsPlaying(false)}
            />
          </div>

          <div className="space-y-3">
            <div className="flex items-center gap-2">
              <span className="text-sm font-medium min-w-[60px]">
                {formatDuration(currentTime)}
              </span>
              <Slider
                value={[currentTime]}
                max={metadata.duration}
                step={0.1}
                onValueChange={handleSeek}
                className="flex-1"
              />
              <span className="text-sm text-muted-foreground min-w-[60px] text-left">
                {formatDuration(metadata.duration)}
              </span>
            </div>

            <div className="flex items-center justify-between gap-4">
              <div className="flex items-center gap-2">
                <Button
                  variant="outline"
                  size="icon"
                  onClick={togglePlay}
                  className="h-10 w-10"
                >
                  {isPlaying ? (
                    <Pause className="w-5 h-5" />
                  ) : (
                    <Play className="w-5 h-5" />
                  )}
                </Button>

                <div className="flex items-center gap-2">
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={toggleMute}
                    className="h-8 w-8"
                  >
                    {isMuted || volume === 0 ? (
                      <VolumeX className="w-4 h-4" />
                    ) : (
                      <Volume2 className="w-4 h-4" />
                    )}
                  </Button>
                  <Slider
                    value={[isMuted ? 0 : volume]}
                    max={1}
                    step={0.01}
                    onValueChange={handleVolumeChange}
                    className="w-24"
                  />
                </div>
              </div>

              <Button
                variant="ghost"
                size="icon"
                onClick={toggleFullscreen}
                className="h-8 w-8"
              >
                <Maximize className="w-4 h-4" />
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>معلومات الفيديو</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1">
              <p className="text-sm text-muted-foreground">اسم الملف</p>
              <p className="font-medium truncate">{metadata.name}</p>
            </div>
            <div className="space-y-1">
              <p className="text-sm text-muted-foreground">الحجم</p>
              <p className="font-medium">{formatFileSize(metadata.size)}</p>
            </div>
            <div className="space-y-1">
              <p className="text-sm text-muted-foreground">المدة</p>
              <p className="font-medium">{formatDuration(metadata.duration)}</p>
            </div>
            <div className="space-y-1">
              <p className="text-sm text-muted-foreground">الدقة</p>
              <p className="font-medium">
                {metadata.width} × {metadata.height}
              </p>
            </div>
            <div className="space-y-1">
              <p className="text-sm text-muted-foreground">نسبة العرض</p>
              <p className="font-medium">{metadata.aspectRatio}</p>
            </div>
            <div className="space-y-1">
              <p className="text-sm text-muted-foreground">النوع</p>
              <Badge variant="secondary">{metadata.type}</Badge>
            </div>
            <div className="col-span-2 space-y-1">
              <p className="text-sm text-muted-foreground flex items-center gap-1">
                <Calendar className="w-4 h-4" />
                تاريخ التعديل
              </p>
              <p className="font-medium">
                {metadata.lastModified.toLocaleDateString('ar-SA')}
              </p>
            </div>
          </div>

          {analysis.thumbnail && (
            <div className="space-y-2">
              <p className="text-sm font-medium">صورة مصغرة</p>
              <img
                src={analysis.thumbnail}
                alt="Thumbnail"
                className="w-full rounded-lg border"
              />
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}