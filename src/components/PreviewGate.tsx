import { useNavigate } from "@tanstack/react-router";
import { useAuth } from "@/lib/auth-context";
import { Lock, ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";

interface Props {
  moduleName: string;
  moduleDescription: string;
  moduleIcon: React.ReactNode;
  previewContent: React.ReactNode;
  children: React.ReactNode;
}

export function PreviewGate({ moduleName, moduleDescription, moduleIcon, previewContent, children }: Props) {
  const { user, loading } = useAuth();
  const navigate = useNavigate();

  if (loading) {
    return (
      <div style={{ minHeight: "60vh", display: "flex", alignItems: "center", justifyContent: "center" }}>
        <div className="font-display text-navy text-xl animate-pulse">Cargando…</div>
      </div>
    );
  }

  if (user) return <>{children}</>;

  return (
    <div
      className="-mx-6 -mt-6 lg:-mx-8 lg:-mt-8"
      style={{ minHeight: "calc(100vh - 64px)", display: "flex", flexDirection: "column" }}
    >
      {/* Gradient header */}
      <div
        style={{
          background: "linear-gradient(135deg, var(--h-from) 0%, var(--h-to) 100%)",
          padding: "40px 48px 44px",
          flexShrink: 0,
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: "16px", marginBottom: "14px" }}>
          <div
            style={{
              width: "52px", height: "52px", borderRadius: "14px",
              background: "rgba(255,255,255,0.15)",
              display: "flex", alignItems: "center", justifyContent: "center",
              fontSize: "26px", flexShrink: 0,
            }}
          >
            {moduleIcon}
          </div>
          <div>
            <div style={{ fontSize: "11px", fontWeight: 700, color: "rgba(255,255,255,0.5)", textTransform: "uppercase", letterSpacing: "0.14em", marginBottom: "4px" }}>
              Vista previa limitada
            </div>
            <h1 style={{ fontSize: "clamp(1.4rem, 3vw, 2rem)", fontWeight: 900, color: "white", letterSpacing: "-0.03em", margin: 0 }}>
              {moduleName}
            </h1>
          </div>
        </div>
        <p style={{ fontSize: "15px", color: "rgba(255,255,255,0.65)", lineHeight: 1.7, maxWidth: "540px", margin: "0 0 16px" }}>
          {moduleDescription}
        </p>
        <div
          style={{
            display: "inline-flex", alignItems: "center", gap: "6px",
            background: "rgba(255,255,255,0.10)", border: "1px solid rgba(255,255,255,0.18)",
            borderRadius: "999px", padding: "5px 14px",
            fontSize: "12px", color: "rgba(255,255,255,0.65)",
          }}
        >
          <Lock size={11} />
          Inicia sesión para ver el módulo completo
        </div>
      </div>

      {/* Preview content with fade overlay */}
      <div style={{ flex: 1, position: "relative" }}>
        {previewContent}
        {/* Fade-out overlay — blurs/hides bottom of preview content */}
        <div
          style={{
            position: "absolute",
            bottom: 0, left: 0, right: 0,
            height: "160px",
            background: "linear-gradient(to bottom, rgba(255,255,255,0) 0%, rgba(255,255,255,0.96) 75%)",
            pointerEvents: "none",
          }}
        />
      </div>

      {/* Sticky bottom banner */}
      <div
        style={{
          position: "sticky",
          bottom: 0,
          zIndex: 30,
          background: "white",
          borderTop: "1px solid var(--border)",
          boxShadow: "0 -6px 24px rgba(12,74,110,0.08)",
          padding: "14px 24px",
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          gap: "16px",
          flexWrap: "wrap",
          flexShrink: 0,
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
          <div
            style={{
              width: "36px", height: "36px", borderRadius: "10px",
              background: "var(--acc2)", flexShrink: 0,
              display: "flex", alignItems: "center", justifyContent: "center",
            }}
          >
            <Lock size={16} style={{ color: "var(--h-from)" }} />
          </div>
          <div>
            <div style={{ fontSize: "14px", fontWeight: 600, color: "var(--h-from)" }}>
              Estás viendo una vista previa limitada
            </div>
            <div style={{ fontSize: "12px", color: "#64748B" }}>
              Inicia sesión para acceder al módulo completo de {moduleName}
            </div>
          </div>
        </div>
        <Button
          className="text-white hover:opacity-90 transition-opacity font-semibold shrink-0"
          style={{ background: "var(--h-from)" }}
          onClick={() => void navigate({ to: "/login" })}
        >
          Acceder al módulo completo <ArrowRight className="w-4 h-4 ml-1.5" />
        </Button>
      </div>
    </div>
  );
}
