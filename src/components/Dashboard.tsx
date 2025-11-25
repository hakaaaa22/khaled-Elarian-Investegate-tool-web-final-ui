import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { ImageAnalysisResult } from '@/lib/imageAnalysis';
import { VideoAnalysisResult } from '@/lib/videoAnalysis';
import {
  BarChart3,
  FileImage,
  Film,
  HardDrive,
  TrendingUp,
} from 'lucide-react';

interface DashboardProps {
  images: ImageAnalysisResult[];
  videos: VideoAnalysisResult[];
}

export default function Dashboard({ images, videos }: DashboardProps) {
  const totalFiles = images.length + videos.length;
  const totalSize = [...images, ...videos].reduce(
    (acc, item) => acc + item.metadata.size,
    0
  );
  const avgImageSize =
    images.length > 0
      ? images.reduce((acc, img) => acc + img.metadata.size, 0) / images.length
      : 0;
  const avgVideoSize =
    videos.length > 0
      ? videos.reduce((acc, vid) => acc + vid.metadata.size, 0) / videos.length
      : 0;

  const formatSize = (bytes: number) => {
    return (bytes / 1024 / 1024).toFixed(2) + ' ميجابايت';
  };

  return (
    <div className="space-y-6">
      <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">إجمالي الملفات</CardTitle>
            <BarChart3 className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{totalFiles}</div>
            <p className="text-xs text-muted-foreground mt-1">
              {images.length} صورة، {videos.length} فيديو
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">الصور</CardTitle>
            <FileImage className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{images.length}</div>
            <p className="text-xs text-muted-foreground mt-1">
              متوسط الحجم: {formatSize(avgImageSize)}
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">الفيديوهات</CardTitle>
            <Film className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{videos.length}</div>
            <p className="text-xs text-muted-foreground mt-1">
              متوسط الحجم: {formatSize(avgVideoSize)}
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">الحجم الكلي</CardTitle>
            <HardDrive className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{formatSize(totalSize)}</div>
            <p className="text-xs text-muted-foreground mt-1 flex items-center gap-1">
              <TrendingUp className="w-3 h-3" />
              مساحة مستخدمة
            </p>
          </CardContent>
        </Card>
      </div>

      {images.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>تحليل الصور</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {images.map((image, index) => (
                <div
                  key={index}
                  className="flex items-center justify-between p-4 rounded-lg border bg-card hover:bg-accent/50 transition-colors"
                >
                  <div className="flex items-center gap-4">
                    <img
                      src={image.dataUrl}
                      alt={image.metadata.name}
                      className="w-16 h-16 object-cover rounded-lg"
                    />
                    <div className="space-y-1">
                      <p className="font-medium">{image.metadata.name}</p>
                      <div className="flex items-center gap-2">
                        <Badge variant="secondary" className="text-xs">
                          {image.metadata.width} × {image.metadata.height}
                        </Badge>
                        <Badge variant="outline" className="text-xs">
                          {image.metadata.aspectRatio}
                        </Badge>
                      </div>
                    </div>
                  </div>
                  <p className="text-sm text-muted-foreground">
                    {formatSize(image.metadata.size)}
                  </p>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {videos.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>تحليل الفيديوهات</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {videos.map((video, index) => (
                <div
                  key={index}
                  className="flex items-center justify-between p-4 rounded-lg border bg-card hover:bg-accent/50 transition-colors"
                >
                  <div className="flex items-center gap-4">
                    {video.thumbnail && (
                      <img
                        src={video.thumbnail}
                        alt={video.metadata.name}
                        className="w-16 h-16 object-cover rounded-lg"
                      />
                    )}
                    <div className="space-y-1">
                      <p className="font-medium">{video.metadata.name}</p>
                      <div className="flex items-center gap-2">
                        <Badge variant="secondary" className="text-xs">
                          {video.metadata.width} × {video.metadata.height}
                        </Badge>
                        <Badge variant="outline" className="text-xs">
                          {Math.floor(video.metadata.duration)}s
                        </Badge>
                      </div>
                    </div>
                  </div>
                  <p className="text-sm text-muted-foreground">
                    {formatSize(video.metadata.size)}
                  </p>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}