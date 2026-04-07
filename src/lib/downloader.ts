export type Platform = "tiktok" | "youtube" | "instagram" | "pinterest";

export interface VideoData {
  id: string;
  platform: Platform;
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

export function detectPlatform(url: string): Platform | null {
  if (/tiktok\.com|vm\.tiktok\.com|vt\.tiktok\.com/.test(url)) return "tiktok";
  if (/youtube\.com|youtu\.be/.test(url)) return "youtube";
  if (/instagram\.com/.test(url)) return "instagram";
  if (/pinterest\.com|pin\.it/.test(url)) return "pinterest";
  return null;
}

export function isValidUrl(url: string): boolean {
  return detectPlatform(url) !== null;
}

export function getPlatformLabel(platform: Platform): string {
  return { tiktok: "TikTok", youtube: "YouTube", instagram: "Instagram", pinterest: "Pinterest" }[platform];
}

export function getPlatformColor(platform: Platform): string {
  return {
    tiktok: "from-[#ff0050] to-[#00f2ea]",
    youtube: "from-[#ff0000] to-[#cc0000]",
    instagram: "from-[#f09433] via-[#e6683c] to-[#dc2743]",
    pinterest: "from-[#e60023] to-[#bd081c]",
  }[platform];
}

// ═══════════════════════════════════════
// CORS Proxy helper
// ═══════════════════════════════════════
const CORS_PROXIES = [
  (u: string) => `https://api.codetabs.com/v1/proxy?quest=${encodeURIComponent(u)}`,
  (u: string) => `https://corsproxy.io/?${encodeURIComponent(u)}`,
  (u: string) => `https://api.allorigins.win/raw?url=${encodeURIComponent(u)}`,
];

async function fetchWithCorsProxy(url: string, init?: RequestInit): Promise<Response> {
  // Try direct first
  try {
    const res = await fetch(url, init);
    if (res.ok) return res;
  } catch { /* try proxies */ }

  // Try proxies (only for GET)
  if (!init?.method || init.method === "GET") {
    for (const proxy of CORS_PROXIES) {
      try {
        const res = await fetch(proxy(url));
        if (res.ok) return res;
      } catch { continue; }
    }
  }

  throw new Error(`Failed to fetch: ${url}`);
}

// ═══════════════════════════════════════
// TikTok
// ═══════════════════════════════════════
async function fetchTikTok(url: string): Promise<VideoData> {
  const strategies = [() => fetchTikwm(url), () => fetchTikwmV2(url), () => fetchTikcdn(url)];
  let lastErr: Error | null = null;
  for (const s of strategies) {
    try {
      const r = await s();
      if (r?.playUrl) return r;
    } catch (e) { lastErr = e instanceof Error ? e : new Error(String(e)); }
  }
  throw lastErr || new Error("TikTok: falha em todas as tentativas");
}

async function fetchTikwm(url: string): Promise<VideoData> {
  const res = await fetch(`https://www.tikwm.com/api/?url=${encodeURIComponent(url)}&hd=1&web=1`);
  if (!res.ok) throw new Error("tikwm failed");
  const json = await res.json();
  if (json.code !== 0 || !json.data) throw new Error("tikwm no data");
  return mapTikwmData(json.data);
}

async function fetchTikwmV2(url: string): Promise<VideoData> {
  const res = await fetch("https://www.tikwm.com/api/", {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: `url=${encodeURIComponent(url)}&count=12&cursor=0&web=1&hd=1`,
  });
  if (!res.ok) throw new Error("tikwm v2 failed");
  const json = await res.json();
  if (json.code !== 0 || !json.data) throw new Error("tikwm v2 no data");
  return mapTikwmData(json.data);
}

function mapTikwmData(d: any): VideoData {
  const base = "https://www.tikwm.com";
  const build = (p: string) => p?.startsWith("http") ? p : `${base}${p}`;
  const hd = d.hdplay || d.wmplay || d.play;
  return {
    id: d.id, platform: "tiktok", title: d.title || "Sem título",
    cover: d.cover || d.origin_cover,
    playUrl: build(d.play), hdPlayUrl: build(hd),
    musicUrl: d.music ? build(d.music) : "",
    author: { nickname: d.author?.nickname || "Desconhecido", avatar: d.author?.avatar || "" },
    stats: { likes: d.digg_count || 0, comments: d.comment_count || 0, shares: d.share_count || 0, plays: d.play_count || 0 },
    duration: d.duration || 0,
  };
}

async function fetchTikcdn(url: string): Promise<VideoData> {
  const res = await fetch(`https://tikcdn.io/ssstik/${encodeURIComponent(url)}`);
  if (!res.ok) throw new Error("tikcdn failed");
  const json = await res.json();
  if (!json?.id) throw new Error("tikcdn no data");
  return {
    id: json.id, platform: "tiktok", title: json.title || "Sem título",
    cover: json.cover || "", playUrl: json.play || json.wmplay || "",
    hdPlayUrl: json.hdplay || json.play || "", musicUrl: json.music || "",
    author: { nickname: json.author?.nickname || "Desconhecido", avatar: json.author?.avatar || "" },
    stats: { likes: json.digg_count || 0, comments: json.comment_count || 0, shares: json.share_count || 0, plays: json.play_count || 0 },
    duration: json.duration || 0,
  };
}

// ═══════════════════════════════════════
// YouTube — uses Piped API (CORS-friendly)
// ═══════════════════════════════════════
const PIPED_INSTANCES = [
  "https://pipedapi.kavin.rocks",
  "https://pipedapi.adminforge.de",
  "https://api.piped.privacydev.net",
];

async function fetchYouTube(url: string): Promise<VideoData> {
  const videoId = extractYouTubeId(url);
  if (!videoId) throw new Error("Não foi possível extrair o ID do vídeo do YouTube.");

  // Try Piped API instances
  for (const instance of PIPED_INSTANCES) {
    try {
      const res = await fetch(`${instance}/streams/${videoId}`);
      if (!res.ok) continue;
      const data = await res.json();

      // Get best video stream (mp4, progressive = has audio+video)
      const videoStreams = [
        ...(data.videoStreams || []),
      ].filter((s: any) => s.mimeType?.includes("video/mp4") && s.videoOnly === false);

      // Sort by quality descending
      videoStreams.sort((a: any, b: any) => {
        const qA = parseInt(a.quality) || 0;
        const qB = parseInt(b.quality) || 0;
        return qB - qA;
      });

      const bestStream = videoStreams[0];
      const hdStream = videoStreams.find((s: any) => parseInt(s.quality) >= 720) || bestStream;

      // Get audio stream
      const audioStreams = (data.audioStreams || [])
        .filter((s: any) => s.mimeType?.includes("audio"))
        .sort((a: any, b: any) => (b.bitrate || 0) - (a.bitrate || 0));

      const playUrl = bestStream?.url || "";
      const hdPlayUrl = hdStream?.url || playUrl;
      const musicUrl = audioStreams[0]?.url || "";

      if (!playUrl && !musicUrl) continue;

      return {
        id: videoId, platform: "youtube",
        title: data.title || "Vídeo do YouTube",
        cover: data.thumbnailUrl || `https://img.youtube.com/vi/${videoId}/maxresdefault.jpg`,
        playUrl, hdPlayUrl: hdPlayUrl || playUrl,
        musicUrl,
        author: { nickname: data.uploader || "YouTube", avatar: data.uploaderAvatar || "" },
        stats: { likes: data.likes || 0, comments: 0, shares: 0, plays: data.views || 0 },
        duration: data.duration || 0,
      };
    } catch { continue; }
  }

  // Fallback: get metadata from noembed, no download available
  let title = "Vídeo do YouTube";
  let author = "YouTube";
  try {
    const oembed = await fetch(`https://noembed.com/embed?url=${encodeURIComponent(url)}`);
    if (oembed.ok) {
      const d = await oembed.json();
      title = d.title || title;
      author = d.author_name || author;
    }
  } catch { /* ignore */ }

  throw new Error(
    `Não foi possível obter o link de download para "${title}". Os servidores estão temporariamente indisponíveis. Tente novamente em alguns minutos.`
  );
}

function extractYouTubeId(url: string): string | null {
  const m = url.match(/(?:youtu\.be\/|youtube\.com\/(?:watch\?v=|shorts\/|embed\/))([a-zA-Z0-9_-]{11})/);
  return m ? m[1] : null;
}

// ═══════════════════════════════════════
// Instagram — multiple API strategies
// ═══════════════════════════════════════
async function fetchInstagram(url: string): Promise<VideoData> {
  // Strategy 1: Use tikwm Instagram support (they also support IG)
  try {
    const res = await fetch(`https://www.tikwm.com/api/?url=${encodeURIComponent(url)}&hd=1&web=1`);
    if (res.ok) {
      const json = await res.json();
      if (json.code === 0 && json.data) {
        const d = json.data;
        const base = "https://www.tikwm.com";
        const build = (p: string) => p?.startsWith("http") ? p : `${base}${p}`;
        return {
          id: d.id || Date.now().toString(), platform: "instagram",
          title: d.title || "Vídeo do Instagram",
          cover: d.cover || d.origin_cover || "",
          playUrl: build(d.play || ""), hdPlayUrl: build(d.hdplay || d.play || ""),
          musicUrl: d.music ? build(d.music) : "",
          author: { nickname: d.author?.nickname || "Instagram", avatar: d.author?.avatar || "" },
          stats: { likes: d.digg_count || 0, comments: d.comment_count || 0, shares: d.share_count || 0, plays: d.play_count || 0 },
          duration: d.duration || 0,
        };
      }
    }
  } catch { /* fallback */ }

  // Strategy 2: saveig
  try {
    const res = await fetchWithCorsProxy(`https://api.saveig.app/api/v1/fetch?url=${encodeURIComponent(url)}`);
    const json = await res.json();
    if (json?.data?.[0]?.url) {
      return {
        id: Date.now().toString(), platform: "instagram",
        title: json.data[0].title || "Vídeo do Instagram",
        cover: json.data[0].thumbnail || "", playUrl: json.data[0].url,
        hdPlayUrl: json.data[0].url, musicUrl: "",
        author: { nickname: "Instagram", avatar: "" },
        stats: { likes: 0, comments: 0, shares: 0, plays: 0 }, duration: 0,
      };
    }
  } catch { /* fallback */ }

  throw new Error("Não foi possível baixar este vídeo do Instagram. Verifique se o perfil é público e tente novamente.");
}

// ═══════════════════════════════════════
// Pinterest
// ═══════════════════════════════════════
async function fetchPinterest(url: string): Promise<VideoData> {
  // Strategy 1: tikwm (supports Pinterest too)
  try {
    const res = await fetch(`https://www.tikwm.com/api/?url=${encodeURIComponent(url)}&hd=1&web=1`);
    if (res.ok) {
      const json = await res.json();
      if (json.code === 0 && json.data) {
        const d = json.data;
        const base = "https://www.tikwm.com";
        const build = (p: string) => p?.startsWith("http") ? p : `${base}${p}`;
        return {
          id: d.id || Date.now().toString(), platform: "pinterest",
          title: d.title || "Conteúdo do Pinterest",
          cover: d.cover || d.origin_cover || "",
          playUrl: build(d.play || ""), hdPlayUrl: build(d.hdplay || d.play || ""),
          musicUrl: d.music ? build(d.music) : "",
          author: { nickname: d.author?.nickname || "Pinterest", avatar: d.author?.avatar || "" },
          stats: { likes: d.digg_count || 0, comments: d.comment_count || 0, shares: d.share_count || 0, plays: d.play_count || 0 },
          duration: d.duration || 0,
        };
      }
    }
  } catch { /* fallback */ }

  // Strategy 2: savepin
  try {
    const res = await fetchWithCorsProxy(`https://api.savepin.app/api/v1/fetch?url=${encodeURIComponent(url)}`);
    const json = await res.json();
    if (json?.data?.url) {
      return {
        id: Date.now().toString(), platform: "pinterest",
        title: json.data.title || "Conteúdo do Pinterest",
        cover: json.data.thumbnail || "", playUrl: json.data.url,
        hdPlayUrl: json.data.url, musicUrl: "",
        author: { nickname: "Pinterest", avatar: "" },
        stats: { likes: 0, comments: 0, shares: 0, plays: 0 }, duration: 0,
      };
    }
  } catch { /* fallback */ }

  throw new Error("Não foi possível baixar este conteúdo do Pinterest. Tente novamente.");
}

// ═══════════════════════════════════════
// Main dispatcher
// ═══════════════════════════════════════
export async function fetchVideo(url: string): Promise<VideoData> {
  const platform = detectPlatform(url);
  if (!platform) throw new Error("URL não reconhecida. Cole um link do TikTok, YouTube, Instagram ou Pinterest.");

  switch (platform) {
    case "tiktok": return fetchTikTok(url);
    case "youtube": return fetchYouTube(url);
    case "instagram": return fetchInstagram(url);
    case "pinterest": return fetchPinterest(url);
  }
}

// ═══════════════════════════════════════
// Utils
// ═══════════════════════════════════════
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

export async function makeVideoUnique(blob: Blob): Promise<Blob> {
  const buffer = await blob.arrayBuffer();
  const original = new Uint8Array(buffer);

  const paddingSize = 512 + Math.floor(Math.random() * 1536);
  const padding = new Uint8Array(paddingSize);
  crypto.getRandomValues(padding);

  const uuid = crypto.randomUUID();
  const comment = `\x00\x00\x00${String.fromCharCode(28 + uuid.length)}free${uuid}${Date.now()}`;
  const commentBytes = new TextEncoder().encode(comment);

  const modified = new Uint8Array(original);
  const safeOffset = Math.min(modified.length - 1, 100 + Math.floor(Math.random() * 200));
  for (let i = 0; i < 8; i++) {
    const pos = safeOffset + i * 37;
    if (pos < modified.length) {
      modified[pos] = modified[pos] ^ (Math.floor(Math.random() * 3) + 1);
    }
  }

  return new Blob([modified, commentBytes, padding], { type: blob.type });
}

export function generateFileName(ext: string): string {
  const rand = Math.random().toString(36).substring(2, 10) + Date.now().toString(36);
  return `@redhotfilm18_${rand}.${ext}`;
}
