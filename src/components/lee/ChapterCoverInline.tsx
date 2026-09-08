import { useEffect, useRef, useState } from "react";
import { getCover } from "@/lib/lee-catalogo";
import { supabase } from "@/integrations/supabase/client";

// ── Estilos inline (replican el CSS canónico del .cv-wrap en los 10 HTMLs) ──────

const badge: React.CSSProperties = {
  display: "inline-flex",
  alignItems: "center",
  background: "rgba(14,165,233,0.15)",
  border: "1.5px solid rgba(14,165,233,0.35)",
  color: "#7DD3FC",
  padding: ".35rem .85rem",
  borderRadius: "20px",
  fontSize: "11.5px",
  fontWeight: 700,
  letterSpacing: ".07em",
  marginBottom: "0.65rem",
};

const ttl: React.CSSProperties = {
  fontFamily: "'Playfair Display', Georgia, serif",
  fontSize: "clamp(26px, 3vw, 40px)",
  lineHeight: 1.08,
  fontWeight: 800,
  color: "#fff",
  margin: "0 0 0.7rem",
  letterSpacing: "-.02em",
};

const ttlEm: React.CSSProperties = {
  color: "#FCD34D",
  fontStyle: "normal",
};

const sub: React.CSSProperties = {
  fontSize: "14px",
  lineHeight: 1.7,
  color: "rgba(255,255,255,0.75)",
  marginBottom: "0.9rem",
};

const pillsWrap: React.CSSProperties = {
  display: "flex",
  flexWrap: "wrap",
  gap: ".5rem",
  marginBottom: "1.1rem",
};

const pill: React.CSSProperties = {
  display: "inline-flex",
  alignItems: "center",
  background: "rgba(255,255,255,0.08)",
  border: "1.5px solid rgba(255,255,255,0.18)",
  color: "rgba(255,255,255,0.88)",
  padding: ".3rem .75rem",
  borderRadius: "20px",
  fontSize: "12.5px",
  fontWeight: 600,
  letterSpacing: ".02em",
  whiteSpace: "nowrap",
};

const btnP: React.CSSProperties = {
  background: "linear-gradient(135deg, #0EA5E9, #3B82F6)",
  color: "#fff",
  border: "none",
  borderRadius: "10px",
  padding: ".7rem 1.6rem",
  fontSize: "14px",
  fontWeight: 700,
  cursor: "pointer",
  transition: "opacity .18s",
};

const panel: React.CSSProperties = {
  background: "rgba(255,255,255,0.07)",
  border: "1.5px solid rgba(255,255,255,0.12)",
  borderRadius: "16px",
  padding: "1rem",
  display: "flex",
  flexDirection: "column",
  gap: ".6rem",
};

const panelTitle: React.CSSProperties = {
  fontSize: "12px",
  fontWeight: 800,
  letterSpacing: ".12em",
  textTransform: "uppercase",
  color: "rgba(255,255,255,0.5)",
};

const logoDrop: React.CSSProperties = {
  background: "rgba(255,255,255,0.05)",
  border: "2px dashed rgba(255,255,255,0.2)",
  borderRadius: "10px",
  height: "58px",
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
  cursor: "pointer",
  overflow: "hidden",
  flexShrink: 0,
  transition: "border-color .18s",
};

const fg: React.CSSProperties = {
  display: "flex",
  flexDirection: "column",
  gap: ".2rem",
};

const fl: React.CSSProperties = {
  fontSize: "11px",
  fontWeight: 700,
  letterSpacing: ".07em",
  textTransform: "uppercase",
  color: "rgba(255,255,255,0.45)",
};

const fi: React.CSSProperties = {
  background: "rgba(255,255,255,0.07)",
  border: "1.5px solid rgba(255,255,255,0.15)",
  borderRadius: "8px",
  padding: ".55rem .75rem",
  fontSize: "13.5px",
  color: "#fff",
  outline: "none",
  fontFamily: "inherit",
  width: "100%",
  boxSizing: "border-box",
  transition: "border-color .18s",
};

const footer: React.CSSProperties = {
  marginTop: "auto",
  paddingTop: "1rem",
  borderTop: "1.5px solid rgba(255,255,255,0.12)",
};

