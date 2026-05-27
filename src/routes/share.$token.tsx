import { createFileRoute, useParams } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { A360Logo } from "@/components/A360Logo";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { FileDown, Eye, Calendar, ExternalLink } from "lucide-react";

export const Route = createFileRoute("/share/$token")({ component: SharePage });

interface Compartido {
  id: string; cliente_id: string; tipo_contenido: string; contenido_id: string | null;
  titulo: string; mensaje: string | null; pdf_url: string | null;
  destinatarios_nombres: { nombre: string }[]; vistas: number;
  expira_en: string | null; estado: string; created_at: string;
  incluir_kpis: boolean; incluir_compromisos: boolean;
  nombre_empresa: string | null;
}

function SharePage() {
  const { token } = useParams({ from: "/share/$token" });
  const [data, setData] = useState<Compartido | null>(null);
  const [empresa, setEmpresa] = useState<{ nombre_empresa: string } | null>(null);
  const [extras, setExtras] = useState<{ kpis: any[]; compromisos: any[]; actividad: any | null }>({ kpis: [], compromisos: [], actividad: null });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    (async () => {
      const { data: rows, error: er } = await (supabase as any)
        .rpc("get_compartido_by_token", { _token: token });
      const row = Array.isArray(rows) ? rows[0] : rows;
      if (er || !row) { setError("Enlace inválido o expirado."); setLoading(false); return; }
      setData(row as unknown as Compartido);
      if (row.nombre_empresa) setEmpresa({ nombre_empresa: row.nombre_empresa });


      // Cargar extras
      const kpisP: Promise<{ data: any[] | null }> = row.incluir_kpis && row.contenido_id
        ? Promise.resolve(supabase.from("cliente_kpis").select("*").eq("actividad_id", row.contenido_id)).then((r) => ({ data: r.data as any[] | null }))
        : Promise.resolve({ data: [] });
      const compP: Promise<{ data: any[] | null }> = row.incluir_compromisos
        ? Promise.resolve(supabase.from("cliente_compromisos").select("*").eq("cliente_id", row.cliente_id).eq("estado", "pendiente")).then((r) => ({ data: r.data as any[] | null }))
        : Promise.resolve({ data: [] });
      const actP: Promise<{ data: any | null }> = row.tipo_contenido === "reporte_sesion" && row.contenido_id
        ? Promise.resolve(supabase.from("cliente_actividades").select("*").eq("id", row.contenido_id).maybeSingle()).then((r) => ({ data: r.data }))
        : Promise.resolve({ data: null });

      const [k, c, a] = await Promise.all([kpisP, compP, actP]);
      setExtras({ kpis: k.data ?? [], compromisos: c.data ?? [], actividad: a.data });

      // Registrar visita
      await supabase.rpc("registrar_vista_compartido", { _token: token, _ip: undefined });
      setLoading(false);
    })();
  }, [token]);

  if (loading) return <div className="min-h-screen flex items-center justify-center bg-cream"><p className="text-muted-foreground">Cargando…</p></div>;
  if (error) return (
    <div className="min-h-screen flex items-center justify-center bg-cream">
      <div className="text-center max-w-md">
        <h1 className="font-display text-4xl text-navy mb-2">Enlace no disponible</h1>
        <p className="text-muted-foreground">{error}</p>
      </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-cream">
      {/* Header navy/dorado */}
      <header className="bg-navy text-white">
        <div className="max-w-4xl mx-auto px-6 py-5 flex items-center justify-between">
          <A360Logo size={36} withText />
          <Badge className="bg-gold text-navy">Documento compartido</Badge>
        </div>
        <div className="h-1 bg-gold" />
      </header>

      <main className="max-w-4xl mx-auto px-6 py-8 space-y-6">
        {/* Card principal */}
        <div className="bg-white rounded-lg shadow-sm border p-6">
          <div className="flex items-start justify-between flex-wrap gap-2 mb-4">
            <div>
              <p className="text-xs uppercase tracking-wider text-gold font-semibold">{data!.tipo_contenido.replace("_", " ")}</p>
              <h1 className="text-2xl font-bold text-navy mt-1">{data!.titulo}</h1>
              {empresa && <p className="text-sm text-muted-foreground mt-1">Para: <strong>{empresa.nombre_empresa}</strong></p>}
            </div>
            <div className="text-right text-xs text-muted-foreground">
              <div className="flex items-center gap-1"><Calendar className="w-3 h-3" /> {new Date(data!.created_at).toLocaleDateString()}</div>
              <div className="flex items-center gap-1 mt-1"><Eye className="w-3 h-3" /> {data!.vistas} vista{data!.vistas !== 1 ? "s" : ""}</div>
            </div>
          </div>

          {data!.mensaje && (
            <div className="bg-cream p-4 rounded mb-4 border-l-4 border-gold">
              <p className="text-sm text-navy whitespace-pre-wrap">{data!.mensaje}</p>
            </div>
          )}

          {data!.pdf_url && (
            <Button asChild className="bg-navy text-white hover:bg-navy/90">
              <a href={data!.pdf_url} target="_blank" rel="noreferrer">
                <FileDown className="w-4 h-4 mr-2" /> Descargar PDF completo
              </a>
            </Button>
          )}
        </div>

        {/* Resumen actividad/sesión */}
        {extras.actividad && (
          <div className="bg-white rounded-lg shadow-sm border p-6">
            <h2 className="text-lg font-bold text-navy mb-3">Resumen de la sesión</h2>
            {extras.actividad.objetivo && <p className="text-sm mb-2"><strong className="text-navy">Objetivo:</strong> {extras.actividad.objetivo}</p>}
            {!!extras.actividad.temas?.length && <p className="text-sm mb-2"><strong className="text-navy">Temas:</strong> {extras.actividad.temas.join(" · ")}</p>}
            {!!extras.actividad.logros?.length && <p className="text-sm mb-2"><strong className="text-navy">Logros:</strong> {extras.actividad.logros.join(" · ")}</p>}
            {extras.actividad.mensaje_cliente && (
              <div className="bg-cream p-3 rounded mt-3">
                <p className="text-sm text-navy italic">"{extras.actividad.mensaje_cliente}"</p>
              </div>
            )}
          </div>
        )}

        {/* KPIs */}
        {data!.incluir_kpis && extras.kpis.length > 0 && (
          <div className="bg-white rounded-lg shadow-sm border p-6">
            <h2 className="text-lg font-bold text-navy mb-3">KPIs medidos</h2>
            <table className="w-full text-sm">
              <thead><tr className="border-b text-xs uppercase text-muted-foreground">
                <th className="text-left py-2">Categoría</th><th className="text-left">KPI</th>
                <th className="text-right">Actual</th><th className="text-right">Meta</th><th>Estado</th>
              </tr></thead>
              <tbody>
                {extras.kpis.map((k: any) => (
                  <tr key={k.id} className="border-b">
                    <td className="py-2 text-muted-foreground">{k.categoria}</td>
                    <td className="font-medium">{k.nombre}</td>
                    <td className="text-right">{k.valor_actual ?? "—"} {k.unidad}</td>
                    <td className="text-right">{k.valor_meta ?? "—"} {k.unidad}</td>
                    <td className="text-center">
                      <span className={`inline-block w-2.5 h-2.5 rounded-full ${k.semaforo === "verde" ? "bg-green-500" : k.semaforo === "amarillo" ? "bg-yellow-500" : "bg-red-500"}`} />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {/* Compromisos */}
        {data!.incluir_compromisos && extras.compromisos.length > 0 && (
          <div className="bg-white rounded-lg shadow-sm border p-6">
            <h2 className="text-lg font-bold text-navy mb-3">Compromisos pendientes</h2>
            <ul className="space-y-2">
              {extras.compromisos.map((c: any) => (
                <li key={c.id} className="flex items-start gap-2 text-sm border-b pb-2">
                  <span className="w-2 h-2 mt-1.5 rounded-full bg-gold flex-shrink-0" />
                  <div className="flex-1">
                    <div>{c.descripcion}</div>
                    <div className="text-xs text-muted-foreground">
                      {c.responsable ? `Responsable: ${c.responsable}` : ""}
                      {c.fecha_limite ? ` · Vence: ${new Date(c.fecha_limite).toLocaleDateString()}` : ""}
                    </div>
                  </div>
                </li>
              ))}
            </ul>
          </div>
        )}

        <footer className="text-center text-xs text-muted-foreground py-6">
          <p>Compartido vía A360SGP Suite — Strategic Growth Partners</p>
          {data!.expira_en && <p className="mt-1">Este enlace expira el {new Date(data!.expira_en).toLocaleDateString()}</p>}
        </footer>
      </main>
    </div>
  );
}
