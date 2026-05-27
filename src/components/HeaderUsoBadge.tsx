import { useEffect, useState } from "react";
import { useRouterState } from "@tanstack/react-router";
import { supabase } from "@/integrations/supabase/client";
import { Bot, Users } from "lucide-react";
import {
  normalizePlan, AI_CREDITS_BY_PLAN, USER_LIMITS_BY_PLAN, type PlanKey,
} from "@/lib/plans";

interface ClienteUso {
  plan: PlanKey;
  creditosUsados: number;
  creditosTotal: number;
  usuariosActivos: number;
  usuariosTotal: number | null; // null = ilimitado
}

function getClienteIdFromPath(path: string): string | null {
  // /app/clientes/:id/...
  const m = path.match(/^\/app\/clientes\/([0-9a-fA-F-]{36})/);
  return m?.[1] ?? null;
}

export function HeaderUsoBadge() {
  const path = useRouterState({ select: (r) => r.location.pathname });
  const clienteId = getClienteIdFromPath(path);
  const [uso, setUso] = useState<ClienteUso | null>(null);

  useEffect(() => {
    if (!clienteId) { setUso(null); return; }
    let cancelled = false;

    const load = async () => {
      const [{ data: cli }, { count }] = await Promise.all([
        supabase.from("clientes")
          .select("plan_licencia, creditos_ia_usados")
          .eq("id", clienteId).maybeSingle(),
        // Conteo de "usuarios" del cliente: contactos activos asociados.
        supabase.from("cliente_contactos")
          .select("id", { count: "exact", head: true })
          .eq("cliente_id", clienteId).eq("activo", true),
      ]);
      if (cancelled || !cli) return;
      const plan = normalizePlan(cli.plan_licencia);
      setUso({
        plan,
        creditosUsados: (cli.creditos_ia_usados as number | null) ?? 0,
        creditosTotal: AI_CREDITS_BY_PLAN[plan],
        usuariosActivos: count ?? 0,
        usuariosTotal: USER_LIMITS_BY_PLAN[plan],
      });
    };
    load();

    // Realtime: refrescar al cambiar el contador en la fila del cliente
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
      <div
        title={`Análisis IA usados este mes (plan ${uso.plan})`}
        className={`flex items-center gap-1.5 px-2.5 py-1 rounded-md border ${
          overIA ? "border-destructive/40 text-destructive bg-destructive/5"
                 : "border-border text-navy bg-cream/40"
        }`}
      >
        <Bot className="w-3.5 h-3.5" />
        <span className="font-mono">{uso.creditosUsados}/{uso.creditosTotal}</span>
      </div>
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
    </div>
  );
}