const footerLabel: React.CSSProperties = {
  fontSize: "10px",
  letterSpacing: "2px",
  textTransform: "uppercase",
  color: "rgba(255,255,255,0.4)",
  marginBottom: ".3rem",
};

const footerProg: React.CSSProperties = {
  fontSize: "1rem",
  fontWeight: 700,
  color: "#7DD3FC",
};

const footerSub: React.CSSProperties = {
  fontSize: "13px",
  color: "rgba(255,255,255,0.4)",
  marginTop: ".2rem",
};

// ── Utilidad: borde focus / blur en inputs inline ────────────────────────────

function focusBorder(e: React.FocusEvent<HTMLInputElement>) {
  e.currentTarget.style.borderColor = "rgba(14,165,233,0.6)";
}
function blurBorder(e: React.FocusEvent<HTMLInputElement>) {
  e.currentTarget.style.borderColor = "rgba(255,255,255,0.15)";
}

// ── Componente ────────────────────────────────────────────────────────────────

interface Props {
  chapter: number;
  clienteId: string;
  onEnterChapter: () => void;
  sesionesGuardadas?: number;
  totalSesiones?: number;
}

export function ChapterCoverInline({ chapter, clienteId, onEnterChapter, sesionesGuardadas, totalSesiones }: Props) {
  const cover = getCover(chapter);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Responsive: 2 cols ≥768px, 1 col en móvil (no puede usarse Tailwind porque
  // el gridTemplateColumns viene de inline style — usamos ResizeObserver ligero)
  const [isWide, setIsWide] = useState(() =>
    typeof window !== "undefined" ? window.innerWidth >= 768 : true,
  );
  useEffect(() => {
    const onResize = () => setIsWide(window.innerWidth >= 768);
    window.addEventListener("resize", onResize, { passive: true });
    return () => window.removeEventListener("resize", onResize);
  }, []);

  // Logo — object URL efímero (sin persistencia a Storage)
  const [logoUrl, setLogoUrl] = useState("");

  // Panel participante — estado local con pre-fill desde Supabase
  const [nombre, setNombre] = useState("");
  const [empresa, setEmpresa] = useState("");
  const [sector, setSector] = useState("");
  const [fecha, setFecha] = useState("");
  const [coach, setCoach] = useState("Antonio Campaña · A360SGP");

  useEffect(() => {
    supabase
      .from("clientes")
      .select("nombre_empresa, sector")
      .eq("id", clienteId)
      .maybeSingle()
      .then(({ data }) => {
        if (data?.nombre_empresa) setEmpresa(String(data.nombre_empresa));
        if (data?.sector) setSector(String(data.sector));
      });
  }, [clienteId]);

  // Libera object URL al desmontar
  useEffect(() => {
    return () => {
      if (logoUrl) URL.revokeObjectURL(logoUrl);
    };
  }, [logoUrl]);

  const handleLogoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setLogoUrl((prev) => {
      if (prev) URL.revokeObjectURL(prev);
      return URL.createObjectURL(file);
    });
  };

  if (!cover) return null;

  const wrapStyle: React.CSSProperties = {
    minHeight: "100%",
    display: "grid",
    gridTemplateColumns: isWide ? "1fr 1fr" : "1fr",
    gap: "1.8rem",
    alignItems: "start",
    background: "linear-gradient(135deg, #0C4A6E 0%, #1E3A8A 60%, #312E81 100%)",
    borderRadius: "0 0 32px 32px",
    padding: isWide ? "32px 36px" : "24px 18px",
    boxSizing: "border-box",
  };

  return (
    // Mismo slot que el iframe: flex-1 min-h-0 w-full overflow-y-auto
    <div className="absolute inset-0 z-10 overflow-y-auto">
      <div style={wrapStyle}>

        {/* ── Columna izquierda: contenido del capítulo ── */}
        <div>
          <div style={badge}>{cover.badge}</div>

          <h1 style={ttl}>
            {cover.titleInline ? (
              <>
                {cover.titleLine1}{" "}
                <em style={ttlEm}>{cover.titleLine2Em}</em>
              </>
            ) : (
              <>
                {cover.titleLine1}
                <br />
                <em style={ttlEm}>{cover.titleLine2Em}</em>
              </>
            )}
          </h1>

          <p style={sub}>{cover.subtitulo}</p>

          <div style={pillsWrap}>
            {cover.pills.map((p, i) => (
              <span key={i} style={pill}>
                {p}
              </span>
            ))}
          </div>

          <button
            style={btnP}
            onClick={onEnterChapter}
            onMouseEnter={(e) => (e.currentTarget.style.opacity = ".82")}
            onMouseLeave={(e) => (e.currentTarget.style.opacity = "1")}
          >
            Comenzar el capítulo →
          </button>

          {totalSesiones !== undefined && totalSesiones > 0 && (
            <div style={{ marginTop: "0.85rem", fontSize: "12.5px", color: "rgba(255,255,255,0.55)", display: "flex", alignItems: "center", gap: "0.4rem" }}>
              <span>📊</span>
              <span>
                <strong style={{ color: sesionesGuardadas! > 0 ? "#6EE7B7" : "rgba(255,255,255,0.55)" }}>
                  {sesionesGuardadas} de {totalSesiones}
                </strong>{" "}
                sesiones con trabajo guardado
              </span>
            </div>
          )}
        </div>

        {/* ── Columna derecha: panel participante unificado (10 caps) ── */}
        <div style={panel}>
          <div style={panelTitle}>Datos del participante</div>

          {/* Logo — upload efímero, sin Storage */}
          <div
            style={logoDrop}
            onClick={() => fileInputRef.current?.click()}
            onMouseEnter={(e) =>
              (e.currentTarget.style.borderColor = "rgba(255,255,255,0.4)")
            }
            onMouseLeave={(e) =>
              (e.currentTarget.style.borderColor = "rgba(255,255,255,0.2)")
            }
            title="Haz clic para subir el logo de la empresa"
          >
            {logoUrl ? (
              <img
                src={logoUrl}
                alt="Logo"
                style={{ maxHeight: "72px", maxWidth: "100%", objectFit: "contain" }}
              />
            ) : (
              <div style={{ textAlign: "center" }}>
                <div style={{ fontSize: "1.6rem", marginBottom: ".3rem" }}>🏢</div>
                <div
                  style={{
                    fontSize: "12px",
                    color: "rgba(255,255,255,0.5)",
                    lineHeight: 1.4,
                  }}
                >
                  Logo de la empresa
                  <br />
                  <span style={{ fontSize: "11px", fontWeight: 400 }}>
                    PNG · JPG · SVG
                  </span>
                </div>
              </div>
            )}
          </div>
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            onChange={handleLogoChange}
            style={{ display: "none" }}
          />

          <div style={fg}>
            <label style={fl}>Nombre del participante</label>
            <input
              style={fi}
              value={nombre}
              onChange={(e) => setNombre(e.target.value)}
              placeholder="Nombre completo"
              onFocus={focusBorder}
              onBlur={blurBorder}
            />
          </div>

          <div style={fg}>
            <label style={fl}>Empresa</label>
            <input
              style={fi}
              value={empresa}
              onChange={(e) => setEmpresa(e.target.value)}
              placeholder="Nombre de la empresa"
              onFocus={focusBorder}
              onBlur={blurBorder}
            />
          </div>

          <div style={fg}>
            <label style={fl}>Sector / Industria</label>
            <input
              style={fi}
              value={sector}
              onChange={(e) => setSector(e.target.value)}
              placeholder="Ej: Comercio · Servicios · Manufactura"
              onFocus={focusBorder}
              onBlur={blurBorder}
            />
          </div>

          <div style={fg}>
            <label style={fl}>Fecha de inicio</label>
            <input
              type="date"
              style={fi}
              value={fecha}
              onChange={(e) => setFecha(e.target.value)}
              onFocus={focusBorder}
              onBlur={blurBorder}
            />
          </div>

          <div style={fg}>
            <label style={fl}>Coach / Facilitador</label>
            <input
              style={fi}
              value={coach}
              onChange={(e) => setCoach(e.target.value)}
              placeholder="Nombre del coach"
              onFocus={focusBorder}
              onBlur={blurBorder}
            />
          </div>

          <div style={footer}>
            <div style={footerLabel}>Programa</div>
            <div style={footerProg}>Liderazgo Empresarial Evolutivo · LEE</div>
            <div style={footerSub}>Aceleradora 360 · A360 SP · Ecuador</div>
          </div>
        </div>

      </div>
    </div>
  );
}
