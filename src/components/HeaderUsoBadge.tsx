import { useEffect, useState } from "react";
import { useRouterState } from "@tanstack/react-router";
import { supabase } from "@/integrations/supabase/client";
import { Bot, Users, Plus } from "lucide-react";
import {
  normalizePlan, AI_CREDITS_BY_PLAN, USER_LIMITS_BY_PLAN, type PlanKey,
} from "@/lib/plans";

interface ClienteUso {
  plan: PlanKey;
  creditosUsados: number;
  creditosBase: number;
  creditosExtra: number;
  creditosTotal: number;
  usuariosActivos: number;
  usuariosTotal: number | null; // null = ilimitado
}

function getClienteIdFromPath(path: string): string | null {
  const m = path.match(/^\/app\/clientes\/([0-9a-fA-F-]{36})/);
  return m?.[1] ?? null;
}

export function HeaderUsoBadge() {
  const path = useRouterState({ select: (r) => r.location.pathname });
  const clienteId = getClienteIdFromPath(path);
  const [uso, setUso] = useState<ClienteUso | null>(null);
  const [showExtraDialog, setShowExtraDialog] = useState(false);

  useEffect(() => {
    if (!clienteId) { setUso(null); return; }
    let cancelled = false;

    const load = async () => {
      const [{ data: cli }, { count }] = await Promise.all([
        supabase.from("clientes")
          .select("plan_licencia, creditos_ia_usados, creditos_ia_extra")
          .eq("id", clienteId).maybeSingle(),
        supabase.from("cliente_contactos")
          .select("id", { count: "exact", head: true })
          .eq("cliente_id", clienteId).eq("activo", true),
      ]);
      if (cancelled || !cli) return;
      const plan = normalizePlan(cli.plan_licencia);
      const base = AI_CREDITS_BY_PLAN[plan];
      const extra = (cli.creditos_ia_extra as number | null) ?? 0;
      setUso({
        plan,
        creditosUsados: (cli.creditos_ia_usados as number | null) ?? 0,
        creditosBase: base,
        creditosExtra: extra,
        creditosTotal: base + extra,
        usuariosActivos: count ?? 0,
        usuariosTotal: USER_LIMITS_BY_PLAN[plan],
      });
    };
    load();

    const channel = supabase
      .channel(`uso-cliente-${clienteId}`)
      .on("postgres_changes", {
        event: "UPDATE", schema: "public", table: "clientes",
        filter: `id=eq.${clienteId}`,
      }, () => load())
      .subscribe();

    return () => { cancelled = true; supabase.removeChannel(channel); };
  }, [clienteId]);

  if (!uso) return null;

  const usuariosLabel = uso.usuariosTotal === null ? "∞" : uso.usuariosTotal;
  const overIA = uso.creditosUsados >= uso.creditosTotal;
  const overUsers = uso.usuariosTotal !== null && uso.usuariosActivos >= uso.usuariosTotal;

  return (
    <div className="hidden md:flex items-center gap-3 text-xs">
      <button
        type="button"
        onClick={() => setShowExtraDialog(true)}
        title={`Análisis IA usados este mes (plan ${uso.plan}). Haz clic para adquirir créditos adicionales.`}
        className={`flex items-center gap-1.5 px-2.5 py-1 rounded-md border cursor-pointer transition-colors ${
          overIA ? "border-destructive/40 text-destructive bg-destructive/5 hover:bg-destructive/10"
                 : "border-border text-navy bg-cream/40 hover:bg-cream/60"
        }`}
      >
        <Bot className="w-3.5 h-3.5" />
        <span className="font-mono">{uso.creditosUsados}/{uso.creditosTotal}</span>
        {uso.creditosExtra > 0 && (
          <span className="text-[10px] opacity-70">+{uso.creditosExtra}</span>
        )}
        <Plus className="w-3 h-3 opacity-60 ml-0.5" />
      </button>
      <div
        title="Contactos activos del cliente"
        className={`flex items-center gap-1.5 px-2.5 py-1 rounded-md border ${
          overUsers ? "border-destructive/40 text-destructive bg-destructive/5"
                    : "border-border text-navy bg-cream/40"
        }`}
      >
        <Users className="w-3.5 h-3.5" />
        <span className="font-mono">{uso.usuariosActivos}/{usuariosLabel}</span>
      </div>

      {showExtraDialog && (
        <ExtraCreditDialog clienteId={clienteId!} onClose={() => setShowExtraDialog(false)} />
      )}
    </div>
  );
}

function ExtraCreditDialog({ clienteId, onClose }: { clienteId: string; onClose: () => void }) {
  const [cantidad, setCantidad] = useState(5);
  const [loading, setLoading] = useState(false);
  const [msg, setMsg] = useState("");

  const solicitar = async () => {
    setLoading(true);
    setMsg("");
    try {
      const { data: s } = await supabase.auth.getSession();
      const accessToken = s.session?.access_token;
      if (!accessToken) throw new Error("Sin sesión");
      const { asignarCreditosExtra } = await import("@/lib/creditos-ia.functions");
      const res = await asignarCreditosExtra({ data: { clienteId, cantidad, accessToken } });
      if (res.ok) {
        setMsg(`✓ Se agregaron ${cantidad} créditos. Total extra ahora: ${res.nuevoTotalExtra}.`);
      } else {
        setMsg(`Error: ${res.error}`);
      }
    } catch (e: any) {
      setMsg(`Error: ${e.message}`);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40" onClick={onClose}>
      <div className="bg-background rounded-xl border shadow-lg p-5 w-full max-w-sm" onClick={(e) => e.stopPropagation()}>
        <h3 className="text-sm font-semibold mb-2">Créditos IA adicionales</h3>
        <p className="text-xs text-muted-foreground mb-3">
          Adquiere créditos extra que se suman a tu plan mensual. Se consumen junto con tu cuota habitual.
        </p>
        <label className="text-xs font-medium block mb-1">Cantidad a agregar</label>
        <input
          type="number"
          min={1}
          max={500}
          value={cantidad}
          onChange={(e) => setCantidad(Number(e.target.value))}
          className="w-full rounded-md border px-3 py-2 text-sm bg-background mb-3"
        />
        {msg && <p className="text-xs mb-2">{msg}</p>}
        <div className="flex gap-2 justify-end">
          <button onClick={onClose} className="px-3 py-1.5 text-xs rounded-md border hover:bg-muted">Cerrar</button>
          <button
            onClick={solicitar}
            disabled={loading}
            className="px-3 py-1.5 text-xs rounded-md bg-primary text-primary-foreground hover:bg-primary/90 disabled:opacity-50"
          >
            {loading ? "Procesando..." : "Agregar créditos"}
          </button>
        </div>
      </div>
    </div>
  );
}
