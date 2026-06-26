import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";

interface AppSettings {
  company_name: string;
  app_name: string;
  logo_url: string | null;
  primary_color: string;
  accent_color: string;
  font_family: string;
}

interface Props {
  settings: AppSettings;
}

function Toggle({
  label,
  sub,
  value,
  onChange,
}: {
  label: string;
  sub: string;
  value: boolean;
  onChange: (v: boolean) => void;
}) {
  return (
    <div
      style={{
        display: "flex",
        alignItems: "center",
        justifyContent: "space-between",
        padding: "16px 0",
        borderBottom: "1px solid #F0F4FF",
        gap: "16px",
      }}
    >
      <div>
        <div style={{ fontSize: "15px", fontWeight: 600, color: "#374151" }}>{label}</div>
        <div style={{ fontSize: "13px", color: "#94A3B8", marginTop: "3px", lineHeight: 1.5 }}>
          {sub}
        </div>
      </div>
      <div
        role="switch"
        aria-checked={value}
        tabIndex={0}
        onClick={() => onChange(!value)}
        onKeyDown={(e) => e.key === "Enter" && onChange(!value)}
        style={{
          width: "46px",
          height: "26px",
          borderRadius: "999px",
          background: value ? "linear-gradient(135deg, #0EA5E9, #6366F1)" : "#E0E7FF",
          position: "relative",
          cursor: "pointer",
          transition: "all 0.2s",
          flexShrink: 0,
          outline: "none",
        }}
      >
        <div
          style={{
            width: "20px",
            height: "20px",
            borderRadius: "50%",
            background: "white",
            position: "absolute",
            top: "3px",
            left: value ? "23px" : "3px",
            transition: "all 0.2s",
            boxShadow: "0 2px 6px rgba(0,0,0,0.15)",
          }}
        />
      </div>
    </div>
  );
}

const configInput: React.CSSProperties = {
  width: "100%",
  padding: "13px 18px",
  border: "1.5px solid #E0E7FF",
  borderRadius: "11px",
  fontSize: "16px",
  fontFamily: "inherit",
  outline: "none",
  transition: "all 0.15s",
  color: "#1E293B",
};

const configLabel: React.CSSProperties = {
  fontSize: "14px",
  fontWeight: 700,
  color: "#374151",
  marginBottom: "9px",
  display: "block",
};

const configHint: React.CSSProperties = {
  fontSize: "13px",
  color: "#94A3B8",
  marginTop: "6px",
  fontStyle: "italic",
};

const card: React.CSSProperties = {
  background: "white",
  borderRadius: "20px",
  border: "1px solid #E0E7FF",
  padding: "32px",
};

const cardTitle: React.CSSProperties = {
  fontSize: "20px",
  fontWeight: 800,
  color: "#0C4A6E",
  marginBottom: "24px",
  display: "flex",
  alignItems: "center",
  gap: "10px",
};

const btn: React.CSSProperties = {
  padding: "13px 22px",
  borderRadius: "10px",
  background: "linear-gradient(135deg, #0EA5E9, #6366F1)",
  color: "white",
  fontSize: "14px",
  fontWeight: 700,
  border: "none",
  cursor: "pointer",
  boxShadow: "0 4px 14px rgba(14,165,233,0.3)",
  marginTop: "8px",
};

const FONTS = ["DM Sans", "Inter", "Poppins", "Georgia", "Courier New"];
const THEMES = [
  { name: "Aurora V2", gradient: "linear-gradient(135deg,#0C4A6E,#6366F1)" },
  { name: "Índigo Elite", gradient: "linear-gradient(135deg,#1E1B4B,#6366F1)" },
  { name: "Editorial Premium", gradient: "linear-gradient(135deg,#1a1a1a,#C9A84C)" },
];
const SWATCHES = ["#0EA5E9", "#6366F1", "#1D9E75", "#D85A30", "#7F77DD", "#BA7517"];

