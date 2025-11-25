import { useState, lazy, Suspense } from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Image, Video, Waves, Target, Terminal, Shield, Link as LinkIcon, Search, Presentation, Loader2 } from 'lucide-react';

// Lazy load heavy components
const ImageSection = lazy(() => import('@/components/ImageSection'));
const VideoSection = lazy(() => import('@/components/VideoSection'));
const AudioSection = lazy(() => import('@/components/AudioSection'));
const FaceMatchingSection = lazy(() => import('@/components/FaceMatchingSection'));
const ForensicsSection = lazy(() => import('@/components/ForensicsSection'));
const URLAnalysisSection = lazy(() => import('@/components/URLAnalysisSection'));
const ReverseSearchSection = lazy(() => import('@/components/ReverseSearchSection'));
const PresentationStudio = lazy(() => import('@/components/PresentationStudio'));

// Loading component
const LoadingSpinner = () => (
  <div className="flex items-center justify-center min-h-[400px]">
    <div className="text-center space-y-4">
      <Loader2 className="w-12 h-12 animate-spin mx-auto text-cyan-400" />
      <p className="text-cyan-300 font-mono">جاري التحميل...</p>
    </div>
  </div>
);

export default function Index() {
  const [activeTab, setActiveTab] = useState('matching');

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-950 via-blue-950 to-indigo-950">
      {/* Header */}
      <header className="border-b border-cyan-800 bg-black/80 backdrop-blur-sm sticky top-0 z-50 shadow-lg shadow-cyan-900/50">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-lg bg-gradient-to-br from-cyan-500 to-blue-600 flex items-center justify-center shadow-lg shadow-cyan-500/50 animate-pulse">
                <Terminal className="w-6 h-6 text-black font-bold" />
              </div>
              <div>
                <h1 className="text-2xl font-bold font-mono text-cyan-400">
                  KHALED_ELARIAN.AI
                </h1>
                <p className="text-xs text-cyan-600 font-mono">
                  [ADVANCED MEDIA ANALYSIS SYSTEM v3.0]
                </p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-2 h-2 rounded-full bg-green-500 animate-pulse"></div>
              <span className="text-xs text-green-400 font-mono">ONLINE</span>
            </div>
          </div>
        </div>
      </header>

      <main className="container mx-auto px-4 py-8">
        <div className="max-w-7xl mx-auto space-y-8">
          {/* Title */}
          <div className="text-center space-y-4 animate-in fade-in slide-in-from-bottom-4 duration-700">
            <div className="inline-block p-4 rounded-lg bg-cyan-950/30 border border-cyan-800">
              <pre className="text-cyan-400 font-mono text-sm">
{`╔═══════════════════════════════════════════════════╗
║  BIOMETRIC ANALYSIS & MEDIA PROCESSING SYSTEM     ║
║  نظام التحليل البيومتري ومعالجة الوسائط         ║
╚═══════════════════════════════════════════════════╝`}
              </pre>
            </div>
            <p className="text-cyan-300 font-mono text-sm">
              {'>'} SELECT_MODULE: [MATCHING | FORENSICS | URL | REVERSE | PRESENTATION | IMAGE | VIDEO | AUDIO]
            </p>
          </div>

          <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
            <TabsList className="grid w-full grid-cols-4 lg:grid-cols-8 h-auto p-1 bg-black/60 backdrop-blur-sm border border-cyan-800">
              <TabsTrigger
                value="matching"
                className="flex flex-col gap-2 py-4 data-[state=active]:bg-cyan-950 data-[state=active]:text-cyan-300 data-[state=active]:border data-[state=active]:border-cyan-600 font-mono"
              >
                <Target className="w-5 h-5" />
                <span className="text-xs">MATCHING</span>
                <span className="text-[10px] text-cyan-600">المطابقة</span>
              </TabsTrigger>
              <TabsTrigger
                value="forensics"
                className="flex flex-col gap-2 py-4 data-[state=active]:bg-orange-950 data-[state=active]:text-orange-300 data-[state=active]:border data-[state=active]:border-orange-600 font-mono"
              >
                <Shield className="w-5 h-5" />
                <span className="text-xs">FORENSICS</span>
                <span className="text-[10px] text-orange-600">كشف التلاعب</span>
              </TabsTrigger>
              <TabsTrigger
                value="url"
                className="flex flex-col gap-2 py-4 data-[state=active]:bg-indigo-950 data-[state=active]:text-indigo-300 data-[state=active]:border data-[state=active]:border-indigo-600 font-mono"
              >
                <LinkIcon className="w-5 h-5" />
                <span className="text-xs">URL</span>
                <span className="text-[10px] text-indigo-600">تحليل الرابط</span>
              </TabsTrigger>
              <TabsTrigger
                value="reverse"
                className="flex flex-col gap-2 py-4 data-[state=active]:bg-violet-950 data-[state=active]:text-violet-300 data-[state=active]:border data-[state=active]:border-violet-600 font-mono"
              >
                <Search className="w-5 h-5" />
                <span className="text-xs">REVERSE</span>
                <span className="text-[10px] text-violet-600">بحث عكسي</span>
              </TabsTrigger>
              <TabsTrigger
                value="presentation"
                className="flex flex-col gap-2 py-4 data-[state=active]:bg-pink-950 data-[state=active]:text-pink-300 data-[state=active]:border data-[state=active]:border-pink-600 font-mono"
              >
                <Presentation className="w-5 h-5" />
                <span className="text-xs">SLIDES</span>
                <span className="text-[10px] text-pink-600">العروض</span>
              </TabsTrigger>
              <TabsTrigger
                value="image"
                className="flex flex-col gap-2 py-4 data-[state=active]:bg-blue-950 data-[state=active]:text-blue-300 data-[state=active]:border data-[state=active]:border-blue-600 font-mono"
              >
                <Image className="w-5 h-5" />
                <span className="text-xs">IMAGE</span>
                <span className="text-[10px] text-blue-600">الصور</span>
              </TabsTrigger>
              <TabsTrigger
                value="video"
                className="flex flex-col gap-2 py-4 data-[state=active]:bg-green-950 data-[state=active]:text-green-300 data-[state=active]:border data-[state=active]:border-green-600 font-mono"
              >
                <Video className="w-5 h-5" />
                <span className="text-xs">VIDEO</span>
                <span className="text-[10px] text-green-600">الفيديو</span>
              </TabsTrigger>
              <TabsTrigger
                value="audio"
                className="flex flex-col gap-2 py-4 data-[state=active]:bg-purple-950 data-[state=active]:text-purple-300 data-[state=active]:border data-[state=active]:border-purple-600 font-mono"
              >
                <Waves className="w-5 h-5" />
                <span className="text-xs">AUDIO</span>
                <span className="text-[10px] text-purple-600">الصوت</span>
              </TabsTrigger>
            </TabsList>

            <TabsContent value="matching" className="mt-6">
              <Suspense fallback={<LoadingSpinner />}>
                <FaceMatchingSection />
              </Suspense>
            </TabsContent>

            <TabsContent value="forensics" className="mt-6">
              <Suspense fallback={<LoadingSpinner />}>
                <ForensicsSection />
              </Suspense>
            </TabsContent>

            <TabsContent value="url" className="mt-6">
              <Suspense fallback={<LoadingSpinner />}>
                <URLAnalysisSection />
              </Suspense>
            </TabsContent>

            <TabsContent value="reverse" className="mt-6">
              <Suspense fallback={<LoadingSpinner />}>
                <ReverseSearchSection />
              </Suspense>
            </TabsContent>

            <TabsContent value="presentation" className="mt-6">
              <Suspense fallback={<LoadingSpinner />}>
                <PresentationStudio />
              </Suspense>
            </TabsContent>

            <TabsContent value="image" className="mt-6">
              <Suspense fallback={<LoadingSpinner />}>
                <ImageSection />
              </Suspense>
            </TabsContent>

            <TabsContent value="video" className="mt-6">
              <Suspense fallback={<LoadingSpinner />}>
                <VideoSection />
              </Suspense>
            </TabsContent>

            <TabsContent value="audio" className="mt-6">
              <Suspense fallback={<LoadingSpinner />}>
                <AudioSection />
              </Suspense>
            </TabsContent>
          </Tabs>
        </div>
      </main>

      {/* Footer */}
      <footer className="border-t border-cyan-800 bg-black/80 backdrop-blur-sm mt-16">
        <div className="container mx-auto px-4 py-6">
          <div className="space-y-3">
            <div className="flex items-center justify-between text-xs font-mono">
              <p className="text-cyan-600">
                © 2024 KHALED_ELARIAN.AI - ALL_RIGHTS_RESERVED
              </p>
              <div className="flex items-center gap-4">
                <span className="text-cyan-600">STATUS: OPERATIONAL</span>
                <span className="text-cyan-600">UPTIME: 99.9%</span>
              </div>
            </div>
            <div className="text-center pt-2 border-t border-cyan-900/50">
              <p className="text-cyan-400 font-mono text-sm font-bold">
                برمجة وتطوير: خالد العريان
              </p>
              <p className="text-cyan-600 font-mono text-xs mt-1">
                Programming & Development: Khaled Elarian
              </p>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}