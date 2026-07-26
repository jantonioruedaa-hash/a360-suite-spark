import { createFileRoute, useNavigate, useParams } from "@tanstack/react-router";
import { useEffect, useRef, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { cargarWorkbookHtml, guardarWorkbookHtml } from "@/lib/lee-workbook-html";
import { ArrowLeft, Save } from "lucide-react";
import { toast } from "sonner";

export const Route = createFileRoute("/app/clientes/$clienteId/lee/$capitulo")({
  component: LeeWorkbookViewer,
});

interface Programa {
  id: string;
  capitulos_desbloqueados: number[];
}

function LeeWorkbookViewer() {
  const { clienteId, capitulo: capStr } = useParams({
    from: "/app/clientes/$clienteId/lee/$capitulo",
  });
  const navigate = useNavigate();
  const iframeRef = useRef<HTMLIFrameElement>(null);

  const capNum = parseInt(capStr, 10);
  const iframeUrl = `/lee-workbooks/lee-cap-${String(capNum).padStart(2, "0")}.html`;

  const [programa, setPrograma] = useState<Programa | null>(null);
  const [loading, setLoading] = useState(true);
  const [bloqueado, setBloqueado] = useState(false);
  const [saving, setSaving] = useState(false);

  // programaId en ref para acceso desde el listener sin cierre obsoleto
  const programaIdRef = useRef<string | null>(null);

  useEffect(() => {
    (async () => {
      const { data: p } = await supabase
        .from("lee_programas")
        .select("id, capitulos_desbloqueados")
        .eq("cliente_id", clienteId)
        .maybeSingle();

      if (!p) { setLoading(false); setBloqueado(true); return; }

      setPrograma(p as Programa);
      programaIdRef.current = (p as Programa).id;

      const desbloqueados = (p as Programa).capitulos_desbloqueados ?? [];
      if (!desbloqueados.includes(capNum)) {
        setLoading(false);
        setBloqueado(true);
        return;
      }
      setLoading(false);
    })();
  }, [clienteId, capNum]);

  // Bridge postMessage
  useEffect(() => {
    const handler = async (e: MessageEvent) => {
      if (e.origin !== window.location.origin) return;
      const msg = e.data as { type?: string; chapter?: number; payload?: Record<string, unknown> };
      if (!msg?.type) return;

      // Validar que el evento es del capítulo correcto
      if (msg.chapter !== undefined && msg.chapter !== capNum) return;

      const pid = programaIdRef.current;

      if (msg.type === "LEE_DATA_REQUEST") {
        if (!pid) return;
        try {
          const wb = await cargarWorkbookHtml(pid, capNum);
          e.source?.postMessage(
            {
              type: "LEE_DATA_RESPONSE",
              chapter: capNum,
              payload: wb?.respuestas ?? {},
            },
            { targetOrigin: window.location.origin },
          );
        } catch {
          // si falla la carga, responder con payload vacío para no bloquear al workbook
          e.source?.postMessage(
            { type: "LEE_DATA_RESPONSE", chapter: capNum, payload: {} },
            { targetOrigin: window.location.origin },
          );
        }
      }

      if (msg.type === "LEE_DATA_SAVE") {
        if (!pid || !msg.payload) return;
        setSaving(true);
        try {
          await guardarWorkbookHtml(pid, capNum, msg.payload);
          toast.success("Progreso guardado");
        } catch (err) {
          toast.error(err instanceof Error ? err.message : "Error al guardar");
        } finally {
          setSaving(false);
        }
      }

      if (msg.type === "LEE_EXIT") {
        navigate({ to: "/app/clientes/$clienteId/lee", params: { clienteId } });
      }
    };

    window.addEventListener("message", handler);
    return () => window.removeEventListener("message", handler);
  }, [capNum, clienteId, navigate]);

  const volver = () =>
    navigate({ to: "/app/clientes/$clienteId/lee", params: { clienteId } });

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-cream">
        <div className="font-display text-navy text-xl animate-pulse">Cargando capítulo…</div>
      </div>
    );
  }

  if (bloqueado || isNaN(capNum) || capNum < 1 || capNum > 10) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen bg-cream gap-4">
        <div className="text-navy font-display text-2xl">Capítulo no disponible</div>
        <p className="text-sm text-muted-foreground">
          Este capítulo aún no está desbloqueado para este cliente.
        </p>
        <button
          onClick={volver}
          className="flex items-center gap-2 text-sm text-navy underline"
        >
          <ArrowLeft className="w-4 h-4" /> Volver al programa LEE
        </button>
      </div>
    );
  }

  return (
    <div className="flex flex-col" style={{ height: "100vh" }}>
      {/* Barra superior mínima */}
      <div
        className="flex items-center justify-between px-4 shrink-0"
        style={{
          height: "48px",
          background: "#0f1b3d",
          borderBottom: "3px solid #c9a84c",
        }}
      >
        <button
          onClick={volver}
          className="flex items-center gap-2 text-sm text-white/80 hover:text-white"
        >
          <ArrowLeft className="w-4 h-4" />
          Volver al programa
        </button>
        <div className="font-display text-white text-sm">
          LEE · Capítulo {String(capNum).padStart(2, "0")}
        </div>
        {saving && (
          <div className="flex items-center gap-1 text-xs text-white/60">
            <Save className="w-3 h-3 animate-pulse" /> Guardando…
          </div>
        )}
        {!saving && <div style={{ width: "80px" }} />}
      </div>

      {/* Iframe a pantalla completa */}
      <iframe
        ref={iframeRef}
        src={iframeUrl}
        title={`LEE Capítulo ${capNum}`}
        style={{ flex: 1, border: "none", width: "100%" }}
        allow="fullscreen"
      />
    </div>
  );
}
