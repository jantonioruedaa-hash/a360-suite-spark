import { useEffect, useState, useMemo, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";

export type AlertaSeveridad = "critica" | "alta" | "media";
export type AlertaTipo = "compromiso_vencido" | "compromiso_proximo" | "sesion_proxima" | "cotizacion_por_vencer";

export interface Alerta {
  id: string;
  tipo: AlertaTipo;
  severidad: AlertaSeveridad;
  titulo: string;
  detalle: string;
  fecha: string;          // ISO
  clienteId: string;
  clienteNombre: string;
  to: string;             // ruta destino
  diasDelta: number;      // negativo = vencido, positivo = futuro
}

const STORAGE_KEY = "a360-alertas-leidas";

function getLeidas(): Set<string> {
  if (typeof window === "undefined") return new Set();
  try {
    return new Set(JSON.parse(localStorage.getItem(STORAGE_KEY) ?? "[]") as string[]);
  } catch {
    return new Set();
  }
}

function saveLeidas(set: Set<string>) {
  if (typeof window === "undefined") return;
  localStorage.setItem(STORAGE_KEY, JSON.stringify([...set]));
}

const dayDiff = (target: Date, base: Date) =>
  Math.round((target.getTime() - base.getTime()) / 86400000);

export function useAlertas() {
  const [alertas, setAlertas] = useState<Alerta[]>([]);
  const [leidas, setLeidas] = useState<Set<string>>(() => getLeidas());
  const [loading, setLoading] = useState(true);

  const refetch = useCallback(async () => {
    setLoading(true);
    const today = new Date(); today.setHours(0, 0, 0, 0);
    const in7 = new Date(today); in7.setDate(in7.getDate() + 7);
    const in14 = new Date(today); in14.setDate(in14.getDate() + 14);

    const [clientesRes, compromisosRes, actividadesRes, cotizacionesRes] = await Promise.all([
      supabase.from("clientes").select("id,nombre_empresa").eq("activo", true),
      supabase.from("cliente_compromisos").select("id,cliente_id,descripcion,estado,fecha_limite").eq("estado", "pendiente"),
      supabase.from("cliente_actividades").select("id,cliente_id,titulo,proxima_fecha,proxima_accion,fecha_proxima_accion,es_sesion_consultoria").not("proxima_fecha", "is", null),
      supabase.from("cliente_cotizaciones").select("id,cliente_id,numero_cotizacion,titulo,estado,fecha_vencimiento").in("estado", ["enviada", "borrador"]),
    ]);

    const nombrePorId = new Map<string, string>();
    (clientesRes.data ?? []).forEach((c: any) => nombrePorId.set(c.id, c.nombre_empresa));

    const out: Alerta[] = [];

    for (const c of (compromisosRes.data ?? []) as any[]) {
      if (!c.fecha_limite) continue;
      const f = new Date(c.fecha_limite);
      const delta = dayDiff(f, today);
      if (delta > 7) continue;
      const vencido = delta < 0;
      out.push({
        id: `comp-${c.id}`,
        tipo: vencido ? "compromiso_vencido" : "compromiso_proximo",
        severidad: vencido ? "critica" : delta <= 2 ? "alta" : "media",
        titulo: vencido ? "Compromiso vencido" : "Compromiso próximo",
        detalle: c.descripcion,
        fecha: c.fecha_limite,
        clienteId: c.cliente_id,
        clienteNombre: nombrePorId.get(c.cliente_id) ?? "—",
        to: `/app/clientes/${c.cliente_id}/actividades`,
        diasDelta: delta,
      });
    }

    for (const a of (actividadesRes.data ?? []) as any[]) {
      const f = new Date(a.proxima_fecha);
      const delta = dayDiff(f, today);
      if (delta < 0 || delta > 14) continue;
      if (delta > 7 && !a.es_sesion_consultoria) continue;
      out.push({
        id: `ses-${a.id}`,
        tipo: "sesion_proxima",
        severidad: delta <= 1 ? "alta" : "media",
        titulo: a.es_sesion_consultoria ? "Próxima sesión" : "Próxima actividad",
        detalle: a.proxima_accion || a.titulo,
        fecha: a.proxima_fecha,
        clienteId: a.cliente_id,
        clienteNombre: nombrePorId.get(a.cliente_id) ?? "—",
        to: `/app/clientes/${a.cliente_id}/actividades`,
        diasDelta: delta,
      });
    }

    for (const q of (cotizacionesRes.data ?? []) as any[]) {
      if (!q.fecha_vencimiento) continue;
      const f = new Date(q.fecha_vencimiento);
      const delta = dayDiff(f, today);
      if (delta > 7 || delta < -3) continue;
      out.push({
        id: `cot-${q.id}`,
        tipo: "cotizacion_por_vencer",
        severidad: delta < 0 ? "critica" : delta <= 2 ? "alta" : "media",
        titulo: delta < 0 ? "Cotización vencida" : "Cotización por vencer",
        detalle: `${q.numero_cotizacion ?? "—"} · ${q.titulo}`,
        fecha: q.fecha_vencimiento,
        clienteId: q.cliente_id,
        clienteNombre: nombrePorId.get(q.cliente_id) ?? "—",
        to: `/app/clientes/${q.cliente_id}/cotizaciones`,
        diasDelta: delta,
      });
    }

    out.sort((a, b) => {
      const sev = { critica: 0, alta: 1, media: 2 } as const;
      if (sev[a.severidad] !== sev[b.severidad]) return sev[a.severidad] - sev[b.severidad];
      return a.diasDelta - b.diasDelta;
    });

    setAlertas(out);
    setLoading(false);
  }, []);

  useEffect(() => { refetch(); }, [refetch]);

  const noLeidas = useMemo(() => alertas.filter((a) => !leidas.has(a.id)), [alertas, leidas]);
  const criticas = useMemo(() => alertas.filter((a) => a.severidad === "critica"), [alertas]);

  const marcarLeida = useCallback((id: string) => {
    setLeidas((prev) => { const n = new Set(prev); n.add(id); saveLeidas(n); return n; });
  }, []);
  const marcarTodasLeidas = useCallback(() => {
    setLeidas((prev) => { const n = new Set(prev); alertas.forEach((a) => n.add(a.id)); saveLeidas(n); return n; });
  }, [alertas]);

  return { alertas, noLeidas, criticas, loading, refetch, marcarLeida, marcarTodasLeidas };
}

export function formatearDelta(d: number): string {
  if (d < 0) return `Hace ${Math.abs(d)}d`;
  if (d === 0) return "Hoy";
  if (d === 1) return "Mañana";
  return `En ${d}d`;
}
