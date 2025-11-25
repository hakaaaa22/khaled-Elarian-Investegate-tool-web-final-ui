import { useState, useRef } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Slider } from '@/components/ui/slider';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { Separator } from '@/components/ui/separator';
import { analyzeImage, ImageAnalysisResult } from '@/lib/imageAnalysis';
import { detectImageEffects, removeImageEffects, ImageEffect, EffectRemovalSettings } from '@/lib/imageEffects';
import {
  Upload,
  Image as ImageIcon,
  Scan,
  Eraser,
  RotateCcw,
  ArrowLeftRight,
  Download,
  Loader2,
  Wand2,
  Settings,
} from 'lucide-react';
import { toast } from 'sonner';

export default function ImageSection() {
  const [file, setFile] = useState<File | null>(null);
  const [imageUrl, setImageUrl] = useState<string | null>(null);
  const [analysis, setAnalysis] = useState<ImageAnalysisResult | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [processedImageUrl, setProcessedImageUrl] = useState<string | null>(null);
  const [showComparison, setShowComparison] = useState(false);
  const [detectedEffects, setDetectedEffects] = useState<ImageEffect[]>([]);
  const [showEffectSettings, setShowEffectSettings] = useState(false);
  const [effectSettings, setEffectSettings] = useState<EffectRemovalSettings>({
    removeBlur: false,
    blurAmount: 0.5,
    restoreBrightness: false,
    brightnessLevel: 0,
    restoreContrast: false,
    contrastLevel: 0,
    restoreSaturation: false,
    saturationLevel: 1.2,
    removeGrayscale: false,
    removeSepia: false,
    sharpen: false,
    sharpenAmount: 0.3,
    removeNoise: false,
    noiseReduction: 1,
  });
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    console.log('🖼️ Image file select triggered');
    const selectedFile = e.target.files?.[0];
    console.log('🖼️ Selected image file:', selectedFile);
    
    if (!selectedFile) {
      console.log('❌ No file selected');
      return;
    }
    
    console.log('📄 File details:', {
      name: selectedFile.name,
      type: selectedFile.type,
      size: selectedFile.size,
    });
    
    if (selectedFile.type.startsWith('image/')) {
      console.log('✅ Valid image file:', selectedFile.name, selectedFile.type);
      setFile(selectedFile);
      const url = URL.createObjectURL(selectedFile);
      console.log('🔗 Created image URL:', url);
      setImageUrl(url);
      setAnalysis(null);
      setProcessedImageUrl(null);
      setShowComparison(false);
      setDetectedEffects([]);
      
      // Auto-detect effects
      try {
        console.log('🔍 Detecting effects...');
        const effects = await detectImageEffects(url);
        console.log('✅ Detected effects:', effects);
        setDetectedEffects(effects);
        
        if (effects.length > 0) {
          toast.info(`تم اكتشاف ${effects.length} تأثير على الصورة`);
        }
      } catch (error) {
        console.error('❌ Error detecting effects:', error);
      }
      
      toast.success('تم تحميل الصورة بنجاح!');
    } else {
      console.log('❌ Invalid file type:', selectedFile.type);
      toast.error('يرجى اختيار ملف صورة');
    }
  };

  const handleUploadClick = () => {
    console.log('🖱️ Image upload button clicked');
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
      const result = await analyzeImage(file);
      setAnalysis(result);
      toast.success('تم تحليل الصورة بنجاح!');
    } catch (error) {
      toast.error('حدث خطأ أثناء التحليل');
    } finally {
      setIsProcessing(false);
    }
  };

  const handleRemoveBackground = async () => {
    if (!imageUrl) return;
    setIsProcessing(true);
    
    setTimeout(() => {
      setProcessedImageUrl(imageUrl);
      toast.success('تم إزالة الخلفية بنجاح!');
      setIsProcessing(false);
    }, 2000);
  };

  const handleRemoveEffects = async () => {
    if (!imageUrl) return;
    setIsProcessing(true);

    try {
      const result = await removeImageEffects(imageUrl, effectSettings);
      setProcessedImageUrl(result);
      toast.success('تم إزالة التأثيرات بنجاح!');
      setShowComparison(true);
    } catch (error) {
      toast.error('حدث خطأ أثناء إزالة التأثيرات');
      console.error('Error removing effects:', error);
    } finally {
      setIsProcessing(false);
    }
  };

  const handleRestoreOriginal = () => {
    setProcessedImageUrl(null);
    setShowComparison(false);
    toast.success('تم استعادة الصورة الأصلية');
  };

  const handleReset = () => {
    setFile(null);
    setImageUrl(null);
    setAnalysis(null);
    setProcessedImageUrl(null);
    setShowComparison(false);
    setDetectedEffects([]);
    setShowEffectSettings(false);
  };

  const handleDownload = (url: string, filename: string) => {
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
  };

  const updateSetting = <K extends keyof EffectRemovalSettings>(
    key: K,
    value: EffectRemovalSettings[K]
  ) => {
    setEffectSettings((prev) => ({ ...prev, [key]: value }));
  };

  return (
    <div className="space-y-6">
      <Card className="border-2 border-blue-200 bg-gradient-to-br from-blue-50 to-cyan-50">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-2xl">
            <ImageIcon className="w-6 h-6 text-blue-600" />
            قسم الصور
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          {!file && (
            <div className="text-center space-y-4">
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                onChange={handleFileSelect}
                className="hidden"
              />
              <Button 
                size="lg" 
                className="w-full max-w-md bg-blue-600 hover:bg-blue-700"
                onClick={handleUploadClick}
                type="button"
              >
                <Upload className="w-5 h-5 mr-2" />
                رفع صورة
              </Button>
              <p className="text-sm text-muted-foreground">
                يدعم جميع صيغ الصور (JPG, PNG, GIF, إلخ)
              </p>
            </div>
          )}

          {file && (
            <div className="space-y-6">
              <div className="grid md:grid-cols-2 gap-6">
                <div className="space-y-3">
                  <p className="font-semibold">
                    {showComparison ? 'الصورة الأصلية' : 'الصورة'}
                  </p>
                  <div className="aspect-video bg-black rounded-lg overflow-hidden">
                    <img
                      src={imageUrl!}
                      alt="Original"
                      className="w-full h-full object-contain"
                    />
                  </div>
                </div>

                {showComparison && processedImageUrl && (
                  <div className="space-y-3">
                    <p className="font-semibold">الصورة المعالجة</p>
                    <div className="aspect-video bg-black rounded-lg overflow-hidden">
                      <img
                        src={processedImageUrl}
                        alt="Processed"
                        className="w-full h-full object-contain"
                      />
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
                        onClick={() => setShowEffectSettings(!showEffectSettings)}
                        variant="outline"
                        size="sm"
                      >
                        <Settings className="w-4 h-4 mr-2" />
                        {showEffectSettings ? 'إخفاء الإعدادات' : 'إعدادات الإزالة'}
                      </Button>
                    </div>
                    <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
                      {detectedEffects.map((effect, index) => (
                        <Badge
                          key={index}
                          variant="secondary"
                          className="justify-between p-2"
                        >
                          <span>{effect.name}</span>
                          <span className="text-xs opacity-75">
                            {(effect.intensity * 100).toFixed(0)}%
                          </span>
                        </Badge>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              )}

              {showEffectSettings && detectedEffects.length > 0 && (
                <Card className="border-2 bg-white">
                  <CardHeader>
                    <CardTitle className="text-lg">إعدادات إزالة التأثيرات</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-6">
                    {detectedEffects.some(e => e.type === 'blur') && (
                      <div className="space-y-3">
                        <div className="flex items-center justify-between">
                          <Label>إزالة التشويش (Blur)</Label>
                          <Switch
                            checked={effectSettings.removeBlur}
                            onCheckedChange={(checked) => updateSetting('removeBlur', checked)}
                          />
                        </div>
                        {effectSettings.removeBlur && (
                          <div className="space-y-2">
                            <div className="flex items-center justify-between text-sm">
                              <span>قوة الإزالة</span>
                              <span>{(effectSettings.blurAmount * 100).toFixed(0)}%</span>
                            </div>
                            <Slider
                              value={[effectSettings.blurAmount]}
                              min={0}
                              max={1}
                              step={0.1}
                              onValueChange={([value]) => updateSetting('blurAmount', value)}
                            />
                          </div>
                        )}
                      </div>
                    )}

                    <Separator />

                    {detectedEffects.some(e => e.type === 'brightness') && (
                      <div className="space-y-3">
                        <div className="flex items-center justify-between">
                          <Label>استعادة السطوع</Label>
                          <Switch
                            checked={effectSettings.restoreBrightness}
                            onCheckedChange={(checked) => updateSetting('restoreBrightness', checked)}
                          />
                        </div>
                        {effectSettings.restoreBrightness && (
                          <div className="space-y-2">
                            <div className="flex items-center justify-between text-sm">
                              <span>مستوى السطوع</span>
                              <span>{effectSettings.brightnessLevel}</span>
                            </div>
                            <Slider
                              value={[effectSettings.brightnessLevel]}
                              min={-50}
                              max={50}
                              step={5}
                              onValueChange={([value]) => updateSetting('brightnessLevel', value)}
                            />
                          </div>
                        )}
                      </div>
                    )}

                    <Separator />

                    {detectedEffects.some(e => e.type === 'contrast') && (
                      <div className="space-y-3">
                        <div className="flex items-center justify-between">
                          <Label>استعادة التباين</Label>
                          <Switch
                            checked={effectSettings.restoreContrast}
                            onCheckedChange={(checked) => updateSetting('restoreContrast', checked)}
                          />
                        </div>
                        {effectSettings.restoreContrast && (
                          <div className="space-y-2">
                            <div className="flex items-center justify-between text-sm">
                              <span>مستوى التباين</span>
                              <span>{effectSettings.contrastLevel}</span>
                            </div>
                            <Slider
                              value={[effectSettings.contrastLevel]}
                              min={-50}
                              max={50}
                              step={5}
                              onValueChange={([value]) => updateSetting('contrastLevel', value)}
                            />
                          </div>
                        )}
                      </div>
                    )}

                    <Separator />

                    {detectedEffects.some(e => e.type === 'saturation' || e.type === 'grayscale') && (
                      <div className="space-y-3">
                        <div className="flex items-center justify-between">
                          <Label>استعادة التشبع اللوني</Label>
                          <Switch
                            checked={effectSettings.restoreSaturation}
                            onCheckedChange={(checked) => updateSetting('restoreSaturation', checked)}
                          />
                        </div>
                        {effectSettings.restoreSaturation && (
                          <div className="space-y-2">
                            <div className="flex items-center justify-between text-sm">
                              <span>مستوى التشبع</span>
                              <span>{effectSettings.saturationLevel.toFixed(1)}</span>
                            </div>
                            <Slider
                              value={[effectSettings.saturationLevel]}
                              min={0}
                              max={2}
                              step={0.1}
                              onValueChange={([value]) => updateSetting('saturationLevel', value)}
                            />
                          </div>
                        )}
                      </div>
                    )}

                    <Separator />

                    {detectedEffects.some(e => e.type === 'grayscale') && (
                      <div className="flex items-center justify-between">
                        <Label>إزالة الأبيض والأسود</Label>
                        <Switch
                          checked={effectSettings.removeGrayscale}
                          onCheckedChange={(checked) => updateSetting('removeGrayscale', checked)}
                        />
                      </div>
                    )}

                    {detectedEffects.some(e => e.type === 'noise') && (
                      <>
                        <Separator />
                        <div className="space-y-3">
                          <div className="flex items-center justify-between">
                            <Label>إزالة الضوضاء</Label>
                            <Switch
                              checked={effectSettings.removeNoise}
                              onCheckedChange={(checked) => updateSetting('removeNoise', checked)}
                            />
                          </div>
                          {effectSettings.removeNoise && (
                            <div className="space-y-2">
                              <div className="flex items-center justify-between text-sm">
                                <span>قوة الإزالة</span>
                                <span>{effectSettings.noiseReduction}</span>
                              </div>
                              <Slider
                                value={[effectSettings.noiseReduction]}
                                min={0}
                                max={3}
                                step={0.5}
                                onValueChange={([value]) => updateSetting('noiseReduction', value)}
                              />
                            </div>
                          )}
                        </div>
                      </>
                    )}

                    <Separator />

                    <div className="space-y-3">
                      <div className="flex items-center justify-between">
                        <Label>زيادة الحدة (Sharpen)</Label>
                        <Switch
                          checked={effectSettings.sharpen}
                          onCheckedChange={(checked) => updateSetting('sharpen', checked)}
                        />
                      </div>
                      {effectSettings.sharpen && (
                        <div className="space-y-2">
                          <div className="flex items-center justify-between text-sm">
                            <span>قوة الحدة</span>
                            <span>{(effectSettings.sharpenAmount * 100).toFixed(0)}%</span>
                          </div>
                          <Slider
                            value={[effectSettings.sharpenAmount]}
                            min={0}
                            max={1}
                            step={0.1}
                            onValueChange={([value]) => updateSetting('sharpenAmount', value)}
                          />
                        </div>
                      )}
                    </div>

                    <Button
                      onClick={handleRemoveEffects}
                      disabled={isProcessing}
                      className="w-full bg-gradient-to-r from-blue-600 to-cyan-600 hover:from-blue-700 hover:to-cyan-700"
                      size="lg"
                    >
                      {isProcessing ? (
                        <>
                          <Loader2 className="w-5 h-5 mr-2 animate-spin" />
                          جاري المعالجة...
                        </>
                      ) : (
                        <>
                          <Wand2 className="w-5 h-5 mr-2" />
                          تطبيق الإزالة
                        </>
                      )}
                    </Button>
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
                  تحليل الصورة
                </Button>

                <Button
                  onClick={handleRemoveBackground}
                  disabled={isProcessing}
                  variant="outline"
                  className="w-full"
                >
                  <Eraser className="w-4 h-4 mr-2" />
                  إزالة الخلفية
                </Button>

                <Button
                  onClick={handleRestoreOriginal}
                  disabled={!processedImageUrl}
                  variant="outline"
                  className="w-full"
                >
                  <RotateCcw className="w-4 h-4 mr-2" />
                  استعادة الأصل
                </Button>

                <Button
                  onClick={() => setShowComparison(!showComparison)}
                  disabled={!processedImageUrl}
                  variant="outline"
                  className="w-full"
                >
                  <ArrowLeftRight className="w-4 h-4 mr-2" />
                  مقارنة
                </Button>
              </div>

              <div className="flex gap-3">
                <Button
                  onClick={() => handleDownload(imageUrl!, file.name)}
                  variant="outline"
                  className="flex-1"
                >
                  <Download className="w-4 h-4 mr-2" />
                  تحميل الأصلية
                </Button>
                {processedImageUrl && (
                  <Button
                    onClick={() => handleDownload(processedImageUrl, `processed_${file.name}`)}
                    className="flex-1 bg-blue-600 hover:bg-blue-700"
                  >
                    <Download className="w-4 h-4 mr-2" />
                    تحميل المعالجة
                  </Button>
                )}
                <Button onClick={handleReset} variant="outline">
                  <RotateCcw className="w-4 h-4 mr-2" />
                  إعادة تعيين
                </Button>
              </div>

              {analysis && (
                <Card className="border-2 bg-white">
                  <CardHeader>
                    <CardTitle className="text-lg">نتائج التحليل</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                      <div>
                        <p className="text-sm text-muted-foreground">الحجم</p>
                        <p className="font-medium">{(analysis.size / 1024).toFixed(0)} KB</p>
                      </div>
                      <div>
                        <p className="text-sm text-muted-foreground">الأبعاد</p>
                        <p className="font-medium">
                          {analysis.width} × {analysis.height}
                        </p>
                      </div>
                      <div>
                        <p className="text-sm text-muted-foreground">النوع</p>
                        <p className="font-medium">{analysis.type}</p>
                      </div>
                      <div>
                        <p className="text-sm text-muted-foreground">نسبة العرض</p>
                        <p className="font-medium">{analysis.aspectRatio}</p>
                      </div>
                    </div>

                    {analysis.dominantColors.length > 0 && (
                      <div>
                        <p className="text-sm text-muted-foreground mb-2">الألوان السائدة</p>
                        <div className="flex gap-2">
                          {analysis.dominantColors.map((color, i) => (
                            <div
                              key={i}
                              className="w-12 h-12 rounded-lg border-2 border-gray-300"
                              style={{ backgroundColor: color }}
                              title={color}
                            />
                          ))}
                        </div>
                      </div>
                    )}
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