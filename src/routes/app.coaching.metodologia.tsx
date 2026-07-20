import { createFileRoute, Link } from "@tanstack/react-router";
import { ArrowRight, Compass, MessageCircle, Sparkles, ClipboardList, Quote } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";

export const Route = createFileRoute("/app/coaching/metodologia")({
  component: MetodologiaPage,
});

const PASOS = [
  {
    num: "01",
    icon: Compass,
    titulo: "Enfoque del tema",
    desc: "Identifica el área de desarrollo prioritaria del líder: claridad estratégica, gestión del equipo, toma de decisiones o presencia ejecutiva. Usa el Radar del Líder para anclar el punto de partida.",
    color: "#7F77DD",
  },
  {
    num: "02",
    icon: MessageCircle,
    titulo: "Diálogo profundo",
    desc: "Sesiones estructuradas con preguntas de alta palanca. El coach no da respuestas — activa reflexión. El objetivo es que el líder descubra sus propios patrones y los nombre con precisión.",
    color: "#1D9E75",
  },
  {
    num: "03",
    icon: Sparkles,
    titulo: "Análisis con IA",
    desc: "Cada sesión alimenta un análisis contextual que detecta creencias limitantes recurrentes, puntos de quiebre y fortalezas ocultas. El coach recibe síntesis accionables por dimensión.",
    color: "#BA7517",
  },
  {
    num: "04",
    icon: ClipboardList,
    titulo: "Plan de acción",
    desc: "Al cierre de cada etapa, el líder define 1–3 compromisos concretos con hitos verificables. El plan de 90 días post-programa asegura que los cambios se consoliden en la práctica real.",
    color: "#D85A30",
  },
];

function MetodologiaPage() {
  return (
    <div className="max-w-3xl space-y-8">
      <div>
        <h1 className="font-display text-3xl text-navy">Metodología A360</h1>
        <p className="text-sm text-muted-foreground mt-1">
          4 etapas · 12 herramientas · 90 días post-programa.
        </p>
      </div>

      {/* Manifiesto */}
      <Card style={{ background: "linear-gradient(135deg, #0C4A6E, #1E3A8A)", border: "none" }}>
        <CardContent className="p-6 text-white">
          <Quote className="w-5 h-5 mb-3" style={{ color: "#F59E0B" }} />
          <p className="font-display text-xl leading-relaxed">
            "El cambio profundo en un líder no se mide por lo que aprende,
            sino por lo que decide distinto bajo presión."
          </p>
          <p className="text-sm mt-2" style={{ color: "rgba(255,255,255,0.6)" }}>
            — Principio rector A360
          </p>
        </CardContent>
      </Card>

      {/* 4 pasos */}
      <div className="space-y-4">
        {PASOS.map((p) => {
          const Icon = p.icon;
          return (
            <div key={p.num} className="flex gap-4 items-start">
              <div
                className="shrink-0 w-12 h-12 rounded-xl flex items-center justify-center font-bold text-sm"
                style={{ background: p.color + "20", color: p.color, border: `1.5px solid ${p.color}40` }}
              >
                {p.num}
              </div>
              <div className="pt-0.5">
                <div className="flex items-center gap-2 mb-1">
                  <Icon className="w-4 h-4" style={{ color: p.color }} />
                  <span className="font-semibold text-navy">{p.titulo}</span>
                </div>
                <p className="text-sm text-muted-foreground leading-relaxed">{p.desc}</p>
              </div>
            </div>
          );
        })}
      </div>

      {/* CTA */}
      <Card className="border-dashed bg-muted/30">
        <CardContent className="p-4 flex items-center justify-between">
          <div>
            <div className="font-semibold text-sm">Aplica la metodología con tus clientes</div>
            <p className="text-xs text-muted-foreground mt-0.5">
              Selecciona un cliente y empieza desde el Radar del Líder.
            </p>
          </div>
          <Button asChild style={{ background: "#0C4A6E" }} className="text-white hover:opacity-90">
            <Link to="/app/coaching">
              Ir a mis clientes <ArrowRight className="w-3 h-3 ml-1" />
            </Link>
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}
