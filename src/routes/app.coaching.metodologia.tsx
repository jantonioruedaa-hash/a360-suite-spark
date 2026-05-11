import { createFileRoute, Link } from "@tanstack/react-router";
import { useState } from "react";
import {
  ETAPAS_A360,
  HERRAMIENTAS_A360,
  HERRAMIENTAS_POR_ETAPA,
  RADAR_DIMENSIONES,
  PLAN_CONTINUIDAD_FASES,
  PREGUNTAS_POR_DIMENSION,
  type HerramientaA360,
} from "@/lib/coaching-catalogo";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Accordion, AccordionItem, AccordionTrigger, AccordionContent } from "@/components/ui/accordion";
import {
  Compass, Target, Repeat, TrendingUp, BookOpen, MessageCircle,
  Lightbulb, CheckCircle2, FileOutput, Quote, ArrowRight,
} from "lucide-react";

export const Route = createFileRoute("/app/coaching/metodologia")({
  component: MetodologiaPage,
});

const ICON_ETAPA = {
  "Diagnóstico": Compass,
  "Activación": Target,
  "Sostenimiento": Repeat,
  "Transformación": TrendingUp,
} as const;

function MetodologiaPage() {
  const [selected, setSelected] = useState<HerramientaA360 | null>(null);

  return (
    <div className="max-w-6xl space-y-6">
      <div>
        <h1 className="font-display text-3xl text-navy">Metodología A360</h1>
        <p className="text-sm text-muted-foreground mt-1">
          4 etapas · 12 herramientas · 90 días post-programa.
          Una arquitectura completa de coaching ejecutivo basada en evidencia conductual.
        </p>
      </div>

      {/* Manifiesto de la metodología */}
      <Card className="bg-navy text-white border-navy">
        <CardContent className="p-6">
          <Quote className="w-6 h-6 text-gold mb-2" />
          <p className="font-display text-xl leading-relaxed">
            "El cambio profundo en un líder no se mide por lo que aprende,
            sino por lo que decide distinto bajo presión."
          </p>
          <p className="text-sm text-white/70 mt-2">— Principio rector A360</p>
        </CardContent>
      </Card>

      <Tabs defaultValue="etapas">
        <TabsList>
          <TabsTrigger value="etapas">Las 4 etapas</TabsTrigger>
          <TabsTrigger value="herramientas">12 herramientas</TabsTrigger>
          <TabsTrigger value="radar">Radar (6 dim.)</TabsTrigger>
          <TabsTrigger value="continuidad">Plan 90 días</TabsTrigger>
          <TabsTrigger value="preguntas">Preguntas poderosas</TabsTrigger>
        </TabsList>

        {/* ETAPAS */}
        <TabsContent value="etapas" className="space-y-4 mt-4">
          {ETAPAS_A360.map((et) => {
            const Icon = ICON_ETAPA[et.id];
            const herrs = HERRAMIENTAS_POR_ETAPA(et.id);
            return (
              <Card key={et.id} className="border-l-4" style={{ borderLeftColor: et.color }}>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2 text-base">
                    <Icon className="w-5 h-5" style={{ color: et.color }} />
                    <span style={{ color: et.color }}>Etapa {et.orden} · {et.titulo}</span>
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-3 text-sm">
                  <p className="italic text-muted-foreground">{et.descripcion}</p>

                  <div>
                    <div className="text-xs font-semibold text-navy uppercase tracking-wider mb-1">Propósito</div>
                    <p>{et.proposito}</p>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    <div className="bg-muted/30 rounded p-3">
                      <div className="text-xs font-semibold text-navy uppercase tracking-wider mb-1">Duración</div>
                      <p className="text-sm">{et.duracionTipica}</p>
                    </div>
                    <div className="bg-muted/30 rounded p-3">
                      <div className="text-xs font-semibold text-navy uppercase tracking-wider mb-1">Transformación esperada</div>
                      <p className="text-sm">{et.transformacionEsperada}</p>
                    </div>
                  </div>

                  <div>
                    <div className="text-xs font-semibold text-navy uppercase tracking-wider mb-1 flex items-center gap-1">
                      <FileOutput className="w-3 h-3" /> Entregables
                    </div>
                    <ul className="list-disc pl-5 space-y-0.5 text-sm">
                      {et.entregables.map((e, i) => <li key={i}>{e}</li>)}
                    </ul>
                  </div>

                  <div>
                    <div className="text-xs font-semibold text-navy uppercase tracking-wider mb-1">Herramientas ({herrs.length})</div>
                    <div className="flex flex-wrap gap-1">
                      {herrs.map((h) => (
                        <button
                          key={h.id}
                          onClick={() => setSelected(h)}
                          className="text-[11px] px-2 py-1 rounded-full bg-muted hover:bg-muted-foreground/10 border"
                        >
                          {h.nombre}
                        </button>
                      ))}
                    </div>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </TabsContent>

        {/* HERRAMIENTAS */}
        <TabsContent value="herramientas" className="mt-4">
          <Accordion type="single" collapsible className="space-y-2">
            {HERRAMIENTAS_A360.map((h) => (
              <AccordionItem key={h.id} value={h.id} className="border rounded-lg px-3">
                <AccordionTrigger className="hover:no-underline">
                  <div className="flex items-center gap-2 text-left">
                    <Badge variant="outline" className="text-[10px]">{h.etapa}</Badge>
                    <span className="font-medium">{h.nombre}</span>
                    <span className="text-xs text-muted-foreground">· {h.duracion}</span>
                  </div>
                </AccordionTrigger>
                <AccordionContent>
                  <FichaHerramienta h={h} />
                </AccordionContent>
              </AccordionItem>
            ))}
          </Accordion>
        </TabsContent>

        {/* RADAR */}
        <TabsContent value="radar" className="mt-4 space-y-3">
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Las 6 dimensiones del Radar del Líder</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground mb-4">
                Sistema de medición conductual aplicado al inicio y al cierre del programa.
                Cada dimensión es independiente y se calibra de 1 a 10.
              </p>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                {RADAR_DIMENSIONES.map((d) => (
                  <div key={d.id} className="border rounded-lg p-3">
                    <div className="font-semibold text-navy text-sm">{d.nombre}</div>
                    <div className="text-xs text-muted-foreground mt-0.5">{d.descripcion}</div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* PLAN CONTINUIDAD */}
        <TabsContent value="continuidad" className="mt-4">
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Plan de continuidad — 90 días post-programa</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground mb-4">
                El programa formal termina, pero la transformación real ocurre en estos 90 días.
                Cada fase tiene un foco distinto y un hito verificable con testigo externo.
              </p>
              <div className="space-y-2">
                {PLAN_CONTINUIDAD_FASES.map((f, i) => (
                  <div key={f.id} className="flex gap-3 p-3 border rounded-lg">
                    <div className="w-8 h-8 rounded-full bg-gold text-navy font-bold flex items-center justify-center shrink-0">
                      {i + 1}
                    </div>
                    <div>
                      <div className="text-[10px] uppercase tracking-wider text-muted-foreground">{f.label}</div>
                      <div className="font-semibold text-navy">{f.titulo}</div>
                      <div className="text-sm text-muted-foreground mt-1">{f.desc}</div>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* PREGUNTAS */}
        <TabsContent value="preguntas" className="mt-4 space-y-3">
          {RADAR_DIMENSIONES.map((d) => (
            <Card key={d.id}>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm flex items-center gap-2">
                  <MessageCircle className="w-4 h-4 text-gold" /> {d.nombre}
                </CardTitle>
              </CardHeader>
              <CardContent>
                <ul className="space-y-1.5">
                  {(PREGUNTAS_POR_DIMENSION[d.id] ?? []).map((p, i) => (
                    <li key={i} className="text-sm flex gap-2">
                      <span className="text-gold">›</span>
                      <span>{p}</span>
                    </li>
                  ))}
                </ul>
              </CardContent>
            </Card>
          ))}
        </TabsContent>
      </Tabs>

      {/* Drawer ficha herramienta cuando se hace click desde Etapas */}
      {selected && (
        <div
          className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4"
          onClick={() => setSelected(null)}
        >
          <div
            className="bg-background rounded-lg max-w-2xl w-full max-h-[90vh] overflow-y-auto p-6"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-start justify-between mb-3">
              <div>
                <Badge className="mb-1">{selected.etapa}</Badge>
                <h2 className="font-display text-xl text-navy">{selected.nombre}</h2>
              </div>
              <Button variant="ghost" size="sm" onClick={() => setSelected(null)}>✕</Button>
            </div>
            <FichaHerramienta h={selected} />
          </div>
        </div>
      )}

      <Card className="bg-muted/30 border-dashed">
        <CardContent className="p-4 flex items-center justify-between">
          <div>
            <div className="font-semibold text-sm">¿Listo para aplicar la metodología?</div>
            <p className="text-xs text-muted-foreground">Abre el workspace de un cliente y empieza por una herramienta de Diagnóstico.</p>
          </div>
          <Button asChild className="bg-navy hover:bg-navy/90">
            <Link to="/app/coaching">Ir al panel <ArrowRight className="w-3 h-3 ml-1" /></Link>
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}

function FichaHerramienta({ h }: { h: HerramientaA360 }) {
  return (
    <div className="space-y-3 text-sm">
      <p className="italic text-muted-foreground">{h.descripcion}</p>

      <Bloque icon={<Lightbulb className="w-3 h-3" />} titulo="Propósito">{h.proposito}</Bloque>
      <Bloque icon={<BookOpen className="w-3 h-3" />} titulo="Cuándo usar">{h.cuandoUsar}</Bloque>

      <div>
        <H titulo="Cómo aplicar" icon={<CheckCircle2 className="w-3 h-3" />} />
        <ol className="list-decimal pl-5 space-y-1">
          {h.comoAplicar.map((p, i) => <li key={i}>{p}</li>)}
        </ol>
      </div>

      <div>
        <H titulo="Preguntas guía" icon={<MessageCircle className="w-3 h-3" />} />
        <ul className="space-y-1">
          {h.preguntasGuia.map((p, i) => (
            <li key={i} className="flex gap-2"><span className="text-gold">›</span><span>{p}</span></li>
          ))}
        </ul>
      </div>

      <Bloque icon={<Quote className="w-3 h-3" />} titulo="Ejemplo real">{h.ejemploReal}</Bloque>
      <Bloque icon={<TrendingUp className="w-3 h-3" />} titulo="Resultado esperado">{h.resultadoEsperado}</Bloque>
      <Bloque icon={<FileOutput className="w-3 h-3" />} titulo="Entregable">{h.entregable}</Bloque>

      <div>
        <H titulo="Tips para el coach" icon={<Lightbulb className="w-3 h-3" />} />
        <ul className="space-y-1">
          {h.tipsCoach.map((t, i) => (
            <li key={i} className="flex gap-2"><span className="text-gold">•</span><span>{t}</span></li>
          ))}
        </ul>
      </div>
    </div>
  );
}

function H({ titulo, icon }: { titulo: string; icon: React.ReactNode }) {
  return (
    <div className="text-xs font-semibold text-navy uppercase tracking-wider mb-1 flex items-center gap-1">
      {icon} {titulo}
    </div>
  );
}

function Bloque({ icon, titulo, children }: { icon: React.ReactNode; titulo: string; children: React.ReactNode }) {
  return (
    <div>
      <H titulo={titulo} icon={icon} />
      <p>{children}</p>
    </div>
  );
}
