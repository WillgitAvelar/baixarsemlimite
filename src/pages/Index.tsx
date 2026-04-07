import { useState, useCallback } from "react";
import { Search, Loader2, ArrowDown } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { VideoCard } from "@/components/VideoCard";
import { DownloadHistory, type HistoryItem } from "@/components/DownloadHistory";
import { FeatureCards } from "@/components/FeatureCards";
import { fetchVideo, isValidUrl, detectPlatform, getPlatformLabel, type VideoData } from "@/lib/downloader";
import { toast } from "@/hooks/use-toast";

const HISTORY_KEY = "baixar_history";

function loadHistory(): HistoryItem[] {
  try { return JSON.parse(localStorage.getItem(HISTORY_KEY) || "[]"); }
  catch { return []; }
}

function saveHistory(items: HistoryItem[]) {
  localStorage.setItem(HISTORY_KEY, JSON.stringify(items.slice(0, 20)));
}

const platformIcons: Record<string, string> = {
  tiktok: "🎵", youtube: "▶️", instagram: "📸", pinterest: "📌",
};

const Index = () => {
  const [url, setUrl] = useState("");
  const [loading, setLoading] = useState(false);
  const [video, setVideo] = useState<VideoData | null>(null);
  const [history, setHistory] = useState<HistoryItem[]>(loadHistory);

  const detectedPlatform = url.trim() ? detectPlatform(url) : null;

  const handleFetch = useCallback(async (inputUrl?: string) => {
    const targetUrl = inputUrl || url;
    if (!targetUrl.trim()) {
      toast({ title: "Cole uma URL", description: "Insira o link do vídeo.", variant: "destructive" });
      return;
    }
    if (!isValidUrl(targetUrl)) {
      toast({ title: "URL inválida", description: "Insira um link do TikTok, YouTube, Instagram ou Pinterest.", variant: "destructive" });
      return;
    }

    setLoading(true);
    setVideo(null);

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
      const updated = [newItem, ...history.filter((h) => h.id !== data.id)].slice(0, 20);
      setHistory(updated);
      saveHistory(updated);
    } catch (err) {
      toast({
        title: "Erro",
        description: err instanceof Error ? err.message : "Não foi possível processar o vídeo.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  }, [url, history]);

  const handlePaste = async () => {
    try {
      const text = await navigator.clipboard.readText();
      if (text && isValidUrl(text)) {
        setUrl(text);
        handleFetch(text);
      } else if (text) {
        setUrl(text);
      }
    } catch { /* clipboard not available */ }
  };

  const handleHistorySelect = (historyUrl: string) => {
    setUrl(historyUrl);
    handleFetch(historyUrl);
  };

  return (
    <div className="min-h-screen bg-background relative overflow-hidden">
      {/* Background effects */}
      <div className="fixed inset-0 pointer-events-none">
        <div className="absolute top-0 left-1/4 w-96 h-96 bg-primary/5 rounded-full blur-3xl" />
        <div className="absolute bottom-0 right-1/4 w-96 h-96 bg-accent/5 rounded-full blur-3xl" />
      </div>

      <div className="relative z-10 max-w-2xl mx-auto px-4 py-8 md:py-16">
        {/* Header */}
        <header className="text-center mb-10">
          <div className="inline-flex items-center gap-2 mb-4 px-3 py-1 rounded-full border border-border/50 bg-card/50 text-xs text-muted-foreground">
            <span className="w-1.5 h-1.5 rounded-full gradient-main animate-pulse-glow" />
            Gratuito & Sem Limites
          </div>
          <h1 className="text-4xl md:text-5xl font-display font-bold mb-3 tracking-tight">
            <span className="text-gradient-main">Baixar</span>
          </h1>
          <p className="text-muted-foreground text-sm md:text-base max-w-md mx-auto">
            Baixe vídeos e áudios do TikTok, YouTube, Instagram e Pinterest — sem marca d'água, rápido e gratuito.
          </p>

          {/* Platform badges */}
          <div className="flex items-center justify-center gap-2 mt-4">
            {(["tiktok", "youtube", "instagram", "pinterest"] as const).map((p) => (
              <span key={p} className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-card/60 border border-border/30 text-xs text-muted-foreground">
                {platformIcons[p]} {getPlatformLabel(p)}
              </span>
            ))}
          </div>

        </header>
<script async src="https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js?client=ca-pub-9761562870144270"
     crossOrigin="anonymous"></script>
        {/* Search */}
        <div className="mb-8">
          <div className="flex gap-2">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <Input
                value={url}
                onChange={(e) => setUrl(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && handleFetch()}
                placeholder="Cole o link do vídeo aqui..."
                className="pl-10 h-12 bg-card/80 border-border/50 focus-visible:ring-primary/50 font-body"
              />
              {detectedPlatform && (
                <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-accent font-medium">
                  {platformIcons[detectedPlatform]} {getPlatformLabel(detectedPlatform)}
                </span>
              )}
            </div>
            <Button
              onClick={() => handleFetch()}
              disabled={loading}
              className="h-12 px-6 gradient-main text-primary-foreground hover:opacity-90 glow-primary"
            >
              {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <ArrowDown className="w-4 h-4" />}
            </Button>
          </div>
          <button onClick={handlePaste}
            className="mt-2 text-xs text-muted-foreground hover:text-accent transition-colors">
            📋 Colar da área de transferência
          </button>
        </div>
 <script async src="https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js?client=ca-pub-9761562870144270"
     crossOrigin="anonymous"></script>
{/* Primeiro Anuncio */}
<ins className="adsbygoogle"
     style={{ display: "block" }}
     data-ad-client="ca-pub-9761562870144270"
     data-ad-slot="5574341635"
     data-ad-format="auto"
     data-full-width-responsive="true"></ins>
<script>
     (adsbygoogle = window.adsbygoogle || []).push({});
</script>
        {/* Video Result */}
        {video && (
          <div className="mb-8">
            <VideoCard video={video} />
          </div>
        )}

        {/* History */}
        <div className="mb-8">
          <DownloadHistory
            items={history}
            onClear={() => { setHistory([]); localStorage.removeItem(HISTORY_KEY); }}
            onSelect={handleHistorySelect}
          />
        </div>

        {/* Features */}
        {!video && (
          <div className="mb-8">
            <h2 className="text-sm font-display font-semibold text-center mb-4 text-muted-foreground">
              Por que usar o Baixar?
            </h2>
            <FeatureCards />
          </div>
        )}

        {/* Footer */}
        <footer className="text-center text-xs text-muted-foreground/60 mt-12">
          <p>Baixar não é afiliado a nenhuma plataforma. Use com responsabilidade.</p>
        </footer>
      </div>
    </div>
  );
};

export default Index;
