import { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { ImageAnalysisResult, extractDominantColors, formatFileSize } from '@/lib/imageAnalysis';
import { Calendar, FileImage, Maximize2, Palette } from 'lucide-react';

interface ImageAnalyzerProps {
  analysis: ImageAnalysisResult;
}

export default function ImageAnalyzer({ analysis }: ImageAnalyzerProps) {
  const [dominantColors, setDominantColors] = useState<string[]>([]);

  useEffect(() => {
    extractDominantColors(analysis.dataUrl).then(setDominantColors);
  }, [analysis.dataUrl]);

  const { metadata } = analysis;

  return (
    <div className="grid lg:grid-cols-2 gap-6">
      <Card className="overflow-hidden">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <FileImage className="w-5 h-5" />
            معاينة الصورة
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="relative rounded-lg overflow-hidden bg-muted">
            <img
              src={analysis.dataUrl}
              alt={metadata.name}
              className="w-full h-auto object-contain max-h-[500px]"
            />
          </div>
        </CardContent>
      </Card>

      <div className="space-y-6">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Maximize2 className="w-5 h-5" />
              معلومات الصورة
            </CardTitle>
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
                <p className="text-sm text-muted-foreground">الأبعاد</p>
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
              <div className="space-y-1">
                <p className="text-sm text-muted-foreground flex items-center gap-1">
                  <Calendar className="w-4 h-4" />
                  تاريخ التعديل
                </p>
                <p className="font-medium text-sm">
                  {metadata.lastModified.toLocaleDateString('ar-SA')}
                </p>
              </div>
            </div>

            <Separator />

            <div className="space-y-3">
              <p className="text-sm font-medium flex items-center gap-2">
                <Palette className="w-4 h-4" />
                الألوان السائدة
              </p>
              <div className="flex gap-2 flex-wrap">
                {dominantColors.length > 0 ? (
                  dominantColors.map((color, index) => (
                    <div
                      key={index}
                      className="w-12 h-12 rounded-lg border-2 border-border shadow-sm"
                      style={{ backgroundColor: color }}
                      title={color}
                    />
                  ))
                ) : (
                  <p className="text-sm text-muted-foreground">جاري التحليل...</p>
                )}
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}