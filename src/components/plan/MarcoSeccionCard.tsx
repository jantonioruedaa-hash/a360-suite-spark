import { useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Link } from "@tanstack/react-router";
import { ChevronRight, Sparkles, Target, ListChecks, HelpCircle, Network, BarChart3, ArrowRight } from "lucide-react";
import { SECCIONES_PLAN, type SeccionPlan } from "@/lib/plan-helpers";
import { getMarco, type MarcoSeccion } from "@/lib/plan-marco";

interface Props {
  seccion: SeccionPlan;
  /** Si se pasa, el botón de acción navega al editor del cliente. */
  clienteId?: string;
  variant?: "card" | "inline";
}

/**
 * Tarjeta interactiva del marco metodológico de una sección del Plan Estratégico.
 * Click → diálogo con propósito, metodología, preguntas clave, KPIs y conexiones.
 */
export function MarcoSeccionCard({ seccion, clienteId, variant = "card" }: Props) {
  const [open, setOpen] = useState(false);
  const marco = getMarco(seccion.key);
  const Icon = seccion.icon;

  const trigger =
    variant === "card" ? (
      <button
        type="button"
        className="w-full text-left flex items-center gap-2 p-2 rounded border border-[#C7D2FE] bg-muted/20 hover:bg-[#EEF2FF] hover:border-[#A5B4FC] transition group"
      >
        <Icon className="w-3.5 h-3.5 text-[#4338CA] shrink-0" />
        <span className="text-[10px] font-mono text-muted-foreground">
          {String(seccion.numero).padStart(2, "0")}
        </span>
        <span className="truncate flex-1 text-xs">{seccion.titulo}</span>
        <ChevronRight className="w-3.5 h-3.5 text-muted-foreground group-hover:text-[#4338CA]" />
      </button>
    ) : (
      <button
        type="button"
        className="text-xs text-[#4338CA] underline-offset-2 hover:underline inline-flex items-center gap-1"
      >
        <Sparkles className="w-3 h-3" />
        Ver marco metodológico
      </button>
    );

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>{trigger}</DialogTrigger>
      <DialogContent className="max-w-3xl max-h-[85vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Icon className="w-5 h-5 text-[#4338CA]" />
            <span className="font-mono text-xs text-muted-foreground">
              Sec {String(seccion.numero).padStart(2, "0")}
            </span>
            <span>{seccion.titulo}</span>
          </DialogTitle>
        </DialogHeader>

        {!marco ? (
          <p className="text-sm text-muted-foreground">Marco metodológico en preparación.</p>
        ) : (
          <div className="space-y-4 text-sm">
            <Block icon={Target} title="Propósito">
              <p>{marco.proposito}</p>
            </Block>
            <Block icon={Sparkles} title="Enfoque">
              <p className="text-muted-foreground">{marco.enfoque}</p>
            </Block>
            <Block icon={ListChecks} title="Metodología">
              <ul className="list-disc pl-5 space-y-1">
                {marco.metodologia.map((m, i) => <li key={i}>{m}</li>)}
              </ul>
            </Block>
            <Block icon={ListChecks} title="Entregables">
              <ul className="list-disc pl-5 space-y-1">
                {marco.entregables.map((m, i) => <li key={i}>{m}</li>)}
              </ul>
            </Block>
            <Block icon={HelpCircle} title="Preguntas detonadoras">
              <ul className="space-y-1">
                {marco.preguntasClave.map((m, i) => (
                  <li key={i} className="border-l-2 border-[#C7D2FE] pl-3 italic text-muted-foreground">{m}</li>
                ))}
              </ul>
            </Block>
            <Block icon={BarChart3} title="KPIs sugeridos">
              <div className="flex flex-wrap gap-1.5">
                {marco.kpis.map((k, i) => (
                  <Badge key={i} variant="outline" className="border-[#C7D2FE] text-[#4338CA]">{k}</Badge>
                ))}
              </div>
            </Block>
            <Block icon={Network} title="Se conecta con">
              <div className="flex flex-wrap gap-1.5">
                {marco.conectaCon.map((k) => {
                  const sx = SECCIONES_PLAN.find((s) => s.key === k);
                  if (!sx) return null;
                  return (
                    <Badge key={k} variant="secondary" className="text-[10px] bg-[#EEF2FF] text-[#4338CA] border border-[#C7D2FE]">
                      {String(sx.numero).padStart(2, "0")} · {sx.corto}
                    </Badge>
                  );
                })}
              </div>
            </Block>
            <div className="rounded-md border border-[#C7D2FE] bg-[#EEF2FF] p-3">
              <div className="text-[10px] uppercase tracking-wider text-[#4338CA] font-semibold mb-1">
                Resultado de transformación
              </div>
              <p className="text-sm">{marco.transformacion}</p>
            </div>

            {clienteId && (
              <div className="flex justify-end pt-2 border-t">
                <Button asChild size="sm" style={{ background: "linear-gradient(135deg, #4338CA, #818CF8)", border: "none" }}>
                  <Link
                    to="/app/clientes/$clienteId/plan"
                    params={{ clienteId }}
                    search={{ s: seccion.key }}
                    onClick={() => setOpen(false)}
                  >
                    Trabajar esta sección <ArrowRight className="w-3.5 h-3.5 ml-1" />
                  </Link>
                </Button>
              </div>
            )}
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}

function Block({ icon: Icon, title, children }: { icon: typeof Target; title: string; children: React.ReactNode }) {
  return (
    <div>
      <div className="flex items-center gap-1.5 mb-1.5">
        <Icon className="w-3.5 h-3.5 text-[#4338CA]" />
        <h4 className="text-xs font-semibold uppercase tracking-wider text-[#4338CA]">{title}</h4>
      </div>
      <div className="pl-5">{children}</div>
    </div>
  );
}

/** Banner compacto del marco metodológico para mostrar arriba del editor. */
export function MarcoSeccionBanner({ seccion, clienteId }: { seccion: SeccionPlan; clienteId: string }) {
  const marco = getMarco(seccion.key);
  if (!marco) return null;
  return (
    <Card className="border-[#C7D2FE] bg-[#EEF2FF]">
      <CardContent className="p-4 space-y-2">
        <div className="flex items-start justify-between gap-3 flex-wrap">
          <div className="flex-1 min-w-0">
            <div className="text-[10px] uppercase tracking-wider text-[#4338CA] font-semibold mb-1">
              Marco metodológico
            </div>
            <p className="text-sm text-foreground/90">{marco.proposito}</p>
            <p className="text-xs text-muted-foreground mt-1 italic">{marco.enfoque}</p>
          </div>
          <MarcoSeccionCard seccion={seccion} clienteId={clienteId} variant="inline" />
        </div>
        <div className="flex flex-wrap gap-1 pt-1">
          <span className="text-[10px] text-muted-foreground mr-1">Conecta con:</span>
          {marco.conectaCon.map((k) => {
            const sx = SECCIONES_PLAN.find((s) => s.key === k);
            if (!sx) return null;
            return (
              <Link
                key={k}
                to="/app/clientes/$clienteId/plan"
                params={{ clienteId }}
                search={{ s: sx.key }}
                className="text-[10px] px-1.5 py-0.5 rounded bg-[#EEF2FF] text-[#4338CA] border border-[#C7D2FE] hover:bg-[#4338CA] hover:text-white transition"
              >
                {String(sx.numero).padStart(2, "0")} · {sx.corto}
              </Link>
            );
          })}
        </div>
      </CardContent>
    </Card>
  );
}
