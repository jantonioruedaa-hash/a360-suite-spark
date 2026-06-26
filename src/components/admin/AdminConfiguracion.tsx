import React, { useState, useRef, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAppSettings } from "@/lib/app-settings";
import { toast } from "sonner";

// ─── Constants ────────────────────────────────────────────────────────────────

const FONTS = ["DM Sans", "Inter", "Poppins", "Montserrat"];

const THEMES = [
  { name: "Aurora V2",         gradient: "linear-gradient(135deg,#0C4A6E,#6366F1)", primary: "#0C4A6E", accent: "#6366F1" },
  { name: "Índigo Elite",      gradient: "linear-gradient(135deg,#1E1B4B,#6366F1)", primary: "#1E1B4B", accent: "#6366F1" },
  { name: "Editorial Premium", gradient: "linear-gradient(135deg,#1a1a1a,#C9A84C)", primary: "#1a1a1a", accent: "#C9A84C" },
];

const SWATCHES = ["#0EA5E9", "#6366F1", "#1D9E75", "#D85A30", "#7F77DD", "#BA7517"];

// ─── Shared styles ────────────────────────────────────────────────────────────

const configInput: React.CSSProperties = {
  width: "100%",
  padding: "13px 18px",
  border: "1.5px solid #E0E7FF",
  borderRadius: "11px",
  fontSize: "15px",
  fontFamily: "inherit",
  outline: "none",
  transition: "border-color 0.15s",
  color: "#1E293B",
  boxSizing: "border-box",
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

const divider: React.CSSProperties = {
  height: "1px",
  background: "linear-gradient(90deg,transparent,#C7D2FE,transparent)",
  margin: "22px 0",
};

const saveBtn = (saving: boolean): React.CSSProperties => ({
  padding: "13px 22px",
  borderRadius: "10px",
  background: saving ? "#94A3B8" : "linear-gradient(135deg, #0EA5E9, #6366F1)",
  color: "white",
  fontSize: "14px",
  fontWeight: 700,
  border: "none",
  cursor: saving ? "not-allowed" : "pointer",
  boxShadow: saving ? "none" : "0 4px 14px rgba(14,165,233,0.3)",
  marginTop: "8px",
  transition: "all 0.2s",
});

// ─── Toggle helper ────────────────────────────────────────────────────────────

function ToggleRow({
  label,
  sub,
  value,
  onChange,
  last,
}: {
  label: string;
  sub: string;
  value: boolean;
  onChange: (v: boolean) => void;
  last?: boolean;
}) {
  return (
    <div
      style={{
        display: "flex",
        alignItems: "center",
        justifyContent: "space-between",
        padding: "16px 0",
        borderBottom: last ? "none" : "1px solid #F0F4FF",
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
            transition: "left 0.2s",
            boxShadow: "0 2px 6px rgba(0,0,0,0.15)",
          }}
        />
      </div>
    </div>
  );
}

// ─── Main component ───────────────────────────────────────────────────────────

export default function AdminConfiguracion() {
  const { settings, refresh } = useAppSettings();

  // Read content_strings as a plain object for extended config
  const cs = settings.content_strings as unknown as Record<string, unknown>;

  // ── Section: Marca ──────────────────────────────────────────────────────────
  const [companyName, setCompanyName] = useState(settings.company_name);
  const [appName, setAppName]         = useState(settings.app_name);
  const [logoTab, setLogoTab]         = useState(0);
  const [logoPreview, setLogoPreview] = useState<string | null>(settings.logo_url);
  const [logoUploading, setLogoUploading] = useState(false);
  const [dragOver, setDragOver]       = useState(false);
  const fileInputRef                  = useRef<HTMLInputElement>(null);
  const [savingMarca, setSavingMarca] = useState(false);

  // ── Section: Tipografía ─────────────────────────────────────────────────────
  const [fontFamily, setFontFamily]   = useState(settings.font_family ?? "DM Sans");
  const [fontSize, setFontSize]       = useState((cs.font_size as string) ?? "17px");
  const [lineHeight, setLineHeight]   = useState((cs.line_height as string) ?? "1.85");
  const [googleFontUrl, setGoogleFontUrl] = useState((cs.google_fonts_url as string) ?? "");
  const [savingFont, setSavingFont]   = useState(false);

  // ── Section: Colores ────────────────────────────────────────────────────────
  const [primaryColor, setPrimaryColor] = useState(settings.primary_color ?? "#0C4A6E");
  const [accentColor, setAccentColor]   = useState(settings.accent_color ?? "#6366F1");
  const [activeTheme, setActiveTheme]   = useState<number>((cs.active_theme as number) ?? 0);
  const [savingColor, setSavingColor]   = useState(false);

  // ── Section: Legal ──────────────────────────────────────────────────────────
  const [copyright, setCopyright]       = useState(
    (cs.copyright as string) ?? `© ${new Date().getFullYear()} ${settings.company_name}. Todos los derechos reservados.`,
  );
  const [confidencial, setConfidencial] = useState(
    (cs.confidencial as string) ?? "Este documento contiene información confidencial y propietaria.",
  );
  const [terminosUrl, setTerminosUrl]   = useState((cs.terminos_url as string) ?? "");
  const [privacidadUrl, setPrivacidadUrl] = useState((cs.privacidad_url as string) ?? "");
  const [savingLegal, setSavingLegal]   = useState(false);

  // ── Section: Seguridad ──────────────────────────────────────────────────────
  const [sec2fa, setSec2fa]         = useState((cs.sec_2fa as boolean) ?? true);
  const [secPublic, setSecPublic]   = useState((cs.sec_public_reg as boolean) ?? false);
  const [secAuto, setSecAuto]       = useState((cs.sec_auto_logout as boolean) ?? true);
  const [secLog, setSecLog]         = useState((cs.sec_audit_log as boolean) ?? true);
  const [savingSec, setSavingSec]   = useState(false);

  // ── Section: IA ─────────────────────────────────────────────────────────────
  const [aiCoaching, setAiCoaching] = useState((cs.ai_coaching as boolean) ?? true);
  const [aiSintesis, setAiSintesis] = useState((cs.ai_sintesis as boolean) ?? true);
  const [aiSide, setAiSide]         = useState((cs.ai_side as boolean) ?? true);
  const [aiModel, setAiModel]       = useState((cs.ai_model as string) ?? "claude-sonnet-4-6");
  const [savingIA, setSavingIA]     = useState(false);

  // ── Shared save helper ──────────────────────────────────────────────────────

  const mergeContentStrings = useCallback(async (keys: Record<string, unknown>) => {
    const { data: cur } = await supabase
      .from("app_settings")
      .select("content_strings")
      .eq("id", "global")
      .single();
    const existingCs =
      cur?.content_strings &&
      typeof cur.content_strings === "object" &&
      !Array.isArray(cur.content_strings)
        ? (cur.content_strings as Record<string, unknown>)
        : {};
    const { error } = await supabase
      .from("app_settings")
      .update({
        content_strings: JSON.parse(JSON.stringify({ ...existingCs, ...keys })),
      })
      .eq("id", "global");
    return error;
  }, []);

  // ── Logo upload ─────────────────────────────────────────────────────────────

  const handleLogoFile = async (file: File) => {
    if (file.size > 2 * 1024 * 1024) {
      toast.error("El archivo supera el límite de 2 MB");
      return;
    }
    setLogoUploading(true);
    try {
      const ext = file.name.split(".").pop() ?? "png";
      const bucketPath = `logos/logo-${logoTab === 0 ? "principal" : logoTab === 1 ? "oscuro" : "favicon"}.${ext}`;
      const { error: upErr } = await supabase.storage
        .from("branding")
        .upload(bucketPath, file, { upsert: true });
      if (upErr) throw upErr;
      const { data: urlData } = supabase.storage.from("branding").getPublicUrl(bucketPath);
      const { error: dbErr } = await supabase
        .from("app_settings")
        .update({ logo_url: urlData.publicUrl })
        .eq("id", "global");
      if (dbErr) throw dbErr;
      setLogoPreview(urlData.publicUrl);
      await refresh();
      toast.success("Logo actualizado correctamente");
    } catch (e) {
      toast.error(
        `Error al subir logo: ${e instanceof Error ? e.message : "verifica que el bucket 'branding' exista y sea público"}`,
      );
    } finally {
      setLogoUploading(false);
    }
  };

  // ── Save functions ──────────────────────────────────────────────────────────

  const saveMarca = async () => {
    setSavingMarca(true);
    try {
      const { error } = await supabase
        .from("app_settings")
        .update({ company_name: companyName, app_name: appName })
        .eq("id", "global");
      if (error) throw error;
      await refresh();
      toast.success("Marca guardada correctamente");
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Error al guardar");
    } finally {
      setSavingMarca(false);
    }
  };

  const saveTipografia = async () => {
    setSavingFont(true);
    try {
      const { error: dbErr } = await supabase
        .from("app_settings")
        .update({ font_family: fontFamily })
        .eq("id", "global");
      if (dbErr) throw dbErr;
      const csErr = await mergeContentStrings({
        font_size: fontSize,
        line_height: lineHeight,
        google_fonts_url: googleFontUrl,
      });
      if (csErr) throw csErr;
      // Apply CSS vars immediately
      document.documentElement.style.setProperty("--font-sans", `"${fontFamily}", system-ui, sans-serif`);
      document.documentElement.style.setProperty("--font-size-base", fontSize);
      document.documentElement.style.setProperty("--line-height-base", lineHeight);
      await refresh();
      toast.success("Tipografía guardada y aplicada");
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Error al guardar tipografía");
    } finally {
      setSavingFont(false);
    }
  };

  const saveColores = async () => {
    setSavingColor(true);
    try {
      const { error: dbErr } = await supabase
        .from("app_settings")
        .update({ primary_color: primaryColor, accent_color: accentColor })
        .eq("id", "global");
      if (dbErr) throw dbErr;
      const csErr = await mergeContentStrings({ active_theme: activeTheme });
      if (csErr) throw csErr;
      await refresh(); // triggers applyBranding → CSS vars update
      toast.success("Colores aplicados globalmente");
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Error al guardar colores");
    } finally {
      setSavingColor(false);
    }
  };

  const saveLegal = async () => {
    setSavingLegal(true);
    try {
      const err = await mergeContentStrings({
        copyright,
        confidencial,
        terminos_url: terminosUrl,
        privacidad_url: privacidadUrl,
      });
      if (err) throw err;
      toast.success("Configuración legal guardada");
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Error al guardar configuración legal");
    } finally {
      setSavingLegal(false);
    }
  };

  const saveSeguridad = async () => {
    setSavingSec(true);
    try {
      const err = await mergeContentStrings({
        sec_2fa: sec2fa,
        sec_public_reg: secPublic,
        sec_auto_logout: secAuto,
        sec_audit_log: secLog,
      });
      if (err) throw err;
      toast.success("Configuración de seguridad guardada");
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Error al guardar configuración de seguridad");
    } finally {
      setSavingSec(false);
    }
  };

  const saveIA = async () => {
    setSavingIA(true);
    try {
      const err = await mergeContentStrings({
        ai_coaching: aiCoaching,
        ai_sintesis: aiSintesis,
        ai_side: aiSide,
        ai_model: aiModel,
      });
      if (err) throw err;
      toast.success("Configuración de IA guardada");
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Error al guardar configuración IA");
    } finally {
      setSavingIA(false);
    }
  };

  // ── Render ──────────────────────────────────────────────────────────────────

  return (
    <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "24px" }}>

      {/* ── 1. LOGO Y MARCA ───────────────────────────────────────────────────── */}
      <div style={card}>
        <div style={cardTitle}>🖼️ Logo y marca</div>

        {/* Tab selector */}
        <div style={{ display: "flex", gap: "8px", marginBottom: "18px" }}>
          {["Logo principal", "Logo oscuro", "Favicon"].map((t, i) => (
            <button
              key={t}
              onClick={() => setLogoTab(i)}
              style={{
                padding: "8px 14px",
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

        {/* Drop zone */}
        <div
          onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
          onDragLeave={() => setDragOver(false)}
          onDrop={(e) => {
            e.preventDefault();
            setDragOver(false);
            const file = e.dataTransfer.files[0];
            if (file) void handleLogoFile(file);
          }}
          onClick={() => fileInputRef.current?.click()}
          style={{
            border: `2px dashed ${dragOver ? "#0EA5E9" : "#BAE6FD"}`,
            borderRadius: "14px",
            padding: "28px 20px",
            textAlign: "center",
            cursor: "pointer",
            background: dragOver ? "#EFF6FF" : "#F8FAFF",
            marginBottom: "10px",
            transition: "all 0.15s",
          }}
        >
          <input
            ref={fileInputRef}
            type="file"
            accept="image/png,image/jpeg,image/svg+xml,image/webp"
            style={{ display: "none" }}
            onChange={(e) => { const f = e.target.files?.[0]; if (f) void handleLogoFile(f); }}
          />
          {logoPreview ? (
            <img
              src={logoPreview}
              alt="Logo"
              style={{ maxWidth: "180px", maxHeight: "60px", margin: "0 auto 10px", display: "block", objectFit: "contain" }}
            />
          ) : (
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
          )}
          <div style={{ fontSize: "15px", fontWeight: 700, color: "#0EA5E9", marginBottom: "4px" }}>
            {logoUploading ? "Subiendo…" : "Subir nuevo logo"}
          </div>
          <div style={{ fontSize: "13px", color: "#94A3B8" }}>
            PNG · SVG · JPG · Máx 2 MB · Recomendado 200×60 px · Arrastra o haz clic
          </div>
        </div>
        <div style={configHint}>El logo aparece en el topbar, reportes y documentos PDF.</div>

        <div style={divider} />

        <div style={{ marginBottom: "20px" }}>
          <label style={configLabel}>Nombre de la plataforma</label>
          <input style={configInput} value={companyName} onChange={(e) => setCompanyName(e.target.value)} />
        </div>
        <div style={{ marginBottom: "20px" }}>
          <label style={configLabel}>Tagline / Subtítulo</label>
          <input style={configInput} value={appName} onChange={(e) => setAppName(e.target.value)} />
        </div>
        <button onClick={() => void saveMarca()} disabled={savingMarca} style={saveBtn(savingMarca)}>
          {savingMarca ? "✓ Guardando…" : "Guardar marca"}
        </button>
      </div>

      {/* ── 2. TIPOGRAFÍA ─────────────────────────────────────────────────────── */}
      <div style={card}>
        <div style={cardTitle}>🔤 Tipografía</div>

        <div style={{ marginBottom: "20px" }}>
          <label style={configLabel}>Fuente principal</label>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "10px", marginBottom: "14px" }}>
            {FONTS.map((f) => (
              <div
                key={f}
                role="button"
                tabIndex={0}
                onClick={() => setFontFamily(f)}
                onKeyDown={(e) => e.key === "Enter" && setFontFamily(f)}
                style={{
                  border: "2px solid",
                  borderColor: fontFamily === f ? "#0EA5E9" : "#E0E7FF",
                  borderRadius: "12px",
                  padding: "14px",
                  cursor: "pointer",
                  background: fontFamily === f ? "#EFF6FF" : "white",
                  textAlign: "center",
                  outline: "none",
                  transition: "all 0.15s",
                }}
              >
                <div style={{ fontSize: "15px", fontWeight: 700, color: "#0C4A6E", fontFamily: f, marginBottom: "3px" }}>
                  {f}
                </div>
                <div style={{ fontSize: "13px", color: "#64748B", fontFamily: f }}>El liderazgo transforma</div>
              </div>
            ))}
          </div>
          <input
            style={configInput}
            placeholder="URL Google Fonts personalizada (opcional)"
            value={googleFontUrl}
            onChange={(e) => setGoogleFontUrl(e.target.value)}
          />
          <div style={configHint}>Ej: https://fonts.googleapis.com/css2?family=Poppins:wght@400;700</div>
        </div>

        {/* Live preview */}
        <div
          style={{
            padding: "16px 20px",
            background: "#F8FAFF",
            borderRadius: "12px",
            border: "1px solid #E0E7FF",
            marginBottom: "18px",
            fontFamily,
            fontSize,
            lineHeight,
          }}
        >
          <div style={{ fontWeight: 800, color: "#0C4A6E", marginBottom: "5px" }}>
            Vista previa en tiempo real
          </div>
          <div style={{ color: "#64748B" }}>
            La transformación empresarial comienza con el diagnóstico correcto. Evalúa, planifica y ejecuta.
          </div>
        </div>

        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "16px", marginBottom: "20px" }}>
          <div>
            <label style={configLabel}>Tamaño base</label>
            <input style={configInput} value={fontSize} onChange={(e) => setFontSize(e.target.value)} placeholder="17px" />
            <div style={configHint}>Ej: 16px – 18px</div>
          </div>
          <div>
            <label style={configLabel}>Interlineado</label>
            <input style={configInput} value={lineHeight} onChange={(e) => setLineHeight(e.target.value)} placeholder="1.85" />
            <div style={configHint}>Ej: 1.75 – 1.95</div>
          </div>
        </div>

        <button onClick={() => void saveTipografia()} disabled={savingFont} style={saveBtn(savingFont)}>
          {savingFont ? "✓ Guardando…" : "Guardar tipografía"}
        </button>
      </div>

      {/* ── 3. COLORES Y TEMA ─────────────────────────────────────────────────── */}
      <div style={card}>
        <div style={cardTitle}>🎨 Colores y tema</div>

        <div style={{ marginBottom: "22px" }}>
          <label style={configLabel}>Tema visual</label>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: "12px", marginBottom: "4px" }}>
            {THEMES.map((t, i) => (
              <div
                key={t.name}
                role="button"
                tabIndex={0}
                onClick={() => {
                  setActiveTheme(i);
                  setPrimaryColor(t.primary);
                  setAccentColor(t.accent);
                }}
                onKeyDown={(e) => {
                  if (e.key === "Enter") {
                    setActiveTheme(i);
                    setPrimaryColor(t.primary);
                    setAccentColor(t.accent);
                  }
                }}
                style={{
                  border: "2px solid",
                  borderColor: activeTheme === i ? "#0EA5E9" : "#E0E7FF",
                  borderRadius: "12px",
                  padding: "14px",
                  cursor: "pointer",
                  background: activeTheme === i ? "#EFF6FF" : "white",
                  outline: "none",
                  transition: "all 0.15s",
                }}
              >
                <div style={{ height: "42px", borderRadius: "8px", background: t.gradient, marginBottom: "10px" }} />
                <div style={{ fontSize: "13px", fontWeight: 700, color: "#0C4A6E", textAlign: "center" }}>{t.name}</div>
              </div>
            ))}
          </div>
        </div>

        <div style={{ marginBottom: "22px" }}>
          <label style={configLabel}>Color primario</label>
          <div style={{ display: "flex", gap: "8px", marginBottom: "12px", flexWrap: "wrap" }}>
            {SWATCHES.map((c) => (
              <div
                key={c}
                role="button"
                tabIndex={0}
                onClick={() => setPrimaryColor(c)}
                onKeyDown={(e) => e.key === "Enter" && setPrimaryColor(c)}
                title={c}
                style={{
                  width: "40px",
                  height: "40px",
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
          <div style={{ display: "flex", gap: "10px", alignItems: "center", marginBottom: "14px" }}>
            <div style={{ width: "42px", height: "42px", borderRadius: "10px", background: primaryColor, border: "1.5px solid #E0E7FF", flexShrink: 0 }} />
            <input style={{ ...configInput, flex: 1 }} value={primaryColor} onChange={(e) => setPrimaryColor(e.target.value)} placeholder="#0C4A6E" />
          </div>
          <label style={configLabel}>Color de acento</label>
          <div style={{ display: "flex", gap: "10px", alignItems: "center" }}>
            <div style={{ width: "42px", height: "42px", borderRadius: "10px", background: accentColor, border: "1.5px solid #E0E7FF", flexShrink: 0 }} />
            <input style={{ ...configInput, flex: 1 }} value={accentColor} onChange={(e) => setAccentColor(e.target.value)} placeholder="#6366F1" />
          </div>
        </div>

        <button onClick={() => void saveColores()} disabled={savingColor} style={saveBtn(savingColor)}>
          {savingColor ? "✓ Guardando…" : "Aplicar colores globalmente"}
        </button>
      </div>

      {/* ── 4. DERECHOS Y LEGAL ───────────────────────────────────────────────── */}
      <div style={card}>
        <div style={cardTitle}>⚖️ Derechos y aspectos legales</div>

        <div style={{ marginBottom: "20px" }}>
          <label style={configLabel}>Texto de copyright</label>
          <input style={configInput} value={copyright} onChange={(e) => setCopyright(e.target.value)} />
          <div style={configHint}>Aparece en el pie de página y documentos exportados.</div>
        </div>
        <div style={{ marginBottom: "20px" }}>
          <label style={configLabel}>Aviso de confidencialidad (documentos exportados)</label>
          <textarea
            style={{ ...configInput, minHeight: "88px", resize: "vertical" as const, lineHeight: "1.7" }}
            value={confidencial}
            onChange={(e) => setConfidencial(e.target.value)}
          />
        </div>
        <div style={{ marginBottom: "20px" }}>
          <label style={configLabel}>Términos y condiciones — URL</label>
          <input style={configInput} value={terminosUrl} onChange={(e) => setTerminosUrl(e.target.value)} placeholder="https://a360sgp.com/terminos" />
        </div>
        <div style={{ marginBottom: "20px" }}>
          <label style={configLabel}>Política de privacidad — URL</label>
          <input style={configInput} value={privacidadUrl} onChange={(e) => setPrivacidadUrl(e.target.value)} placeholder="https://a360sgp.com/privacidad" />
        </div>

        <button onClick={() => void saveLegal()} disabled={savingLegal} style={saveBtn(savingLegal)}>
          {savingLegal ? "✓ Guardando…" : "Guardar configuración legal"}
        </button>
      </div>

      {/* ── 5. SEGURIDAD ──────────────────────────────────────────────────────── */}
      <div style={card}>
        <div style={cardTitle}>🔐 Seguridad</div>
        <ToggleRow label="Autenticación de 2 factores (2FA)" sub="Requerir 2FA para todos los administradores" value={sec2fa} onChange={setSec2fa} />
        <ToggleRow label="Registro público" sub="Permitir que nuevos usuarios se registren sin invitación" value={secPublic} onChange={setSecPublic} />
        <ToggleRow label="Cierre de sesión automático" sub="Cerrar sesión tras 8 horas de inactividad" value={secAuto} onChange={setSecAuto} />
        <ToggleRow label="Log de auditoría" sub="Registrar todas las acciones de administradores" value={secLog} onChange={setSecLog} last />
        <div style={divider} />
        <button onClick={() => void saveSeguridad()} disabled={savingSec} style={saveBtn(savingSec)}>
          {savingSec ? "✓ Guardando…" : "Guardar configuración de seguridad"}
        </button>
      </div>

      {/* ── 6. INTELIGENCIA ARTIFICIAL ────────────────────────────────────────── */}
      <div style={card}>
        <div style={cardTitle}>🤖 Inteligencia Artificial</div>
        <ToggleRow label="Análisis IA en sesiones de coaching" sub="Generar análisis automáticos con Claude al cerrar cada sesión" value={aiCoaching} onChange={setAiCoaching} />
        <ToggleRow label="Síntesis ejecutiva del programa" sub="Generar síntesis global del programa de coaching" value={aiSintesis} onChange={setAiSintesis} />
        <ToggleRow label="Análisis SIDE con IA" sub="Generar recomendaciones automáticas del diagnóstico empresarial" value={aiSide} onChange={setAiSide} last />
        <div style={divider} />
        <div style={{ marginBottom: "20px" }}>
          <label style={configLabel}>Modelo de IA</label>
          <input style={configInput} value={aiModel} onChange={(e) => setAiModel(e.target.value)} placeholder="claude-sonnet-4-6" />
          <div style={configHint}>
            Modelo de Claude utilizado para todos los análisis de la plataforma.
          </div>
        </div>
        <button onClick={() => void saveIA()} disabled={savingIA} style={saveBtn(savingIA)}>
          {savingIA ? "✓ Guardando…" : "Guardar configuración IA"}
        </button>
      </div>

    </div>
  );
}
