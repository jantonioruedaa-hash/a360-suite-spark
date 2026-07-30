import { createFileRoute, useParams, useSearch, Link } from "@tanstack/react-router";
import { useEffect, useState, useMemo } from "react";
import { z } from "zod";
import { SECCIONES_PLAN, seccionesParaNivel, seccionPorKey, type NivelPlan, type SeccionData } from "@/lib/plan-helpers";
import { cargarPlan } from "@/lib/plan-service";
import type { ClienteCtx, PlanRow } from "@/types/plan";
import { detectSector, detectTamano } from "@/lib/plan-catalogo";
import { AnalisisIABox } from "@/components/plan/AnalisisIABox";
import { MarcoSeccionBanner } from "@/components/plan/MarcoSeccionCard";
import { usePlanSeccionAutosave, AutosaveBadge } from "@/components/plan/usePlanAutosave";
import { Sec01, Sec02, Sec03, Sec04, Sec05, type Sec01Data, type Sec02Data, type Sec03Data, type Sec04Data, type Sec05Data } from "@/components/plan/secciones-1-5";
import { Sec06, Sec07, Sec08, Sec09, type Sec06Data, type Sec07Data, type Sec08Data, type Sec09Data } from "@/components/plan/secciones-6-9";
import { Sec10, Sec11, Sec12, Sec13, type Sec10Data, type Sec11Data, type Sec12Data, type Sec13Data } from "@/components/plan/secciones-10-13";
import { Sec14, Sec15, Sec16, Sec17, Sec18, type Sec14Data, type Sec15Data, type Sec16Data, type Sec17Data, type Sec18Data } from "@/components/plan/secciones-14-18";
import { Lock, ChevronLeft, ChevronRight } from "lucide-react";
import { Badge } from "@/components/ui/badge";

const searchSchema = z.object({ s: z.string().optional() });

export const Route = createFileRoute("/app/clientes/$clienteId/plan")({
  component: PlanPage,
  validateSearch: searchSchema,
});

const NIVEL_MAP: Record<string, NivelPlan> = {
  esencial:    "esencial",
  avanzado:    "avanzado",
  corporativo: "corporativo",
  profesional: "avanzado",    // parche temporal — ver backlog consolidación nomenclatura
  enterprise:  "corporativo",
  premium:     "corporativo",
};
const normalizarNivel = (raw: string | null | undefined): NivelPlan =>
  NIVEL_MAP[raw?.toLowerCase() ?? ""] ?? "esencial";

