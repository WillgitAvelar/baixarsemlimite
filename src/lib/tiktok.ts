export interface TikTokVideoData {
  id: string;
  title: string;
  cover: string;
  playUrl: string;
  hdPlayUrl: string;
  musicUrl: string;
  author: {
    nickname: string;
    avatar: string;
  };
  stats: {
    likes: number;
    comments: number;
    shares: number;
    plays: number;
  };
  duration: number;
}

export function extractTikTokId(url: string): string | null {
  const patterns = [
    /tiktok\.com\/@[\w.]+\/video\/(\d+)/,
    /tiktok\.com\/t\/(\w+)/,
    /vm\.tiktok\.com\/(\w+)/,
    /vt\.tiktok\.com\/(\w+)/,
  ];
  for (const p of patterns) {
    const match = url.match(p);
    if (match) return match[1];
  }
  return url.match(/(\d{15,})/) ? url.match(/(\d{15,})/)![1] : null;
}

export function isValidTikTokUrl(url: string): boolean {
  return /tiktok\.com/.test(url) || /vm\.tiktok\.com/.test(url) || /vt\.tiktok\.com/.test(url);
}

async function fetchFromTikwm(url: string): Promise<TikTokVideoData> {
  const response = await fetch(`https://www.tikwm.com/api/?url=${encodeURIComponent(url)}&hd=1&web=1`);
  if (!response.ok) throw new Error("tikwm failed");
  const json = await response.json();
  if (json.code !== 0 || !json.data) throw new Error("tikwm no data");

  const d = json.data;
  const baseUrl = "https://www.tikwm.com";
  const buildUrl = (path: string) => path?.startsWith("http") ? path : `${baseUrl}${path}`;

  // Prioriza HD: tenta hdplay, wmplay, depois play
  const hdUrl = d.hdplay || d.wmplay || d.play;

  return {
    id: d.id,
    title: d.title || "Sem título",
    cover: d.cover || d.origin_cover,
    playUrl: buildUrl(d.play),
    hdPlayUrl: buildUrl(hdUrl),
    musicUrl: d.music ? buildUrl(d.music) : "",
    author: {
      nickname: d.author?.nickname || "Desconhecido",
      avatar: d.author?.avatar || "",
    },
    stats: {
      likes: d.digg_count || 0,
      comments: d.comment_count || 0,
      shares: d.share_count || 0,
      plays: d.play_count || 0,
    },
    duration: d.duration || 0,
  };
}

async function fetchFromTikcdn(url: string): Promise<TikTokVideoData> {
  const response = await fetch(`https://tikcdn.io/ssstik/${encodeURIComponent(url)}`);
  if (!response.ok) throw new Error("tikcdn failed");
  const json = await response.json();
  if (!json || !json.id) throw new Error("tikcdn no data");

  return {
    id: json.id || Date.now().toString(),
    title: json.title || "Sem título",
    cover: json.cover || "",
    playUrl: json.play || json.wmplay || "",
    hdPlayUrl: json.hdplay || json.play || "",
    musicUrl: json.music || "",
    author: {
      nickname: json.author?.nickname || "Desconhecido",
      avatar: json.author?.avatar || "",
    },
    stats: {
      likes: json.digg_count || 0,
      comments: json.comment_count || 0,
      shares: json.share_count || 0,
      plays: json.play_count || 0,
    },
    duration: json.duration || 0,
  };
}

async function fetchFromTikwmV2(url: string): Promise<TikTokVideoData> {
  const response = await fetch("https://www.tikwm.com/api/", {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: `url=${encodeURIComponent(url)}&count=12&cursor=0&web=1&hd=1`,
  });
  if (!response.ok) throw new Error("tikwm v2 failed");
  const json = await response.json();
  if (json.code !== 0 || !json.data) throw new Error("tikwm v2 no data");

  const d = json.data;
  const baseUrl = "https://www.tikwm.com";
  const buildUrl = (path: string) => path?.startsWith("http") ? path : `${baseUrl}${path}`;

  const hdUrl = d.hdplay || d.wmplay || d.play;

  return {
    id: d.id,
    title: d.title || "Sem título",
    cover: d.cover || d.origin_cover,
    playUrl: buildUrl(d.play),
    hdPlayUrl: buildUrl(hdUrl),
    musicUrl: d.music ? buildUrl(d.music) : "",
    author: {
      nickname: d.author?.nickname || "Desconhecido",
      avatar: d.author?.avatar || "",
    },
    stats: {
      likes: d.digg_count || 0,
      comments: d.comment_count || 0,
      shares: d.share_count || 0,
      plays: d.play_count || 0,
    },
    duration: d.duration || 0,
  };
}

export async function fetchTikTokVideo(url: string): Promise<TikTokVideoData> {
  const strategies = [
    () => fetchFromTikwm(url),
    () => fetchFromTikwmV2(url),
    () => fetchFromTikcdn(url),
  ];

  let lastError: Error | null = null;

  for (const strategy of strategies) {
    try {
      const result = await strategy();
      if (result && result.playUrl) return result;
    } catch (err) {
      lastError = err instanceof Error ? err : new Error(String(err));
      console.warn("Strategy failed, trying next...", lastError.message);
    }
  }

  throw new Error("Não foi possível processar este vídeo. Todas as tentativas falharam. Verifique a URL e tente novamente.");
}

export function formatNumber(n: number): string {
  if (n >= 1_000_000) return (n / 1_000_000).toFixed(1) + "M";
  if (n >= 1_000) return (n / 1_000).toFixed(1) + "K";
  return n.toString();
}

export function formatDuration(seconds: number): string {
  const m = Math.floor(seconds / 60);
  const s = seconds % 60;
  return `${m}:${s.toString().padStart(2, "0")}`;
}
