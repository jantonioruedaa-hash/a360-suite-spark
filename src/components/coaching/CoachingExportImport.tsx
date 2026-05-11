import { useRef } from "react";
import { Button } from "@/components/ui/button";
import { Download, Upload, FileText } from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { HERRAMIENTAS_A360, ETAPAS_A360, getHerramienta } from "@/lib/coaching-catalogo";
import type { SesionCoaching } from "@/lib/coaching-helpers";

interface Props {
  clienteId: string;
  clienteNombre: string;
  sesiones: SesionCoaching[];
  onImported: () => void;
}

export function CoachingExportImport({ clienteId, clienteNombre, sesiones, onImported }: Props) {
  const fileRef = useRef<HTMLInputElement>(null);

  const exportJSON = () => {
    const payload = {
      version: 1,
      tipo: "coaching_a360",
      cliente_id: clienteId,
      cliente_nombre: clienteNombre,
      exportado_en: new Date().toISOString(),
      sesiones: sesiones.map((s) => ({
        herramienta_id: s.herramienta_id,
        etapa: s.etapa,
        completada: s.completada,
        created_at: s.created_at,
        datos: s.datos,
      })),
    };
    const blob = new Blob([JSON.stringify(payload, null, 2)], { type: "application/json" });
    descargar(blob, `coaching_${slug(clienteNombre)}.json`);
    toast.success(`Exportadas ${sesiones.length} sesiones`);
  };

  const exportMarkdown = () => {
    const lines: string[] = [];
    lines.push(`# Coaching A360 — ${clienteNombre}`);
    lines.push(`_Exportado: ${new Date().toLocaleString()}_\n`);
    ETAPAS_A360.forEach((et) => {
      const herrs = HERRAMIENTAS_A360.filter((h) => h.etapa === et.id);
      lines.push(`\n## ${et.id}\n_${et.descripcion}_\n`);
      herrs.forEach((h) => {
        const ses = sesiones.filter((s) => s.herramienta_id === h.id);
        lines.push(`\n### ${h.nombre}`);
        lines.push(`**Propósito:** ${h.proposito}`);
        if (ses.length === 0) {
          lines.push(`_Sin registros._`);
        } else {
          ses.forEach((s) => {
            lines.push(`\n#### Registro ${new Date(s.created_at).toLocaleString()} ${s.completada ? "✅" : "🟡"}`);
            const d = (s.datos ?? {}) as Record<string, unknown>;
            Object.entries(d).forEach(([k, v]) => {
              if (k.startsWith("analisis_ia")) return;
              if (v == null || v === "") return;
              lines.push(`- **${k}:** ${typeof v === "string" ? v : JSON.stringify(v)}`);
            });
            if (typeof d.analisis_ia === "string") {
              lines.push(`\n**Análisis IA:**\n\n${d.analisis_ia}\n`);
            }
          });
        }
      });
    });
    const blob = new Blob([lines.join("\n")], { type: "text/markdown;charset=utf-8" });
    descargar(blob, `coaching_${slug(clienteNombre)}.md`);
    toast.success("Reporte markdown generado");
  };

  const onFile = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const f = e.target.files?.[0];
    e.target.value = "";
    if (!f) return;
    try {
      const text = await f.text();
      const parsed = JSON.parse(text);
      const lista = Array.isArray(parsed) ? parsed : parsed.sesiones;
      if (!Array.isArray(lista)) throw new Error("Estructura inválida (falta `sesiones`)");
      if (!confirm(`Se importarán ${lista.length} sesiones para ${clienteNombre}. ¿Continuar?`)) return;

      const { data: u } = await supabase.auth.getUser();
      const filas = lista
        .filter((s) => s && (s.herramienta_id || s.herramientaId))
        .map((s) => {
          const hid = s.herramienta_id ?? s.herramientaId;
          const h = getHerramienta(hid);
          return {
            cliente_id: clienteId,
            consultor_id: u.user?.id ?? null,
            herramienta_id: hid,
            etapa: s.etapa ?? h?.etapa ?? null,
            datos: s.datos ?? {},
            completada: !!s.completada,
          };
        });
      if (filas.length === 0) throw new Error("No se encontraron sesiones válidas");

      const { error } = await supabase.from("coaching_sesiones").insert(filas);
      if (error) throw error;
      toast.success(`${filas.length} sesiones importadas`);
      onImported();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Error al importar JSON");
    }
  };

  return (
    <div className="flex flex-wrap gap-2 items-center">
      <Button size="sm" variant="outline" onClick={exportJSON} disabled={sesiones.length === 0}>
        <Download className="w-3 h-3 mr-1" /> Exportar JSON
      </Button>
      <Button size="sm" variant="outline" onClick={exportMarkdown} disabled={sesiones.length === 0}>
        <FileText className="w-3 h-3 mr-1" /> Exportar reporte
      </Button>
      <Button size="sm" variant="outline" onClick={() => fileRef.current?.click()}>
        <Upload className="w-3 h-3 mr-1" /> Importar JSON
      </Button>
      <input ref={fileRef} type="file" accept="application/json,.json" className="hidden" onChange={onFile} />
    </div>
  );
}

function descargar(blob: Blob, name: string) {
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = name;
  a.click();
  URL.revokeObjectURL(url);
}
function slug(s: string) {
  return s.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "").replace(/[^a-z0-9]+/g, "_").replace(/^_|_$/g, "");
}