function PlanPage() {
  const { clienteId } = useParams({ from: "/app/clientes/$clienteId/plan" });
  const { s: seccionKeyParam } = useSearch({ from: "/app/clientes/$clienteId/plan" });
  const [cliente, setCliente] = useState<ClienteCtx | null>(null);
  const [plan, setPlan] = useState<PlanRow | null>(null);
  const [loading, setLoading] = useState(true);

  const seccionKey = seccionKeyParam ?? "01";
  const seccion = seccionPorKey(seccionKey) ?? SECCIONES_PLAN[0];
  const nivel: NivelPlan = normalizarNivel(cliente?.plan_licencia);
  const seccionesVisibles = useMemo(() => seccionesParaNivel(nivel), [nivel]);
  const sectorKey = detectSector(cliente?.sector);
  const tamano = detectTamano(cliente?.num_empleados);

  useEffect(() => {
    cargarPlan(clienteId).then(({ cliente, plan }) => {
      setCliente(cliente);
      setPlan(plan);
      setLoading(false);
    });
  }, [clienteId]);

  if (loading || !cliente) return <div className="text-muted-foreground">Cargando plan estratégico…</div>;

  const seccionData = (plan?.[seccion.columna] as SeccionData | null) ?? { data: {}, analisis_ia: null };
  const datos = (seccionData.data ?? {}) as Record<string, unknown>;
  const accesoOk = seccion.niveles.includes(nivel);

  // Índice navegación
  const idx = seccionesVisibles.findIndex((s) => s.key === seccion.key);
  const prev = idx > 0 ? seccionesVisibles[idx - 1] : null;
  const next = idx < seccionesVisibles.length - 1 ? seccionesVisibles[idx + 1] : null;

  return (
    <div className="space-y-4 max-w-7xl">
      {/* Header */}
      <div className="flex items-start justify-between flex-wrap gap-3">
        <div>
          <h1 className="font-display text-3xl text-navy">Plan Estratégico</h1>
          <p className="text-sm text-muted-foreground">{cliente.nombre_empresa} — Licencia: <Badge variant="outline" className="capitalize">{nivel}</Badge> · Sector detectado: {sectorKey} · Tamaño: {tamano}</p>
        </div>
      </div>

      {/* Barra horizontal de 18 pestañas */}
      <div className="bg-white border border-border rounded-md overflow-x-auto">
        <nav className="flex min-w-max">
          {SECCIONES_PLAN.map((s) => {
            const enabled = s.niveles.includes(nivel);
            const active = s.key === seccion.key;
            const Icon = s.icon;
            return (
              <Link key={s.key}
                to="/app/clientes/$clienteId/plan"
                params={{ clienteId }}
                search={{ s: s.key }}
                disabled={!enabled}
                className={`flex items-center gap-1.5 px-3 py-2.5 text-xs whitespace-nowrap border-b-2 transition ${
                  active ? "border-gold text-navy font-semibold bg-gold/5" :
                  enabled ? "border-transparent text-muted-foreground hover:text-navy hover:bg-muted/30" :
                            "border-transparent text-muted-foreground/40 cursor-not-allowed"
                }`}
                onClick={(e) => { if (!enabled) e.preventDefault(); }}>
                <span className="font-mono text-[10px] opacity-60">{String(s.numero).padStart(2, "0")}</span>
                <Icon className="w-3.5 h-3.5" />
                <span>{s.corto}</span>
                {!enabled && <Lock className="w-3 h-3 ml-0.5" />}
              </Link>
            );
          })}
        </nav>
      </div>

      {!accesoOk ? (
        <div className="a360-card a360-card-lg p-12 text-center">
          <Lock className="w-10 h-10 text-muted-foreground mx-auto mb-3" />
          <h3 className="font-display text-xl text-navy mb-1">Sección no disponible en tu licencia</h3>
          <p className="text-sm text-muted-foreground">"{seccion.titulo}" requiere licencia <span className="font-semibold capitalize">{seccion.niveles.join(" / ")}</span>. Tu cliente tiene licencia <span className="font-semibold capitalize">{nivel}</span>.</p>
        </div>
      ) : (
        <SeccionEditor
          clienteId={clienteId}
          cliente={cliente}
          sectorKey={sectorKey}
          seccion={seccion}
          datos={datos}
          analisis={seccionData.analisis_ia ?? null}
          analisisFecha={seccionData.analisis_ia_fecha ?? null}
        />
      )}

      {/* Navegación */}
      <div className="flex justify-between pt-4 border-t border-border">
        {prev ? (
          <Link to="/app/clientes/$clienteId/plan" params={{ clienteId }} search={{ s: prev.key }}
                className="text-sm text-navy hover:text-gold flex items-center gap-1">
            <ChevronLeft className="w-4 h-4" /> {String(prev.numero).padStart(2, "0")} · {prev.corto}
          </Link>
        ) : <span />}
        {next ? (
          <Link to="/app/clientes/$clienteId/plan" params={{ clienteId }} search={{ s: next.key }}
                className="text-sm text-navy hover:text-gold flex items-center gap-1">
            {String(next.numero).padStart(2, "0")} · {next.corto} <ChevronRight className="w-4 h-4" />
          </Link>
        ) : <span />}
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────
// Editor de sección — wrapper con autosave + IA
// ─────────────────────────────────────────────────────────
function SeccionEditor({ clienteId, cliente, sectorKey, seccion, datos, analisis, analisisFecha }: {
  clienteId: string;
  cliente: ClienteCtx;
  sectorKey: ReturnType<typeof detectSector>;
  seccion: typeof SECCIONES_PLAN[number];
  datos: Record<string, unknown>;
  analisis: string | null;
  analisisFecha: string | null;
}) {
  const [data, setData] = useState<Record<string, unknown>>(datos);
  const [iaTexto, setIaTexto] = useState<string | null>(analisis);
  const [iaFecha, setIaFecha] = useState<string | null>(analisisFecha);

  const { estado, ultimoGuardado } = usePlanSeccionAutosave({
    clienteId, columna: seccion.columna, data, analisis_ia: iaTexto, analisis_ia_fecha: iaFecha,
  });

  const contexto = `Empresa: ${cliente.nombre_empresa} | Sector: ${cliente.sector || "—"} | País: ${cliente.pais || "—"} | Empleados: ${cliente.num_empleados || "—"} | Licencia: ${cliente.plan_licencia}`;

  const renderSeccion = () => {
    switch (seccion.numero) {
      case 1: return <Sec01 data={data as Sec01Data} onChange={(d) => setData(d as Record<string, unknown>)} sector={sectorKey} />;
      case 2: return <Sec02 data={data as Sec02Data} onChange={(d) => setData(d as Record<string, unknown>)} sector={sectorKey} />;
      case 3: return <Sec03 data={data as Sec03Data} onChange={(d) => setData(d as Record<string, unknown>)} sector={sectorKey} />;
      case 4: return <Sec04 data={data as Sec04Data} onChange={(d) => setData(d as Record<string, unknown>)} sector={sectorKey} />;
      case 5: return <Sec05 data={data as Sec05Data} onChange={(d) => setData(d as Record<string, unknown>)} />;
      case 6: return <Sec06 data={data as Sec06Data} onChange={(d) => setData(d as Record<string, unknown>)} sector={sectorKey} />;
      case 7: return <Sec07 data={data as Sec07Data} onChange={(d) => setData(d as Record<string, unknown>)} />;
      case 8: return <Sec08 data={data as unknown as Sec08Data} onChange={(d) => setData(d as unknown as Record<string, unknown>)} />;
      case 9: return <Sec09 data={data as Sec09Data} onChange={(d) => setData(d as Record<string, unknown>)} />;
      case 10: return <Sec10 data={data as Sec10Data} onChange={(d) => setData(d as Record<string, unknown>)} sector={sectorKey} />;
      case 11: return <Sec11 data={data as Sec11Data} onChange={(d) => setData(d as Record<string, unknown>)} sector={sectorKey} />;
      case 12: return <Sec12 data={data as Sec12Data} onChange={(d) => setData(d as Record<string, unknown>)} sector={sectorKey} />;
      case 13: return <Sec13 data={data as Sec13Data} onChange={(d) => setData(d as Record<string, unknown>)} sector={sectorKey} />;
      case 14: return <Sec14 data={data as Sec14Data} onChange={(d) => setData(d as Record<string, unknown>)} sector={sectorKey} />;
      case 15: return <Sec15 data={data as Sec15Data} onChange={(d) => setData(d as Record<string, unknown>)} sector={sectorKey} />;
      case 16: return <Sec16 data={data as Sec16Data} onChange={(d) => setData(d as Record<string, unknown>)} sector={sectorKey} />;
      case 17: return <Sec17 data={data as Sec17Data} onChange={(d) => setData(d as Record<string, unknown>)} sector={sectorKey} />;
      case 18: return <Sec18 data={data as Sec18Data} onChange={(d) => setData(d as Record<string, unknown>)} sector={sectorKey} />;
      default:
        return (
          <div className="a360-card a360-card-lg p-12 text-center text-muted-foreground">
            <p className="text-sm">Esta sección estará disponible próximamente.</p>
          </div>
        );
    }
  };

  return (
    <div>
      <div className="flex items-center justify-between mb-4 flex-wrap gap-2">
        <h2 className="font-display text-2xl text-navy">
          <span className="text-gold mr-2">{String(seccion.numero).padStart(2, "0")}.</span>
          {seccion.titulo}
        </h2>
        <AutosaveBadge estado={estado} ultimoGuardado={ultimoGuardado} />
      </div>
      <div className="mb-4">
        <MarcoSeccionBanner seccion={seccion} clienteId={clienteId} />
      </div>
      {renderSeccion()}
      {seccion.numero <= 18 && (
        <AnalisisIABox
          clienteId={clienteId}
          columna={seccion.columna}
          seccionTitulo={seccion.titulo}
          contextoEmpresa={contexto}
          datosSeccion={data}
          analisisActual={iaTexto}
          analisisFecha={iaFecha}
          onAnalisisGenerado={(t, f) => { setIaTexto(t); setIaFecha(f); }}
        />
      )}
    </div>
  );
}
