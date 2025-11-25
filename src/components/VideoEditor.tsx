import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Slider } from '@/components/ui/slider';
import { Badge } from '@/components/ui/badge';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Separator } from '@/components/ui/separator';
import { VideoEditSettings, applyVideoFilter } from '@/lib/videoEnhancement';
import {
  Scissors,
  RotateCw,
  FlipHorizontal,
  FlipVertical,
  Gauge,
  Palette,
  Download,
  Play,
  Pause,
} from 'lucide-react';
import { toast } from 'sonner';

interface VideoEditorProps {
  videoFile: File;
}

export default function VideoEditor({ videoFile }: VideoEditorProps) {
  const [isPlaying, setIsPlaying] = useState(false);
  const [videoUrl] = useState(URL.createObjectURL(videoFile));
  const [filteredUrl, setFilteredUrl] = useState<string | null>(null);
  const [settings, setSettings] = useState<VideoEditSettings>({
    speed: 1,
    rotation: 0,
    flipHorizontal: false,
    flipVertical: false,
    filter: 'none',
    startTime: 0,
    endTime: 0,
  });

  const updateSetting = <K extends keyof VideoEditSettings>(
    key: K,
    value: VideoEditSettings[K]
  ) => {
    setSettings((prev) => ({ ...prev, [key]: value }));
  };

  const handleApplyFilter = async () => {
    if (settings.filter === 'none') {
      setFilteredUrl(null);
      toast.info('تم إزالة الفلتر');
      return;
    }

    try {
      const result = await applyVideoFilter(videoUrl, settings.filter);
      setFilteredUrl(result);
      toast.success('تم تطبيق الفلتر بنجاح!');
    } catch (error) {
      console.error('Error applying filter:', error);
      toast.error('حدث خطأ أثناء تطبيق الفلتر');
    }
  };

  const downloadEditedVideo = () => {
    const a = document.createElement('a');
    a.href = filteredUrl || videoUrl;
    a.download = `edited_${videoFile.name}`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
  };

  const getRotationStyle = () => {
    let transform = `rotate(${settings.rotation}deg)`;
    if (settings.flipHorizontal) transform += ' scaleX(-1)';
    if (settings.flipVertical) transform += ' scaleY(-1)';
    return { transform };
  };

  return (
    <Card className="border-2">
      <CardHeader className="bg-gradient-to-r from-cyan-50 to-blue-50">
        <CardTitle className="flex items-center gap-2">
          <Scissors className="w-5 h-5" />
          تحرير وضبط الفيديو
        </CardTitle>
      </CardHeader>
      <CardContent className="pt-6 space-y-6">
        <div className="flex items-start gap-3 p-4 rounded-lg bg-gradient-to-r from-cyan-50 to-blue-50 border-2 border-cyan-200">
          <Palette className="w-5 h-5 text-cyan-600 mt-0.5 flex-shrink-0" />
          <div className="space-y-1">
            <p className="text-sm font-medium text-cyan-900">
              أدوات تحرير احترافية
            </p>
            <p className="text-xs text-cyan-700">
              استخدم الأدوات أدناه لتحرير الفيديو: التحكم في السرعة، التدوير، القلب،
              وإضافة الفلاتر الاحترافية.
            </p>
          </div>
        </div>

        <div className="grid md:grid-cols-2 gap-6">
          <div className="space-y-6">
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <Label className="flex items-center gap-2">
                  <Gauge className="w-4 h-4" />
                  سرعة الفيديو
                </Label>
                <Badge variant="secondary">{settings.speed}x</Badge>
              </div>
              <Slider
                value={[settings.speed]}
                min={0.25}
                max={4}
                step={0.25}
                onValueChange={([value]) => updateSetting('speed', value)}
              />
              <div className="flex justify-between text-xs text-muted-foreground">
                <span>بطيء جداً (0.25x)</span>
                <span>عادي (1x)</span>
                <span>سريع جداً (4x)</span>
              </div>
            </div>

            <Separator />

            <div className="space-y-4">
              <Label className="text-base font-semibold">التدوير والقلب</Label>

              <div className="grid grid-cols-2 gap-3">
                <Button
                  variant="outline"
                  onClick={() => updateSetting('rotation', (settings.rotation + 90) % 360)}
                  className="w-full"
                >
                  <RotateCw className="w-4 h-4 mr-2" />
                  تدوير 90°
                </Button>
                <Badge variant="secondary" className="flex items-center justify-center">
                  {settings.rotation}°
                </Badge>
              </div>

              <div className="flex items-center justify-between">
                <Label className="flex items-center gap-2">
                  <FlipHorizontal className="w-4 h-4" />
                  قلب أفقي
                </Label>
                <Switch
                  checked={settings.flipHorizontal}
                  onCheckedChange={(checked) => updateSetting('flipHorizontal', checked)}
                />
              </div>

              <div className="flex items-center justify-between">
                <Label className="flex items-center gap-2">
                  <FlipVertical className="w-4 h-4" />
                  قلب عمودي
                </Label>
                <Switch
                  checked={settings.flipVertical}
                  onCheckedChange={(checked) => updateSetting('flipVertical', checked)}
                />
              </div>
            </div>

            <Separator />

            <div className="space-y-4">
              <Label className="text-base font-semibold">الفلاتر الاحترافية</Label>
              <Select
                value={settings.filter}
                onValueChange={(value: VideoEditSettings['filter']) => {
                  updateSetting('filter', value);
                }}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">بدون فلتر</SelectItem>
                  <SelectItem value="grayscale">أبيض وأسود</SelectItem>
                  <SelectItem value="sepia">سيبيا (كلاسيكي)</SelectItem>
                  <SelectItem value="vintage">فينتج (قديم)</SelectItem>
                  <SelectItem value="cool">بارد (أزرق)</SelectItem>
                  <SelectItem value="warm">دافئ (برتقالي)</SelectItem>
                </SelectContent>
              </Select>
              <Button
                onClick={handleApplyFilter}
                variant="outline"
                className="w-full"
              >
                <Palette className="w-4 h-4 mr-2" />
                تطبيق الفلتر
              </Button>
            </div>
          </div>

          <div className="space-y-4">
            <Label className="text-base font-semibold">المعاينة</Label>
            <div className="aspect-video bg-black rounded-lg overflow-hidden relative">
              <img
                src={filteredUrl || videoUrl}
                alt="Video preview"
                className="w-full h-full object-contain"
                style={getRotationStyle()}
              />
              <div className="absolute bottom-4 left-1/2 -translate-x-1/2">
                <Button
                  size="icon"
                  variant="secondary"
                  className="rounded-full"
                  onClick={() => setIsPlaying(!isPlaying)}
                >
                  {isPlaying ? (
                    <Pause className="w-4 h-4" />
                  ) : (
                    <Play className="w-4 h-4" />
                  )}
                </Button>
              </div>
            </div>

            <div className="p-4 rounded-lg bg-gradient-to-r from-blue-50 to-indigo-50 border-2 border-blue-200">
              <h5 className="font-semibold text-sm mb-2 text-blue-900">
                الإعدادات الحالية
              </h5>
              <div className="space-y-1 text-xs text-blue-800">
                <p>• السرعة: {settings.speed}x</p>
                <p>• التدوير: {settings.rotation}°</p>
                <p>• قلب أفقي: {settings.flipHorizontal ? 'نعم' : 'لا'}</p>
                <p>• قلب عمودي: {settings.flipVertical ? 'نعم' : 'لا'}</p>
                <p>• الفلتر: {settings.filter === 'none' ? 'بدون' : settings.filter}</p>
              </div>
            </div>
          </div>
        </div>

        <Separator />

        <div className="flex gap-3">
          <Button
            onClick={() => {
              setSettings({
                speed: 1,
                rotation: 0,
                flipHorizontal: false,
                flipVertical: false,
                filter: 'none',
                startTime: 0,
                endTime: 0,
              });
              setFilteredUrl(null);
            }}
            variant="outline"
            className="flex-1"
          >
            إعادة تعيين
          </Button>
          <Button
            onClick={downloadEditedVideo}
            className="flex-1 bg-gradient-to-r from-cyan-600 to-blue-600 hover:from-cyan-700 hover:to-blue-700"
          >
            <Download className="w-4 h-4 mr-2" />
            تحميل الفيديو المعدّل
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}