import { Download, Music, Zap, Shield, Smartphone, Globe } from "lucide-react";

const features = [
  { icon: Download, title: "Sem Marca d'Água", desc: "Baixe vídeos limpos de qualquer plataforma", color: "text-primary" },
  { icon: Zap, title: "Download HD", desc: "Qualidade máxima disponível do vídeo", color: "text-accent" },
  { icon: Music, title: "Converter MP3", desc: "Extraia o áudio de qualquer vídeo", color: "text-primary" },
  { icon: Shield, title: "100% Seguro", desc: "Sem login, sem dados coletados", color: "text-accent" },
  { icon: Smartphone, title: "Mobile Friendly", desc: "Funciona em qualquer dispositivo", color: "text-primary" },
  { icon: Globe, title: "Multi-Plataforma", desc: "TikTok, YouTube, Instagram e Pinterest", color: "text-accent" },
];

export function FeatureCards() {
  return (
    <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
      {features.map((f) => (
        <div key={f.title}
          className="flex flex-col items-center text-center p-4 rounded-xl bg-card/50 border border-border/30 hover:border-border/60 transition-colors">
          <f.icon className={`w-6 h-6 ${f.color} mb-2`} />
          <h3 className="text-xs font-display font-semibold mb-1">{f.title}</h3>
          <p className="text-[11px] text-muted-foreground leading-tight">{f.desc}</p>
        </div>
      ))}
    </div>
  );
}
