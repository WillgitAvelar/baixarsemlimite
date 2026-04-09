import { useState, useCallback, useEffect } from "react";
import { Search, Loader2, ArrowDown } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { VideoCard } from "@/components/VideoCard";
import { DownloadHistory, type HistoryItem } from "@/components/DownloadHistory";
import { FeatureCards } from "@/components/FeatureCards";
import { fetchVideo, isValidUrl, detectPlatform, getPlatformLabel, type VideoData } from "@/lib/downloader";
import { toast } from "@/hooks/use-toast";
import { AdBanner } from "@/components/AdBanner";

const HISTORY_KEY = "baixar_history";

type Platform = "tiktok" | "youtube" | "instagram" | "pinterest";

function loadHistory(): HistoryItem[] {
  try {
    return JSON.parse(localStorage.getItem(HISTORY_KEY) || "[]");
  } catch {
    return [];
  }
}

function saveHistory(items: HistoryItem[]) {
  localStorage.setItem(HISTORY_KEY, JSON.stringify(items.slice(0, 20)));
}

const platformIcons: Record<Platform, string> = {
  tiktok: "🎵",
  youtube: "▶️",
  instagram: "📸",
  pinterest: "📌",
};

const Index = () => {
  const [url, setUrl] = useState("");
  const [loading, setLoading] = useState(false);
  const [video, setVideo] = useState<VideoData | null>(null);
  const [history, setHistory] = useState<HistoryItem[]>(loadHistory);

  const detectedPlatform = url.trim() ? detectPlatform(url) : null;

  // ✅ Carrega AdSense corretamente
  useEffect(() => {
    const script = document.createElement("script");
    script.src =
      "https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js?client=ca-pub-9761562870144270";
    script.async = true;
    script.crossOrigin = "anonymous";
    document.body.appendChild(script);
  }, []);

  const handleFetch = useCallback(async (inputUrl?: string) => {
    const targetUrl = inputUrl || url;

    if (!targetUrl.trim()) {
      toast({
        title: "Cole uma URL",
        description: "Insira o link do vídeo.",
        variant: "destructive",
      });
      return;
    }

    if (!isValidUrl(targetUrl)) {
      toast({
        title: "URL inválida",
        description: "Insira um link válido.",
        variant: "destructive",
      });
      return;
    }

    setLoading(true);

    try {
      const data = await fetchVideo(targetUrl);
      setVideo(data);

      const newItem: HistoryItem = {
        id: data.id,
        url: targetUrl,
        title: data.title,
        author: data.author.nickname,
        cover: data.cover,
        platform: data.platform,
        timestamp: Date.now(),
      };

      setHistory((prev) => {
        const updated = [newItem, ...prev.filter((h) => h.id !== data.id)].slice(0, 20);
        saveHistory(updated);
        return updated;
      });

    } catch (err) {
      toast({
        title: "Erro",
        description:
          err instanceof Error
            ? err.message
            : "Não foi possível processar o vídeo.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  }, [url]);

  const handlePaste = async () => {
    try {
      const text = await navigator.clipboard.readText();

      if (text && isValidUrl(text)) {
        setUrl(text);
        handleFetch(text);
      } else if (text) {
        setUrl(text);
      }
    } catch {
      toast({
        title: "Erro ao colar",
        description: "Não foi possível acessar a área de transferência.",
        variant: "destructive",
      });
    }
  };

  const handleHistorySelect = (historyUrl: string) => {
    setUrl(historyUrl);
    handleFetch(historyUrl);
  };

  return (
    <div className="min-h-screen bg-background relative overflow-hidden">
      {/* Background */}
      <div className="fixed inset-0 pointer-events-none">
        <div className="absolute top-0 left-1/4 w-96 h-96 bg-primary/5 rounded-full blur-3xl" />
        <div className="absolute bottom-0 right-1/4 w-96 h-96 bg-accent/5 rounded-full blur-3xl" />
      </div>

      <div className="relative z-10 max-w-2xl mx-auto px-4 py-8 md:py-16">
        
        {/* Header */}
        <header className="text-center mb-10">
          <h1 className="text-4xl font-bold">Baixar</h1>
          <p className="text-muted-foreground">
            Baixe vídeos sem marca d'água
          </p>

          <div className="flex justify-center gap-2 mt-4">
            {(Object.keys(platformIcons) as Platform[]).map((p) => (
              <span key={p} className="text-xs">
                {platformIcons[p]} {getPlatformLabel(p)}
              </span>
            ))}
          </div>
        </header>

        {/* Search */}
        <div className="mb-8">
          <div className="flex gap-2">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4" />
              <Input
                value={url}
                onChange={(e) => setUrl(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && handleFetch()}
                placeholder="Cole o link..."
                className="pl-10 h-12"
              />

              {detectedPlatform && (
                <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs">
                  {platformIcons[detectedPlatform]}{" "}
                  {getPlatformLabel(detectedPlatform)}
                </span>
              )}
            </div>

            <Button onClick={() => handleFetch()} disabled={loading}>
              {loading ? (
                <Loader2 className="animate-spin" />
              ) : (
                <ArrowDown />
              )}
            </Button>
          </div>

          <button onClick={handlePaste} className="text-xs mt-2">
            📋 Colar
          </button>
        </div>

        {/* ✅ Anúncio (componente seguro) */}
        <AdBanner />

        {/* Video */}
        {video && <VideoCard video={video} />}

        {/* History */}
        <DownloadHistory
          items={history}
          onClear={() => {
            setHistory([]);
            localStorage.removeItem(HISTORY_KEY);
          }}
          onSelect={handleHistorySelect}
        />

        {!video && <FeatureCards />}

        <footer className="text-center text-xs mt-10">
          <p>Use com responsabilidade</p>
        </footer>
      </div>
    </div>
  );
};

export default Index;