export default function AdminConfiguracion({ settings }: Props) {
  const [companyName, setCompanyName] = useState(settings.company_name);
  const [appName, setAppName] = useState(settings.app_name);
  const [primaryColor, setPrimaryColor] = useState(settings.primary_color);
  const [fontFamily, setFontFamily] = useState(settings.font_family);
  const [logoTab, setLogoTab] = useState(0);
  const [activeTheme, setActiveTheme] = useState(0);
  const [fontSize, setFontSize] = useState("17px");
  const [lineHeight, setLineHeight] = useState("1.85");
  const [copyright, setCopyright] = useState(
    `© ${new Date().getFullYear()} ${settings.company_name}. Todos los derechos reservados.`,
  );
  const [confidencial, setConfidencial] = useState(
    "Este documento contiene información confidencial y propietaria. Queda prohibida su reproducción sin autorización expresa.",
  );
  const [aiModel, setAiModel] = useState("claude-sonnet-4-6");
  const [sec2fa, setSec2fa] = useState(true);
  const [secPublic, setSecPublic] = useState(false);
  const [secAuto, setSecAuto] = useState(true);
  const [secLog, setSecLog] = useState(true);
  const [aiCoaching, setAiCoaching] = useState(true);
  const [aiSintesis, setAiSintesis] = useState(true);
  const [aiSide, setAiSide] = useState(true);
  const [saving, setSaving] = useState<string | null>(null);

  const save = async (section: string) => {
    setSaving(section);
    try {
      await supabase
        .from("app_settings")
        .update({
          company_name: companyName,
          app_name: appName,
          primary_color: primaryColor,
          font_family: fontFamily,
        })
        .eq("id", "global");
    } catch (_e) {
      // ignore errors in UI
    }
    setTimeout(() => setSaving(null), 1500);
  };

  return (
    <div
      style={{
        display: "grid",
        gridTemplateColumns: "1fr 1fr",
        gap: "24px",
      }}
    >
      {/* LOGO Y MARCA */}
      <div style={card}>
        <div style={cardTitle}>🖼️ Logo y marca</div>
        <div style={{ display: "flex", gap: "8px", marginBottom: "18px" }}>
          {["Logo principal", "Logo oscuro", "Favicon"].map((t, i) => (
            <button
              key={t}
              onClick={() => setLogoTab(i)}
              style={{
                padding: "8px 16px",
                borderRadius: "8px",
                fontSize: "13px",
                fontWeight: 700,
                border: "1.5px solid",
                borderColor: logoTab === i ? "#0EA5E9" : "#E0E7FF",
                background: logoTab === i ? "#EFF6FF" : "white",
                color: logoTab === i ? "#0EA5E9" : "#64748B",
                cursor: "pointer",
              }}
            >
              {t}
            </button>
          ))}
        </div>
        <div
          style={{
            border: "2px dashed #BAE6FD",
            borderRadius: "14px",
            padding: "32px",
            textAlign: "center",
            cursor: "pointer",
            background: "#F8FAFF",
            marginBottom: "10px",
          }}
        >
          <div
            style={{
              width: "80px",
              height: "80px",
              borderRadius: "12px",
              background: "linear-gradient(135deg, #0C4A6E, #1E3A8A)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              fontSize: "20px",
              fontWeight: 900,
              color: "white",
              margin: "0 auto 12px",
            }}
          >
            A360
          </div>
          <div style={{ fontSize: "15px", fontWeight: 700, color: "#0EA5E9", marginBottom: "4px" }}>
            Subir nuevo logo
          </div>
          <div style={{ fontSize: "13px", color: "#94A3B8" }}>
            PNG · SVG · JPG · Máx 2MB · Recomendado 200×60px
          </div>
        </div>
        <div style={configHint}>
          El logo aparece en el topbar, reportes exportados y documentos PDF.
        </div>
        <div style={{ height: "1px", background: "linear-gradient(90deg,transparent,#C7D2FE,transparent)", margin: "22px 0" }} />
        <div style={{ marginBottom: "22px" }}>
          <label style={configLabel}>Nombre de la plataforma</label>
          <input
            style={configInput}
            value={companyName}
            onChange={(e) => setCompanyName(e.target.value)}
          />
        </div>
        <div style={{ marginBottom: "22px" }}>
          <label style={configLabel}>Tagline / Subtítulo</label>
          <input
            style={configInput}
            value={appName}
            onChange={(e) => setAppName(e.target.value)}
          />
        </div>
        <button onClick={() => save("marca")} style={btn}>
          {saving === "marca" ? "✓ Guardado" : "Guardar cambios"}
        </button>
      </div>

      {/* TIPOGRAFÍA */}
      <div style={card}>
        <div style={cardTitle}>🔤 Tipografía</div>
        <div style={{ marginBottom: "22px" }}>
          <label style={configLabel}>Fuente principal</label>
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "1fr 1fr",
              gap: "12px",
              marginBottom: "16px",
            }}
          >
            {FONTS.map((f) => (
              <div
                key={f}
                onClick={() => setFontFamily(f)}
                role="button"
                tabIndex={0}
                onKeyDown={(e) => e.key === "Enter" && setFontFamily(f)}
                style={{
                  border: "2px solid",
                  borderColor: fontFamily === f ? "#0EA5E9" : "#E0E7FF",
                  borderRadius: "12px",
                  padding: "16px",
                  cursor: "pointer",
                  background: fontFamily === f ? "#EFF6FF" : "white",
                  textAlign: "center",
                  outline: "none",
                }}
              >
                <div style={{ fontSize: "15px", fontWeight: 700, color: "#0C4A6E", fontFamily: f, marginBottom: "4px" }}>
                  {f}
                </div>
                <div style={{ fontSize: "13px", color: "#64748B", fontFamily: f }}>
                  El liderazgo transforma
                </div>
              </div>
            ))}
          </div>
          <input
            style={configInput}
            placeholder="URL de Google Fonts (opcional)"
          />
          <div style={configHint}>Ej: https://fonts.googleapis.com/css2?family=Poppins</div>
        </div>
        <div style={{ marginBottom: "22px" }}>
          <label style={configLabel}>Tamaño base de texto</label>
          <input
            style={configInput}
            value={fontSize}
            onChange={(e) => setFontSize(e.target.value)}
          />
          <div style={configHint}>Recomendado: 16px–18px. Afecta toda la plataforma.</div>
        </div>
        <div style={{ marginBottom: "22px" }}>
          <label style={configLabel}>Interlineado (line-height)</label>
          <input
            style={configInput}
            value={lineHeight}
            onChange={(e) => setLineHeight(e.target.value)}
          />
          <div style={configHint}>Recomendado: 1.75–1.95 para buena legibilidad.</div>
        </div>
        <button onClick={() => save("tipografia")} style={btn}>
          {saving === "tipografia" ? "✓ Guardado" : "Guardar tipografía"}
        </button>
      </div>

      {/* COLORES Y TEMA */}
      <div style={card}>
        <div style={cardTitle}>🎨 Colores y tema</div>
        <div style={{ marginBottom: "22px" }}>
          <label style={configLabel}>Tema visual</label>
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(3, 1fr)",
              gap: "12px",
              marginBottom: "16px",
            }}
          >
            {THEMES.map((t, i) => (
              <div
                key={t.name}
                role="button"
                tabIndex={0}
                onClick={() => setActiveTheme(i)}
                onKeyDown={(e) => e.key === "Enter" && setActiveTheme(i)}
                style={{
                  border: "2px solid",
                  borderColor: activeTheme === i ? "#0EA5E9" : "#E0E7FF",
                  borderRadius: "12px",
                  padding: "16px",
                  cursor: "pointer",
                  background: activeTheme === i ? "#EFF6FF" : "white",
                  outline: "none",
                }}
              >
                <div
                  style={{
                    height: "48px",
                    borderRadius: "8px",
                    background: t.gradient,
                    marginBottom: "10px",
                  }}
                />
                <div style={{ fontSize: "14px", fontWeight: 700, color: "#0C4A6E" }}>
                  {t.name}
                </div>
              </div>
            ))}
          </div>
        </div>
        <div style={{ marginBottom: "22px" }}>
          <label style={configLabel}>Color primario</label>
          <div style={{ display: "flex", gap: "10px", marginBottom: "12px", flexWrap: "wrap" }}>
            {SWATCHES.map((c) => (
              <div
                key={c}
                role="button"
                tabIndex={0}
                onClick={() => setPrimaryColor(c)}
                onKeyDown={(e) => e.key === "Enter" && setPrimaryColor(c)}
                title={c}
                style={{
                  width: "42px",
                  height: "42px",
                  borderRadius: "10px",
                  background: c,
                  cursor: "pointer",
                  border: primaryColor === c ? `3px solid #0C4A6E` : "3px solid transparent",
                  transform: primaryColor === c ? "scale(1.1)" : undefined,
                  transition: "all 0.15s",
                  outline: "none",
                }}
              />
            ))}
          </div>
          <div style={{ display: "flex", gap: "10px", alignItems: "center" }}>
            <div
              style={{
                width: "44px",
                height: "44px",
                borderRadius: "10px",
                background: primaryColor,
                border: "1.5px solid #E0E7FF",
                flexShrink: 0,
              }}
            />
            <input
              style={{ ...configInput, flex: 1 }}
              value={primaryColor}
              onChange={(e) => setPrimaryColor(e.target.value)}
            />
          </div>
        </div>
        <button onClick={() => save("colores")} style={btn}>
          {saving === "colores" ? "✓ Guardado" : "Guardar colores"}
        </button>
      </div>

      {/* DERECHOS Y LEGAL */}
      <div style={card}>
        <div style={cardTitle}>⚖️ Derechos y aspectos legales</div>
        <div style={{ marginBottom: "22px" }}>
          <label style={configLabel}>Texto de copyright</label>
          <input
            style={configInput}
            value={copyright}
            onChange={(e) => setCopyright(e.target.value)}
          />
          <div style={configHint}>
            Aparece en el pie de página y en documentos exportados.
          </div>
        </div>
        <div style={{ marginBottom: "22px" }}>
          <label style={configLabel}>Aviso de confidencialidad (documentos exportados)</label>
          <textarea
            style={{ ...configInput, minHeight: "90px", resize: "vertical", lineHeight: "1.75" }}
            value={confidencial}
            onChange={(e) => setConfidencial(e.target.value)}
          />
        </div>
        <div style={{ marginBottom: "22px" }}>
          <label style={configLabel}>Enlace — Términos y condiciones</label>
          <input style={configInput} placeholder="https://a360sgp.com/terminos" />
        </div>
        <div style={{ marginBottom: "22px" }}>
          <label style={configLabel}>Enlace — Política de privacidad</label>
          <input style={configInput} placeholder="https://a360sgp.com/privacidad" />
        </div>
        <button onClick={() => save("legal")} style={btn}>
          {saving === "legal" ? "✓ Guardado" : "Guardar configuración legal"}
        </button>
      </div>

      {/* SEGURIDAD */}
      <div style={card}>
        <div style={cardTitle}>🔐 Seguridad</div>
        <Toggle
          label="Autenticación de 2 factores (2FA)"
          sub="Requerir 2FA para todos los administradores"
          value={sec2fa}
          onChange={setSec2fa}
        />
        <Toggle
          label="Registro público"
          sub="Permitir que nuevos usuarios se registren sin invitación"
          value={secPublic}
          onChange={setSecPublic}
        />
        <Toggle
          label="Cierre de sesión automático"
          sub="Cerrar sesión tras 8 horas de inactividad"
          value={secAuto}
          onChange={setSecAuto}
        />
        <div style={{ borderBottom: "none" }}>
          <Toggle
            label="Log de auditoría"
            sub="Registrar todas las acciones de administradores"
            value={secLog}
            onChange={setSecLog}
          />
        </div>
      </div>

      {/* INTELIGENCIA ARTIFICIAL */}
      <div style={card}>
        <div style={cardTitle}>🤖 Inteligencia Artificial</div>
        <Toggle
          label="Análisis IA en sesiones de coaching"
          sub="Generar análisis automáticos con Claude al cerrar cada sesión"
          value={aiCoaching}
          onChange={setAiCoaching}
        />
        <Toggle
          label="Síntesis ejecutiva del programa"
          sub="Generar síntesis global del programa de coaching"
          value={aiSintesis}
          onChange={setAiSintesis}
        />
        <Toggle
          label="Análisis SIDE con IA"
          sub="Generar recomendaciones automáticas del diagnóstico empresarial"
          value={aiSide}
          onChange={setAiSide}
        />
        <div
          style={{
            height: "1px",
            background: "linear-gradient(90deg,transparent,#C7D2FE,transparent)",
            margin: "22px 0",
          }}
        />
        <div style={{ marginBottom: "22px" }}>
          <label style={configLabel}>Modelo de IA</label>
          <input
            style={configInput}
            value={aiModel}
            onChange={(e) => setAiModel(e.target.value)}
          />
          <div style={configHint}>
            Modelo de Claude utilizado para todos los análisis de la plataforma.
          </div>
        </div>
        <button onClick={() => save("ia")} style={btn}>
          {saving === "ia" ? "✓ Guardado" : "Guardar configuración IA"}
        </button>
      </div>
    </div>
  );
}
