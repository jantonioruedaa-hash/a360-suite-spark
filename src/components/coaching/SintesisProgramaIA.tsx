import { useState } from "react";
import { useServerFn } from "@tanstack/react-start";
import { Textarea } from "@/components/ui/textarea";
import { Brain, Loader2, Edit3, Save, RotateCw, Sparkles } from "lucide-react";
import { sintetizarProgramaCoaching } from "@/lib/coaching-ia.functions";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

const BTN_GRADIENT: React.CSSProperties = {
  display: "inline-flex", alignItems: "center", gap: "8px",
  padding: "14px 28px", borderRadius: "10px",
  background: "linear-gradient(135deg, #0EA5E9, #6366F1)",
  color: "white", fontSize: "14px", fontWeight: 700,
  border: "none", cursor: "pointer",
  boxShadow: "0 4px 20px rgba(14,165,233,0.35)",
  transition: "all 0.2s",
};

function renderizarAnalisis(texto: string) {
  if (!texto) return null;
  const lineas = texto.split("\n").filter(l => l.trim());
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
      {lineas.map((linea, i) => {
        const esEncabezado = linea.startsWith("##") || linea.startsWith("**") || /^\d+\.\s/.test(linea);
        const esViñeta = linea.startsWith("- ") || linea.startsWith("• ");
        const texto = linea.replace(/^#+\s*/, "").replace(/^\*\*(.+)\*\*$/, "$1").replace(/^[-•]\s*/, "");
        if (esEncabezado) {
          return (
            <div key={i} style={{ display: "flex", alignItems: "flex-start", gap: "12px", padding: "14px 18px", background: "linear-gradient(135deg, #EFF6FF, #EDE9FE)", border: "1.5px solid #C7D2FE", borderLeft: "4px solid #0EA5E9", borderRadius: "0 10px 10px 0" }}>
              <div style={{ fontSize: "15px", fontWeight: 700, color: "#0C4A6E", lineHeight: 1.5 }}>{texto}</div>
            </div>
          );
        }
        if (esViñeta) {
          return (
            <div key={i} style={{ display: "flex", alignItems: "flex-start", gap: "10px", paddingLeft: "8px" }}>
              <span style={{ color: "#0EA5E9", fontWeight: 800, flexShrink: 0, marginTop: "2px" }}>›</span>
              <p style={{ fontSize: "15px", color: "#475569", lineHeight: 1.75, margin: 0, textAlign: "justify" as const }}>{texto}</p>
            </div>
          );
        }
        return (
          <p key={i} style={{ fontSize: "15px", color: "#475569", lineHeight: 1.75, margin: 0, textAlign: "justify" as const }}>{linea}</p>
        );
      })}
    </div>
  );
}

export function SintesisProgramaIA({
  clienteId, contextoCliente, sintesisInicial, fechaInicial, onGuardar, readOnly = false,
}: {
  clienteId: string;
  contextoCliente?: string;
  sintesisInicial?: string | null;
  fechaInicial?: string | null;
  onGuardar?: (texto: string, fecha: string) => void;
  readOnly?: boolean;
}) {
  const [texto, setTexto] = useState(sintesisInicial ?? "");
  const [fecha, setFecha] = useState(fechaInicial ?? null);
  const [loading, setLoading] = useState(false);
  const [edit, setEdit] = useState(false);
  const fn = useServerFn(sintetizarProgramaCoaching);

  const generar = async () => {
    setLoading(true);
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session?.access_token) throw new Error("Sesión expirada. Vuelve a iniciar sesión.");
      const r = await fn({ data: { clienteId, contextoCliente, accessToken: session.access_token } });
      if (r.error || !r.sintesis || !r.fecha) throw new Error(r.error ?? "Error al generar síntesis");
      setTexto(r.sintesis);
      setFecha(r.fecha);
      onGuardar?.(r.sintesis, r.fecha);
      toast.success("Síntesis del programa generada");
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Error al generar síntesis");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "20px" }}>
      {/* Botón de acción prominente */}
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", flexWrap: "wrap", gap: "12px" }}>
        <div>
          <div style={{ fontSize: "15px", fontWeight: 700, color: "#0C4A6E", marginBottom: "3px", display: "flex", alignItems: "center", gap: "8px" }}>
            <Brain style={{ width: "18px", height: "18px", color: "#0EA5E9" }} />
            Síntesis ejecutiva del programa completo
          </div>
          {fecha && <p style={{ fontSize: "12px", color: "#94A3B8", margin: 0 }}>
            Generado: {new Date(fecha).toLocaleString("es", { day: "numeric", month: "long", year: "numeric", hour: "2-digit", minute: "2-digit" })}
          </p>}
        </div>
        {!readOnly && (
          <div style={{ display: "flex", gap: "10px" }}>
            {texto && !edit && (
              <button
                onClick={() => setEdit(true)}
                style={{ display: "inline-flex", alignItems: "center", gap: "6px", padding: "10px 18px", borderRadius: "10px", border: "1.5px solid #E0E7FF", background: "white", fontSize: "13px", fontWeight: 600, color: "#0369A1", cursor: "pointer" }}
              >
                <Edit3 style={{ width: "14px", height: "14px" }} /> Editar
              </button>
            )}
            {texto && edit && (
              <button
                onClick={() => { setEdit(false); onGuardar?.(texto, fecha ?? new Date().toISOString()); }}
                style={{ display: "inline-flex", alignItems: "center", gap: "6px", padding: "10px 18px", borderRadius: "10px", border: "none", background: "#059669", fontSize: "13px", fontWeight: 700, color: "white", cursor: "pointer" }}
              >
                <Save style={{ width: "14px", height: "14px" }} /> Guardar edición
              </button>
            )}
            <button onClick={generar} disabled={loading} style={BTN_GRADIENT}>
              {loading ? (
                <><Loader2 style={{ width: "16px", height: "16px" }} className="animate-spin" />Sintetizando…</>
              ) : texto ? (
                <><RotateCw style={{ width: "16px", height: "16px" }} />Regenerar síntesis</>
              ) : (
                <><Sparkles style={{ width: "16px", height: "16px" }} />Generar síntesis con IA</>
              )}
            </button>
          </div>
        )}
      </div>

      {/* Contenido */}
      {edit ? (
        <Textarea
          value={texto}
          onChange={(e) => setTexto(e.target.value)}
          rows={20}
          style={{ fontFamily: "inherit", fontSize: "14px", lineHeight: 1.75, padding: "16px", border: "1.5px solid #E0E7FF", borderRadius: "10px", outline: "none" }}
        />
      ) : texto ? (
        <div style={{ background: "white", border: "1px solid #E0E7FF", borderRadius: "16px", padding: "28px 32px" }}>
          {renderizarAnalisis(texto)}
        </div>
      ) : (
        <div style={{ background: "linear-gradient(135deg, #EFF6FF, #EDE9FE)", border: "1.5px solid #C7D2FE", borderRadius: "16px", padding: "32px", textAlign: "center" }}>
          <div style={{ fontSize: "44px", marginBottom: "16px" }}>🤖</div>
          <p style={{ fontSize: "15px", color: "#475569", lineHeight: 1.75, maxWidth: "460px", margin: "0 auto", textAlign: "justify" as const }}>
            Genera la síntesis ejecutiva del programa: línea base del Radar, hilos de transformación identificados, brechas actuales, delta de evolución, compromisos clave y recomendaciones estratégicas para el coach y el sponsor.
          </p>
        </div>
      )}
    </div>
  );
}
