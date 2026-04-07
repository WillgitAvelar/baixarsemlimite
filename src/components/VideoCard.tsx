import { Download, Heart, MessageCircle, Share2, Play, Music, Clock } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import type { VideoData } from "@/lib/downloader";
import { formatNumber, formatDuration, makeVideoUnique, generateFileName, getPlatformLabel } from "@/lib/downloader";
import { toast } from "@/hooks/use-toast";

interface VideoCardProps {
  video: VideoData;
}

export function VideoCard({ video }: VideoCardProps) {
  const handleDownload = async (url: string, label: string) => {
    try {
      toast({ title: "Processando vídeo...", description: "Tornando único para o algoritmo" });
      const res = await fetch(url);
      const blob = await res.blob();
      const uniqueBlob = await makeVideoUnique(blob);
      const a = document.createElement("a");
      a.href = URL.createObjectURL(uniqueBlob);
      a.download = generateFileName("mp4");
      a.click();
      URL.revokeObjectURL(a.href);
      toast({ title: "Download concluído! ✨", description: `${label} — vídeo único gerado.` });
    } catch {
      toast({ title: "Erro no download", description: "Tente novamente.", variant: "destructive" });
    }
  };

  const handleMusicDownload = async () => {
    const audioUrl = video.musicUrl || video.playUrl;
    if (!audioUrl) return;
    try {
      toast({ title: "Convertendo para MP3..." });
      const res = await fetch(audioUrl);
      const blob = await res.blob();
      const a = document.createElement("a");
      a.href = URL.createObjectURL(blob);
      a.download = generateFileName("mp3");
      a.click();
      URL.revokeObjectURL(a.href);
      toast({ title: "Áudio MP3 salvo! 🎵" });
    } catch {
      toast({ title: "Erro ao baixar áudio", variant: "destructive" });
    }
  };

  const hasStats = video.stats.plays > 0 || video.stats.likes > 0;

  return (
    <Card className="overflow-hidden border-border/50 bg-card/80 backdrop-blur-sm animate-slide-up">
      <CardContent className="p-0">
        <div className="flex flex-col md:flex-row gap-0">
          {/* Video Preview */}
          <div className="relative w-full md:w-72 aspect-[9/16] md:aspect-auto md:h-96 flex-shrink-0 bg-secondary overflow-hidden group">
            {video.cover ? (
              <img
                src={video.cover}
                alt={video.title}
                className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
              />
            ) : (
              <div className="w-full h-full flex items-center justify-center">
                <Play className="w-12 h-12 text-muted-foreground" />
              </div>
            )}
            <div className="absolute inset-0 bg-gradient-to-t from-background/80 via-transparent to-transparent" />
            <div className="absolute bottom-3 left-3 flex items-center gap-2">
              {video.duration > 0 && (
                <div className="flex items-center gap-1.5 bg-background/60 backdrop-blur-sm rounded-full px-3 py-1">
                  <Clock className="w-3 h-3 text-accent" />
                  <span className="text-xs font-medium">{formatDuration(video.duration)}</span>
                </div>
              )}
              <div className="bg-background/60 backdrop-blur-sm rounded-full px-3 py-1">
                <span className="text-xs font-medium">{getPlatformLabel(video.platform)}</span>
              </div>
            </div>
          </div>

          {/* Info */}
          <div className="flex-1 p-5 flex flex-col justify-between">
            <div>
              <div className="flex items-center gap-3 mb-4">
                {video.author.avatar && (
                  <img src={video.author.avatar} alt={video.author.nickname}
                    className="w-10 h-10 rounded-full ring-2 ring-primary/30" />
                )}
                <span className="font-display font-semibold text-sm">@{video.author.nickname}</span>
              </div>
              <p className="text-sm text-foreground/80 leading-relaxed line-clamp-3 mb-4">{video.title}</p>
              {hasStats && (
                <div className="flex items-center gap-4 text-muted-foreground text-xs">
                  <span className="flex items-center gap-1"><Play className="w-3.5 h-3.5" />{formatNumber(video.stats.plays)}</span>
                  <span className="flex items-center gap-1"><Heart className="w-3.5 h-3.5 text-primary" />{formatNumber(video.stats.likes)}</span>
                  <span className="flex items-center gap-1"><MessageCircle className="w-3.5 h-3.5" />{formatNumber(video.stats.comments)}</span>
                  <span className="flex items-center gap-1"><Share2 className="w-3.5 h-3.5" />{formatNumber(video.stats.shares)}</span>
                </div>
              )}
            </div>

            {/* Download Buttons */}
            <div className="flex flex-wrap gap-2 mt-5">
              <Button onClick={() => handleDownload(video.playUrl, "Sem marca d'água")}
                className="gradient-main text-primary-foreground hover:opacity-90 transition-opacity glow-primary">
                <Download className="w-4 h-4 mr-1.5" />Sem Marca d'Água
              </Button>
              {video.hdPlayUrl && video.hdPlayUrl !== video.playUrl && (
                <Button onClick={() => handleDownload(video.hdPlayUrl, "HD")}
                  variant="outline" className="border-accent/40 text-accent hover:bg-accent/10">
                  <Download className="w-4 h-4 mr-1.5" />HD
                </Button>
              )}
              <Button onClick={handleMusicDownload}
                variant="outline" className="border-primary/40 text-primary hover:bg-primary/10">
                <Music className="w-4 h-4 mr-1.5" />Áudio MP3
              </Button>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
