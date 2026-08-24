import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { createServerFn } from "@tanstack/react-start";
import { useCallback, useEffect, useRef, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/lib/auth-context";
import { ArrowLeft, Check, Save, Users, BarChart3, Target, Rocket, BookOpen, Lock, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { EvalDesempPanel } from "@/components/manual-funciones/EvalDesempPanel";
import type { Cargo } from "@/types/manual-funciones";
import { ManualFuncionesLanding } from "@/components/manual-funciones/ManualFuncionesLanding";
import { AreaCargosView } from "@/components/manual-funciones/AreaCargosView";
import { CargoFichaOverlay } from "@/components/manual-funciones/CargoFichaOverlay";

const ensurePlantillaClonada = createServerFn({ method: "POST" })
  .inputValidator((data: { clienteId: string }) => data)
  .handler(async ({ data }) => {
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { error } = await supabaseAdmin.rpc("clonar_plantilla_manual_funciones", {
      p_cliente_id: data.clienteId,
    });
    if (error) console.error("[ensurePlantillaClonada]", error.message);
    // No lanzamos excepción: la función es idempotente y un fallo no debe
    // bloquear al usuario (abrirá el módulo con los cargos que ya tenga).
  });

export const Route = createFileRoute("/app/manual-funciones/$clienteId")({
  validateSearch: (search: Record<string, unknown>): {
    v?: string; area?: string; areaName?: string; colorIdx?: number; cargo?: string;
  } => ({
    v:        typeof search.v        === "string" ? search.v        : undefined,
    area:     typeof search.area     === "string" ? search.area     : undefined,
    areaName: typeof search.areaName === "string" ? search.areaName : undefined,
    colorIdx: typeof search.colorIdx === "string" ? Number(search.colorIdx) :
              typeof search.colorIdx === "number" ? search.colorIdx : undefined,
    cargo:    typeof search.cargo    === "string" ? search.cargo    : undefined,
  }),
  loader: async ({ params }) => {
    await ensurePlantillaClonada({ data: { clienteId: params.clienteId } });
  },
  component: ManualFuncionesViewer,
});

// ── Types ──────────────────────────────────────────────────────────────────────

type HtmlCargo = Record<string, unknown>;

type SupabaseCargo = {
  id: string;
  cliente_id: string;
  cargo: string;
  area: string;
  jefe_inmediato?: string | null;
  vacante?: boolean;
  estado?: string | null;
  version?: string | null;
  codigo?: string | null;
  objetivo?: string | null;
  elaborado_por?: string | null;
  aprobado_por?: string | null;
  fecha_elaboracion?: string | null;
  fecha_revision?: string | null;
  supervisa_a?: string[];
  relaciones_internas?: string[];
  relaciones_externas?: string[];
  requisitos?: Record<string, string>;
  condiciones?: Record<string, string>;
  plan_carrera?: string | null;
  funciones?: Array<{ descripcion: string; porcentaje_tiempo: number }>;
  competencias_blandas?: Array<{ nombre: string; nivel: string; desc?: string }>;
  competencias_tecnicas?: Array<{ nombre: string; nivel: string; desc?: string }>;
  kpis?: Array<{ nombre: string; meta: string; frecuencia: string; formula?: string }>;
};

// ── Format helpers ─────────────────────────────────────────────────────────────

function isoToMmYyyy(iso: string | null | undefined): string {
  if (!iso) return "";
  const [y, m] = iso.split("-");
  return m && y ? `${m}/${y}` : "";
}

function mmYyyyToIso(s: string | null | undefined): string | null {
  if (!s) return null;
  const [m, y] = s.split("/");
  if (!m || !y) return null;
  return `${y}-${m.padStart(2, "0")}-01`;
}

function supabaseToHtml(row: SupabaseCargo, clienteNombre: string): HtmlCargo {
  return {
    id:                  row.id,
    cargo:               row.cargo,
    area:                row.area,
    jefe:                row.jefe_inmediato ?? "",
    vacante:             row.vacante ?? false,
    estado:              row.estado ?? "vigente",
    version:             row.version ?? "1.0",
    codigo:              row.codigo ?? "",
    objetivo:            row.objetivo ?? "",
    elaborado:           row.elaborado_por ?? "",
    aprobado:            row.aprobado_por ?? "",
    fecha_elaboracion:   isoToMmYyyy(row.fecha_elaboracion),
    fecha_revision:      isoToMmYyyy(row.fecha_revision),
    supervisa_a:         row.supervisa_a ?? [],
    relaciones_internas: row.relaciones_internas ?? [],
    relaciones_externas: row.relaciones_externas ?? [],
    requisitos:          row.requisitos ?? {},
    condiciones:         row.condiciones ?? {},
    plan_carrera:        row.plan_carrera ?? "",
    funciones:           (row.funciones ?? []).map(f => f.descripcion),
    competencias_blandas:  row.competencias_blandas ?? [],
    competencias_tecnicas: row.competencias_tecnicas ?? [],
    kpis: (row.kpis ?? []).map(k => ({
      nombre:  k.nombre,
      meta:    k.meta,
      freq:    k.frecuencia,
      formula: k.formula ?? "",
    })),
    nombre_empresa: clienteNombre,
  };
}

type ContentFields = Omit<SupabaseCargo, "id" | "cliente_id">;

function htmlToContent(c: HtmlCargo): ContentFields {
  return {
    cargo:               (c.cargo as string) ?? "",
    area:                (c.area as string) ?? "",
    jefe_inmediato:      (c.jefe as string) || null,
    vacante:             (c.vacante as boolean) ?? false,
    estado:              (c.estado as string) ?? "vigente",
    version:             (c.version as string) ?? "1.0",
    codigo:              (c.codigo as string) || null,
    objetivo:            (c.objetivo as string) || null,
    elaborado_por:       (c.elaborado as string) || null,
    aprobado_por:        (c.aprobado as string) || null,
    fecha_elaboracion:   mmYyyyToIso(c.fecha_elaboracion as string),
    fecha_revision:      mmYyyyToIso(c.fecha_revision as string),
    supervisa_a:         (c.supervisa_a as string[]) ?? [],
    relaciones_internas: (c.relaciones_internas as string[]) ?? [],
    relaciones_externas: (c.relaciones_externas as string[]) ?? [],
    requisitos:          (c.requisitos as Record<string, string>) ?? {},
    condiciones:         (c.condiciones as Record<string, string>) ?? {},
    plan_carrera:        (c.plan_carrera as string) || null,
    funciones: ((c.funciones as unknown[]) ?? []).map(f =>
      typeof f === "string"
        ? { descripcion: f, porcentaje_tiempo: 0 }
        : (f as { descripcion: string; porcentaje_tiempo: number }),
    ),
    competencias_blandas:  (c.competencias_blandas as SupabaseCargo["competencias_blandas"]) ?? [],
    competencias_tecnicas: (c.competencias_tecnicas as SupabaseCargo["competencias_tecnicas"]) ?? [],
    kpis: ((c.kpis as Array<Record<string, string>>) ?? []).map(k => ({
      nombre:     k.nombre    ?? "",
      meta:       k.meta      ?? "",
      frecuencia: k.freq      ?? "",
      formula:    k.formula   ?? "",
    })),
  };
}

// ── DELETE safeguard constants ─────────────────────────────────────────────────

const SAFE_DELETE_THRESHOLD  = 0.5;
const MIN_SET_SIZE_FOR_GUARD = 3;

// ── Module not included gate ──────────────────────────────────────────────────

function ModuloNoIncluido() {
  return (
    <div style={{ padding: "80px 32px", display: "flex", flexDirection: "column", alignItems: "center", textAlign: "center" }}>
      <div style={{ display: "inline-flex", alignItems: "center", justifyContent: "center", width: "64px", height: "64px", borderRadius: "50%", background: "linear-gradient(135deg, #EFF6FF, #EDE9FE)", border: "1.5px solid #C7D2FE", marginBottom: "24px" }}>
        <Lock style={{ width: "28px", height: "28px", color: "#6366F1" }} />
      </div>
      <h2 style={{ fontSize: "22px", fontWeight: 900, color: "#0C4A6E", letterSpacing: "-0.01em", marginBottom: "12px" }}>
        Módulo no incluido en tu plan
      </h2>
      <p style={{ fontSize: "15px", color: "#64748B", lineHeight: 1.75, maxWidth: "460px", margin: 0 }}>
        El módulo de Manual de Funciones no está incluido en tu plan actual. Contacta a tu consultor A360 para más información.
      </p>
    </div>
  );
}

// ── Client-facing hero landing ────────────────────────────────────────────────

const OUTCOMES = [
  { icon: Users,    title: "Claridad organizacional", desc: "Cada persona sabe exactamente qué hace, a quién reporta y con quién se relaciona." },
  { icon: BarChart3, title: "KPIs definidos por cargo", desc: "Metas concretas y medibles para cada posición. Evaluaciones objetivas y justas." },
  { icon: Target,   title: "Evaluaciones objetivas",  desc: "El desempeño se mide con estándares claros, no con percepciones subjetivas del jefe." },
  { icon: Rocket,   title: "Rutas de carrera",        desc: "Cada colaborador visualiza su próximo paso y trabaja hacia él con propósito claro." },
];

function ClienteManualHero({ clienteId, onAbrir }: { clienteId: string; onAbrir: () => void }) {
  const [nombre, setNombre]   = useState("");
  const [total, setTotal]     = useState(0);
  const [vigentes, setVigentes] = useState(0);
  const [areas, setAreas]     = useState(0);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    Promise.all([
      supabase.from("clientes").select("nombre_empresa").eq("id", clienteId).single(),
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      (supabase as any).from("manual_funciones_cargos").select("estado,area").eq("cliente_id", clienteId),
    ]).then(([{ data: cl }, { data: cargos }]) => {
      setNombre(cl?.nombre_empresa ?? "");
      const rows = (cargos ?? []) as { estado: string | null; area: string | null }[];
      setTotal(rows.length);
      setVigentes(rows.filter((r) => r.estado === "vigente").length);
      setAreas(new Set(rows.map((r) => r.area).filter(Boolean)).size);
    });
    const t = setTimeout(() => setMounted(true), 80);
    return () => clearTimeout(t);
  }, [clienteId]);

  return (
    <div style={{ maxWidth: "860px", display: "flex", flexDirection: "column", gap: "12px" }}>

      {/* Hero */}
      <div style={{
        background: "linear-gradient(135deg, #0C4A6E 0%, #1E3A8A 55%, #312E81 100%)",
        borderRadius: "20px", padding: "24px 36px 20px", position: "relative", overflow: "hidden",
      }}>
        <div style={{ position: "absolute", inset: 0, background: "radial-gradient(ellipse 50% 70% at 90% 10%, rgba(14,165,233,0.18), transparent)", pointerEvents: "none" }} />
        <div style={{ position: "absolute", inset: 0, background: "radial-gradient(ellipse 40% 60% at 10% 90%, rgba(99,102,241,0.12), transparent)", pointerEvents: "none" }} />

        <div style={{ position: "relative", zIndex: 1, display: "grid", gridTemplateColumns: "1fr 1fr", gap: "44px", alignItems: "center" }}>
          <div style={{ opacity: mounted ? 1 : 0, transform: mounted ? "translateY(0)" : "translateY(16px)", transition: "opacity 0.6s ease, transform 0.6s ease" }}>
            <div style={{ fontSize: "11px", fontWeight: 700, color: "#38BDF8", textTransform: "uppercase", letterSpacing: "0.14em", marginBottom: "6px" }}>
              Módulo Organizacional · A360 Suite
            </div>
            <h1 style={{ fontSize: "clamp(22px, 2.6vw, 30px)", fontWeight: 900, color: "white", margin: "0 0 6px", letterSpacing: "-0.03em", lineHeight: 1.1 }}>
              Manual de<br />Funciones
            </h1>
            {nombre && (
              <div style={{ fontSize: "13px", color: "rgba(255,255,255,0.5)", marginBottom: "8px" }}>{nombre}</div>
            )}
            <div style={{ display: "flex", gap: "8px", flexWrap: "nowrap", marginBottom: "12px" }}>
              {[
                { val: total,    lbl: "Cargos" },
                { val: vigentes, lbl: "Vigentes" },
                { val: areas,    lbl: "Áreas" },
              ].map((s) => (
                <div key={s.lbl} style={{ background: "rgba(255,255,255,0.09)", border: "1px solid rgba(255,255,255,0.14)", borderRadius: "10px", padding: "6px 12px" }}>
                  <div style={{ fontSize: "18px", fontWeight: 900, color: "white", lineHeight: 1 }}>{s.val}</div>
                  <div style={{ fontSize: "11px", color: "rgba(255,255,255,0.5)", marginTop: "4px" }}>{s.lbl}</div>
                </div>
              ))}
            </div>
            <button
              onClick={onAbrir}
              style={{
                display: "inline-flex", alignItems: "center", gap: "8px",
                padding: "10px 22px", borderRadius: "10px",
                background: "linear-gradient(135deg, #0EA5E9, #6366F1)",
                color: "white", fontSize: "14px", fontWeight: 700,
                border: "none", cursor: "pointer",
                boxShadow: "0 4px 20px rgba(14,165,233,0.35)",
              }}
            >
              <BookOpen style={{ width: "16px", height: "16px" }} />
              Abrir Manual de Funciones
            </button>
          </div>

          <div style={{ opacity: mounted ? 1 : 0, transform: mounted ? "translateY(0)" : "translateY(20px)", transition: "opacity 0.8s ease 0.2s, transform 0.8s ease 0.2s" }}>
            <svg viewBox="0 0 340 210" style={{ width: "100%", maxWidth: "280px", maxHeight: "130px", display: "block", margin: "0 auto" }}>
              <rect x="110" y="6" width="120" height="36" rx="9" fill="rgba(255,255,255,0.18)" stroke="rgba(255,255,255,0.4)" strokeWidth="1.5" />
              <text x="170" y="28" textAnchor="middle" fill="white" fontSize="12" fontWeight="bold" fontFamily="system-ui,sans-serif">EMPRESA</text>
              <line x1="170" y1="42" x2="170" y2="68" stroke="rgba(255,255,255,0.3)" strokeWidth="1.5" />
              <line x1="55"  y1="68" x2="285" y2="68" stroke="rgba(255,255,255,0.3)" strokeWidth="1.5" />
              <line x1="55"  y1="68" x2="55"  y2="84" stroke="rgba(255,255,255,0.3)" strokeWidth="1.5" />
              <line x1="170" y1="68" x2="170" y2="84" stroke="rgba(255,255,255,0.3)" strokeWidth="1.5" />
              <line x1="285" y1="68" x2="285" y2="84" stroke="rgba(255,255,255,0.3)" strokeWidth="1.5" />
              <rect x="10"  y="84" width="90" height="26" rx="7" fill="rgba(14,165,233,0.25)"  stroke="rgba(56,189,248,0.6)"  strokeWidth="1.2" />
              <text x="55"  y="101" textAnchor="middle" fill="#38BDF8" fontSize="9.5" fontWeight="bold" fontFamily="system-ui,sans-serif">Comercial</text>
              <line x1="55"  y1="110" x2="55"  y2="124" stroke="rgba(56,189,248,0.35)" strokeWidth="1" />
              <rect x="5"   y="124" width="100" height="20" rx="5" fill="rgba(255,255,255,0.11)" stroke="rgba(255,255,255,0.15)" strokeWidth="1" />
              <text x="55"  y="138" textAnchor="middle" fill="rgba(255,255,255,0.82)" fontSize="8" fontFamily="system-ui,sans-serif">Gerente de Ventas</text>
              <rect x="5"   y="148" width="100" height="20" rx="5" fill="rgba(255,255,255,0.06)" />
              <text x="55"  y="162" textAnchor="middle" fill="rgba(255,255,255,0.6)" fontSize="8" fontFamily="system-ui,sans-serif">Asesor Comercial</text>
              <rect x="125" y="84" width="90" height="26" rx="7" fill="rgba(99,102,241,0.25)" stroke="rgba(129,140,248,0.6)" strokeWidth="1.2" />
              <text x="170" y="101" textAnchor="middle" fill="#A5B4FC" fontSize="9.5" fontWeight="bold" fontFamily="system-ui,sans-serif">RRHH</text>
              <line x1="170" y1="110" x2="170" y2="124" stroke="rgba(129,140,248,0.35)" strokeWidth="1" />
              <rect x="120" y="124" width="100" height="20" rx="5" fill="rgba(255,255,255,0.11)" stroke="rgba(255,255,255,0.15)" strokeWidth="1" />
              <text x="170" y="138" textAnchor="middle" fill="rgba(255,255,255,0.82)" fontSize="8" fontFamily="system-ui,sans-serif">Dir. Talento Humano</text>
              <rect x="120" y="148" width="100" height="20" rx="5" fill="rgba(255,255,255,0.06)" />
              <text x="170" y="162" textAnchor="middle" fill="rgba(255,255,255,0.6)" fontSize="8" fontFamily="system-ui,sans-serif">Psicólogo Org.</text>
              <rect x="240" y="84" width="90" height="26" rx="7" fill="rgba(16,185,129,0.22)" stroke="rgba(52,211,153,0.55)" strokeWidth="1.2" />
              <text x="285" y="101" textAnchor="middle" fill="#6EE7B7" fontSize="9.5" fontWeight="bold" fontFamily="system-ui,sans-serif">Operaciones</text>
              <line x1="285" y1="110" x2="285" y2="124" stroke="rgba(52,211,153,0.35)" strokeWidth="1" />
              <rect x="235" y="124" width="100" height="20" rx="5" fill="rgba(255,255,255,0.11)" stroke="rgba(255,255,255,0.15)" strokeWidth="1" />
              <text x="285" y="138" textAnchor="middle" fill="rgba(255,255,255,0.82)" fontSize="8" fontFamily="system-ui,sans-serif">Jefe de Producción</text>
              <rect x="235" y="148" width="100" height="20" rx="5" fill="rgba(255,255,255,0.06)" />
              <text x="285" y="162" textAnchor="middle" fill="rgba(255,255,255,0.6)" fontSize="8" fontFamily="system-ui,sans-serif">Operario Senior</text>
              <text x="170" y="200" textAnchor="middle" fill="rgba(255,255,255,0.25)" fontSize="7.5" fontFamily="system-ui,sans-serif" fontStyle="italic">
                funciones · KPIs · competencias · plan de carrera
              </text>
            </svg>
          </div>
        </div>
      </div>

      {/* Outcomes */}
      <div style={{ background: "white", border: "1.5px solid #E0F2FE", borderRadius: "16px", padding: "16px 24px" }}>
        <div style={{ fontSize: "11px", fontWeight: 700, color: "#0EA5E9", textTransform: "uppercase", letterSpacing: "0.12em", marginBottom: "2px" }}>
          Tu módulo incluye
        </div>
        <h2 style={{ fontSize: "16px", fontWeight: 800, color: "#0C4A6E", margin: "0 0 10px", letterSpacing: "-0.01em" }}>
          Con el Manual de Funciones logras:
        </h2>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(2, 1fr)", gap: "10px" }}>
          {OUTCOMES.map((o) => (
            <div key={o.title} style={{ display: "flex", gap: "10px", background: "#F8FAFF", border: "1px solid #E0E7FF", borderRadius: "10px", padding: "8px 14px" }}>
              <div style={{ width: "26px", height: "26px", borderRadius: "7px", background: "#D1FAE5", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                <o.icon style={{ width: "14px", height: "14px", color: "#059669" }} />
              </div>
              <div>
                <div style={{ fontSize: "13px", fontWeight: 700, color: "#0C4A6E", marginBottom: "2px" }}>{o.title}</div>
                <div style={{ fontSize: "11px", color: "#64748B", lineHeight: 1.45 }}>{o.desc}</div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

// ── EvalDesempCargoLoader ──────────────────────────────────────────────────────

function EvalDesempCargoLoader({ cargoId, userRolEmpresa, onClose }: {
  cargoId: string;
  userRolEmpresa: string | null;
  onClose: () => void;
}) {
  const [cargo, setCargo] = useState<Cargo | null>(null);
  const [fetchError, setFetchError] = useState(false);

  useEffect(() => {
    let cancelled = false;
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    (supabase as any).from("manual_funciones_cargos").select("*").eq("id", cargoId).single()
      .then(({ data, error }: { data: Cargo | null; error: unknown }) => {
        if (cancelled) return;
        if (error || !data) setFetchError(true);
        else setCargo(data);
      });
    return () => { cancelled = true; };
  }, [cargoId]);

  return (
    <div style={{ position: "fixed", top: 0, right: 0, bottom: 0, left: "16rem", zIndex: 60, background: "#F8FAFC", overflowY: "auto" }}>
      {fetchError
        ? <div style={{ display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", height: "100%", gap: "12px" }}>
            <p style={{ color: "#64748B", fontSize: "14px", margin: 0 }}>No se pudo cargar el cargo.</p>
            <button
              onClick={onClose}
              style={{ fontSize: "13px", fontWeight: 600, padding: "6px 16px", borderRadius: "8px", background: "#F1F5F9", border: "1px solid #E2E8F0", color: "#64748B", cursor: "pointer" }}
            >Cerrar</button>
          </div>
        : !cargo
          ? <div style={{ display: "flex", alignItems: "center", justifyContent: "center", height: "100%" }}>
              <Loader2 style={{ width: "28px", height: "28px", color: "#94A3B8" }} className="animate-spin" />
            </div>
          : <EvalDesempPanel cargo={cargo} userRolEmpresa={userRolEmpresa} onClose={onClose} />
      }
    </div>
  );
}

// ── Component ─────────────────────────────────────────────────────────────────

function ManualFuncionesViewer() {
  const { clienteId } = Route.useParams();
  const navigate = useNavigate();
  const { role } = useAuth();
  const esCliente = role === "cliente" || role === "participante";
  const iframeRef      = useRef<HTMLIFrameElement>(null);
  const loadedUUIDs    = useRef<Set<string>>(new Set());
  const clienteNombre  = useRef<string>("");

  const [saving, setSaving]                   = useState(false);
  const [ultimoGuardado, setUltimoGuardado]   = useState<Date | null>(null);
  // null = loading, true = allowed, false = not allowed
  const [modEnabled, setModEnabled]           = useState<boolean | null>(esCliente ? null : true);
  const [iframeActive, setIframeActive]       = useState(false);
  const [userRolEmpresa, setUserRolEmpresa]   = useState<string | null>(null);
  const [restrictedAreaId, setRestrictedAreaId] = useState<string | null>(null);
  const [evalDesempCargoId, setEvalDesempCargoId] = useState<string | null>(null);

  // Client navigation state — derived from URL search params so browser back/forward work
  const { v, area, areaName, colorIdx, cargo } = Route.useSearch();
  const editorAbierto = esCliente ? v === "open" : true;
  type SelectedArea = { id: string; name: string; colorIdx: number };
  const selectedArea  = area ? { id: area, name: areaName ?? "", colorIdx: colorIdx ?? 0 } : null;
  const selectedCargo = cargo ?? null;

  // Entitlement check — same 3-step chain as AppSidebar / app.crecimiento.tsx
  const { user } = useAuth();
  useEffect(() => {
    if (!esCliente || !user) { setModEnabled(true); return; }
    let cancelled = false;
    (async () => {
      try {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const { data: eu } = await (supabase as any)
          .from("empresa_usuarios")
          .select("cliente_id,rol_empresa,area_id")
          .eq("user_id", user.id)
          .maybeSingle();
        if (cancelled) return;
        if (!eu?.cliente_id) { setModEnabled(false); return; }
        setUserRolEmpresa(eu?.rol_empresa ?? null);
        setRestrictedAreaId(eu?.area_id ?? null);

        const { data: cli } = await supabase
          .from("clientes")
          .select("plan_licencia")
          .eq("id", eu.cliente_id)
          .maybeSingle();
        if (cancelled) return;
        if (!cli?.plan_licencia) { setModEnabled(false); return; }

        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const { data: plan } = await (supabase as any)
          .from("planes")
          .select("id")
          .ilike("nombre", cli.plan_licencia)
          .maybeSingle();
        if (cancelled) return;
        if (!plan?.id) { setModEnabled(false); return; }

        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const { data: mod } = await (supabase as any)
          .from("plan_modulos")
          .select("modulo_slug")
          .eq("plan_id", plan.id)
          .eq("modulo_slug", "manual_funciones")
          .eq("activo", true)
          .maybeSingle();
        if (cancelled) return;
        setModEnabled(!!mod);
      } catch {
        if (!cancelled) setModEnabled(false);
      }
    })();
    return () => { cancelled = true; };
  }, [esCliente, user?.id]);

  // For clients: navigate one URL level back; for consultors: leave the module
  const handleBack = useCallback(() => {
    if (esCliente) {
      if (area) {
        navigate({ to: "/app/manual-funciones/$clienteId", params: { clienteId }, search: { v: "open" } });
      } else {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        navigate({ to: "/app/manual-funciones/$clienteId", params: { clienteId }, search: {} as any });
      }
    } else {
      navigate({ to: "/app/manual-funciones" });
    }
  }, [esCliente, navigate, area, clienteId]);

  // Guard: when cargo is in the URL, CargoFichaOverlay handles Escape (preserves auto-save)
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape" && !iframeActive && !cargo) handleBack();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [handleBack, iframeActive, cargo]);

  // Reset eval iframe when cargo leaves the URL (browser back from ficha while eval is open)
  useEffect(() => {
    if (!cargo) setIframeActive(false);
  }, [cargo]);

  // ── Bridge ── (moved before conditional returns to comply with Rules of Hooks)
  useEffect(() => {
    // Tipos de mensaje que no incluyen clienteId — exentos del guard por-cliente
    const MSGS_SIN_CLIENTE_ID = new Set(["MF_EVAL_CLOSED"]);

    const handler = async (e: MessageEvent) => {
      // Validación 1: origin
      if (e.origin !== window.location.origin) return;
      const msg = e.data as { type?: string; clienteId?: string; cargos?: HtmlCargo[] };
      if (!msg?.type) return;
      // Validación 2: clienteId activo (excepto tipos en MSGS_SIN_CLIENTE_ID)
      if (!MSGS_SIN_CLIENTE_ID.has(msg.type) && msg.clienteId !== clienteId) return;

      // ── MF_READY → inyectar datos ──────────────────────────────────────────
      if (msg.type === "MF_READY") {
        try {
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          const supa = supabase as any;
          const [{ data: cliente }, { data: rows, error: rowsErr }] = await Promise.all([
            supabase.from("clientes").select("nombre_empresa").eq("id", clienteId).single(),
            supa.from("manual_funciones_cargos").select("*").eq("cliente_id", clienteId).order("created_at"),
          ]);

          if (rowsErr) throw rowsErr;

          clienteNombre.current  = cliente?.nombre_empresa ?? "";
          const cargosDB         = (rows ?? []) as SupabaseCargo[];
          loadedUUIDs.current    = new Set(cargosDB.map(r => r.id));
          const htmlCargos       = cargosDB.map(r => supabaseToHtml(r, clienteNombre.current));

          // Validación 3: targetOrigin específico, nunca '*'
          iframeRef.current?.contentWindow?.postMessage(
            { type: "MF_DATA_RESPONSE", clienteId, cargos: htmlCargos },
            { targetOrigin: window.location.origin },
          );
        } catch (err) {
          toast.error("Error cargando cargos: " + (err instanceof Error ? err.message : String(err)));
          // Enviar array vacío para no bloquear al HTML
          iframeRef.current?.contentWindow?.postMessage(
            { type: "MF_DATA_RESPONSE", clienteId, cargos: [] },
            { targetOrigin: window.location.origin },
          );
        }
      }

      // ── MF_SAVE → persistir en Supabase ───────────────────────────────────
      if (msg.type === "MF_SAVE") {
        if (!Array.isArray(msg.cargos)) return;
        setSaving(true);
        try {
          const { data: { user } } = await supabase.auth.getUser();
          const consultorId = user?.id ?? null;
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          const supa2 = supabase as any;

          const knownUUIDs  = loadedUUIDs.current;
          const payloadIds  = new Set(msg.cargos.map(c => c.id as string));

          // INSERTs y UPDATEs
          for (const cargo of msg.cargos) {
            const cargoId  = cargo.id as string;
            const fields   = htmlToContent(cargo);

            if (knownUUIDs.has(cargoId)) {
              // UPDATE — consultor_id no se toca
              const { error } = await supa2
                .from("manual_funciones_cargos")
                .update({ ...fields, updated_at: new Date().toISOString() })
                .eq("id", cargoId);
              if (error) throw error;
            } else {
              // INSERT — consultor_id = usuario actual
              const { error } = await supa2
                .from("manual_funciones_cargos")
                .insert({ id: cargoId, cliente_id: clienteId, consultor_id: consultorId, ...fields });
              if (error) throw error;
            }
          }

          // DELETEs con salvaguarda
          const toDelete = [...knownUUIDs].filter(uuid => !payloadIds.has(uuid));
          if (toDelete.length > 0) {
            const dropRatio    = toDelete.length / knownUUIDs.size;
            const shouldGuard  =
              knownUUIDs.size >= MIN_SET_SIZE_FOR_GUARD &&
              dropRatio > SAFE_DELETE_THRESHOLD;

            if (shouldGuard) {
              console.warn(
                `[MF_BRIDGE] DELETE suprimido — payload: ${payloadIds.size} cargos, ` +
                `cargados: ${knownUUIDs.size}, caída: ${(dropRatio * 100).toFixed(0)}%. ` +
                `IDs omitidos: ${toDelete.join(", ")}`,
              );
              toast.warning("Cambios guardados. Algunos cargos pendientes de reconciliar.");
            } else {
              const { error } = await supa2
                .from("manual_funciones_cargos")
                .delete()
                .in("id", toDelete);
              if (error) throw error;
            }
          }

          // Actualizar set de UUIDs conocidos para el siguiente ciclo
          loadedUUIDs.current = payloadIds;
          setUltimoGuardado(new Date());
        } catch (err) {
          toast.error("Error al guardar: " + (err instanceof Error ? err.message : String(err)));
        } finally {
          setSaving(false);
        }
      }

      // ── MF_EVAL_CLOSED → hide eval iframe ─────────────────────────────────
      if (msg.type === "MF_EVAL_CLOSED") {
        setIframeActive(false);
        return;
      }

      // ── MF_OPEN_EVAL_DESEMP → open React EvalDesempPanel over iframe ───────
      if (msg.type === "MF_OPEN_EVAL_DESEMP") {
        const d = e.data as { cargoId?: string };
        if (d.cargoId) setEvalDesempCargoId(d.cargoId);
        return;
      }
    };

    window.addEventListener("message", handler);
    return () => window.removeEventListener("message", handler);
  }, [clienteId]);

  // ── Entitlement gates (clients only) ──────────────────────────────────────
  if (modEnabled === null) return (
    <div style={{ display: "flex", justifyContent: "center", alignItems: "center", height: "200px" }}>
      <Loader2 style={{ width: "24px", height: "24px", color: "#94A3B8" }} className="animate-spin" />
    </div>
  );
  if (modEnabled === false) return <ModuloNoIncluido />;

  // Show hero for clients until they open the editor
  if (esCliente && !editorAbierto) {
    return <ClienteManualHero clienteId={clienteId} onAbrir={() => navigate({ to: "/app/manual-funciones/$clienteId", params: { clienteId }, search: { v: "open" } })} />;
  }

  // ── Client: Landing → AreaCargosView → CargoFichaOverlay ────────────────────
  if (esCliente) {
    return (
      <>
        {/* Eval iframe — always mounted but invisible; z-50 only during eval sessions */}
        <iframe
          ref={iframeRef}
          src={`/manual-funciones.html?clienteId=${clienteId}&embed=1`}
          title="Manual de Funciones — Evaluación"
          style={{
            position: "fixed", top: 0, right: 0, bottom: 0, left: "16rem",
            zIndex: iframeActive ? 50 : -1,
            visibility: iframeActive ? "visible" : "hidden",
            border: "none", width: "100%", height: "100%",
          }}
        />

        {/* State machine: three mutually exclusive views — navigation via URL search params */}
        {!selectedArea && (
          <ManualFuncionesLanding
            clienteId={clienteId}
            onSelectArea={(aId, aName, cIdx) =>
              navigate({ to: "/app/manual-funciones/$clienteId", params: { clienteId }, search: { v: "open", area: aId, areaName: aName, colorIdx: cIdx } })
            }
            onSelectCargo={(cargoId, aId, aName, cIdx) =>
              navigate({ to: "/app/manual-funciones/$clienteId", params: { clienteId }, search: { v: "open", area: aId, areaName: aName, colorIdx: cIdx, cargo: cargoId } })
            }
          />
        )}

        {selectedArea && !selectedCargo && (
          <AreaCargosView
            clienteId={clienteId}
            areaId={selectedArea.id}
            areaName={selectedArea.name}
            colorIdx={selectedArea.colorIdx}
            userRolEmpresa={userRolEmpresa}
            restrictedAreaId={restrictedAreaId}
            onBack={() => navigate({ to: "/app/manual-funciones/$clienteId", params: { clienteId }, search: { v: "open" } })}
            onSelectCargo={(cargoId) =>
              navigate({ to: "/app/manual-funciones/$clienteId", params: { clienteId }, search: { v: "open", area, areaName, colorIdx, cargo: cargoId } })
            }
          />
        )}

        {selectedArea && selectedCargo && (
          <CargoFichaOverlay
            clienteId={clienteId}
            cargoId={selectedCargo}
            areaName={selectedArea.name}
            colorIdx={selectedArea.colorIdx}
            iframeRef={iframeRef}
            iframeActive={iframeActive}
            userRolEmpresa={userRolEmpresa}
            onClose={() => navigate({ to: "/app/manual-funciones/$clienteId", params: { clienteId }, search: { v: "open", area, areaName, colorIdx } })}
            onEvalOpen={() => setIframeActive(true)}
          />
        )}
      </>
    );
  }

  // ── Non-client: inline HTML editor (sidebar siempre visible) ──────────────
  return (
    <>
    <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
      {/* Franja superior */}
      <div style={{
        height: "44px", flexShrink: 0,
        background: "#0C4A6E", borderBottom: "3px solid #0EA5E9",
        borderRadius: "8px",
        display: "flex", alignItems: "center", justifyContent: "space-between",
        padding: "0 16px",
      }}>
        <span style={{ color: "#38BDF8", fontWeight: 700, fontSize: "13px", letterSpacing: "0.04em" }}>
          Manual de Funciones
        </span>
        <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
          {(saving || ultimoGuardado) && (
            <span style={{ display: "flex", alignItems: "center", gap: "4px", color: "rgba(255,255,255,0.6)", fontSize: "12px" }}>
              {saving
                ? <><Save style={{ width: "12px", height: "12px" }} /> Guardando…</>
                : <><Check style={{ width: "12px", height: "12px", color: "#4ade80" }} /> Guardado {ultimoGuardado!.toLocaleTimeString()}</>
              }
            </span>
          )}
          <button
            onClick={handleBack}
            style={{
              display: "flex", alignItems: "center", gap: "6px",
              color: "white", fontSize: "13px", fontWeight: 500,
              background: "rgba(255,255,255,0.1)", border: "1px solid rgba(255,255,255,0.25)",
              borderRadius: "4px", padding: "5px 14px", cursor: "pointer",
            }}
          >
            <ArrowLeft style={{ width: "14px", height: "14px" }} /> Volver a clientes
          </button>
        </div>
      </div>

      {/* iframe */}
      <iframe
        ref={iframeRef}
        src={`/manual-funciones.html?clienteId=${clienteId}`}
        title="Manual de Funciones"
        style={{ height: "calc(100vh - 180px)", width: "100%", border: "none", borderRadius: "8px" }}
        allow="fullscreen"
      />
    </div>
    {evalDesempCargoId && (
      <EvalDesempCargoLoader
        cargoId={evalDesempCargoId}
        userRolEmpresa={null}
        onClose={() => setEvalDesempCargoId(null)}
      />
    )}
    </>
  );
}
