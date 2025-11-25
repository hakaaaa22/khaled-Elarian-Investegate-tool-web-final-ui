import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Slider } from '@/components/ui/slider';
import { ImageAnalysisResult } from '@/lib/imageAnalysis';
import { ArrowLeftRight } from 'lucide-react';

interface ImageComparisonProps {
  image1: ImageAnalysisResult;
  image2: ImageAnalysisResult;
}

export default function ImageComparison({ image1, image2 }: ImageComparisonProps) {
  const [sliderPosition, setSliderPosition] = useState(50);

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <ArrowLeftRight className="w-5 h-5" />
          مقارنة الصور
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="relative w-full aspect-video rounded-lg overflow-hidden bg-muted">
          <div className="absolute inset-0 grid grid-cols-2 gap-0">
            <div className="relative overflow-hidden">
              <img
                src={image1.dataUrl}
                alt={image1.metadata.name}
                className="absolute inset-0 w-full h-full object-cover"
              />
              <div className="absolute top-4 left-4 bg-black/70 text-white px-3 py-1 rounded-full text-sm font-medium">
                الصورة 1
              </div>
            </div>
            <div className="relative overflow-hidden">
              <img
                src={image2.dataUrl}
                alt={image2.metadata.name}
                className="absolute inset-0 w-full h-full object-cover"
              />
              <div className="absolute top-4 right-4 bg-black/70 text-white px-3 py-1 rounded-full text-sm font-medium">
                الصورة 2
              </div>
            </div>
          </div>

          <div
            className="absolute inset-y-0 w-1 bg-white shadow-lg cursor-ew-resize z-10"
            style={{ left: `${sliderPosition}%` }}
          >
            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-8 h-8 bg-white rounded-full shadow-lg flex items-center justify-center">
              <ArrowLeftRight className="w-4 h-4 text-primary" />
            </div>
          </div>

          <div
            className="absolute inset-0 overflow-hidden"
            style={{ clipPath: `inset(0 ${100 - sliderPosition}% 0 0)` }}
          >
            <img
              src={image2.dataUrl}
              alt={image2.metadata.name}
              className="absolute inset-0 w-full h-full object-cover"
            />
          </div>
        </div>

        <div className="space-y-2">
          <p className="text-sm font-medium">تحريك شريط المقارنة</p>
          <Slider
            value={[sliderPosition]}
            min={0}
            max={100}
            step={1}
            onValueChange={(value) => setSliderPosition(value[0])}
          />
        </div>

        <div className="grid md:grid-cols-2 gap-4">
          <div className="space-y-2">
            <p className="text-sm font-medium">الصورة 1</p>
            <div className="space-y-1 text-sm text-muted-foreground">
              <p>الأبعاد: {image1.metadata.width} × {image1.metadata.height}</p>
              <p>الحجم: {(image1.metadata.size / 1024 / 1024).toFixed(2)} ميجابايت</p>
            </div>
          </div>
          <div className="space-y-2">
            <p className="text-sm font-medium">الصورة 2</p>
            <div className="space-y-1 text-sm text-muted-foreground">
              <p>الأبعاد: {image2.metadata.width} × {image2.metadata.height}</p>
              <p>الحجم: {(image2.metadata.size / 1024 / 1024).toFixed(2)} ميجابايت</p>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}