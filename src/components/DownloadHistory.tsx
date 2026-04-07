import { Clock, Trash2, ExternalLink } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import type { Platform } from "@/lib/downloader";
import { getPlatformLabel } from "@/lib/downloader";

export interface HistoryItem {
  id: string;
  url: string;
  title: string;
  author: string;
  cover: string;
  platform: Platform;
  timestamp: number;
}

interface DownloadHistoryProps {
  items: HistoryItem[];
  onClear: () => void;
  onSelect: (url: string) => void;
}

export function DownloadHistory({ items, onClear, onSelect }: DownloadHistoryProps) {
  if (items.length === 0) return null;

  return (
    <Card className="border-border/50 bg-card/80 backdrop-blur-sm">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="text-base font-display flex items-center gap-2">
            <Clock className="w-4 h-4 text-accent" />
            Histórico
          </CardTitle>
          <Button variant="ghost" size="sm" onClick={onClear} className="text-muted-foreground hover:text-destructive">
            <Trash2 className="w-3.5 h-3.5 mr-1" />Limpar
          </Button>
        </div>
      </CardHeader>
      <CardContent className="pt-0">
        <div className="space-y-2 max-h-64 overflow-y-auto pr-1">
          {items.map((item) => (
            <button key={item.id + item.timestamp} onClick={() => onSelect(item.url)}
              className="w-full flex items-center gap-3 p-2 rounded-lg hover:bg-secondary/80 transition-colors text-left group">
              {item.cover ? (
                <img src={item.cover} alt="" className="w-10 h-14 rounded object-cover flex-shrink-0" />
              ) : (
                <div className="w-10 h-14 rounded bg-secondary flex-shrink-0" />
              )}
              <div className="flex-1 min-w-0">
                <p className="text-xs font-medium truncate">{item.title}</p>
                <p className="text-xs text-muted-foreground">@{item.author} · {getPlatformLabel(item.platform)}</p>
              </div>
              <ExternalLink className="w-3.5 h-3.5 text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity flex-shrink-0" />
            </button>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}
