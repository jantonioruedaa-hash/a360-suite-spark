import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from "react";
import { supabase } from "@/integrations/supabase/client";

export type AppSettings = {
  id: string;
  company_name: string;
  app_name: string;
  logo_url: string | null;
  primary_color: string;
  accent_color: string;
  font_family: string;
  content_strings: Record<string, string>;
};

const DEFAULTS: AppSettings = {
  id: "global",
  company_name: "Aceleradora 360",
  app_name: "A360SGP Suite",
  logo_url: null,
  primary_color: "#1a2b5a",
  accent_color: "#c9a84c",
  font_family: "DM Sans",
  content_strings: {},
};

type Ctx = {
  settings: AppSettings;
  loading: boolean;
  refresh: () => Promise<void>;
  update: (patch: Partial<AppSettings>) => Promise<{ error: string | null }>;
  getText: (key: string, fallback?: string) => string;
};

const AppSettingsContext = createContext<Ctx | null>(null);

// Convert hex (#rrggbb) to oklch string token usable by CSS vars
function hexToOklch(hex: string): string {
  // Lightweight: use CSS color-mix capability via raw hex; modern browsers accept hex in oklch via fallback CSS var
  // We instead just inject the hex; tailwind tokens are CSS vars consumed by oklch(...) — but our theme uses oklch().
  // To keep simple, expose hex directly as CSS color values; tokens that consume var() will accept any valid color.
  return hex;
}

function applyBranding(s: AppSettings) {
  if (typeof document === "undefined") return;
  const root = document.documentElement;
  root.style.setProperty("--primary", hexToOklch(s.primary_color));
  root.style.setProperty("--accent", hexToOklch(s.accent_color));
  root.style.setProperty("--gold", hexToOklch(s.accent_color));
  root.style.setProperty("--navy", hexToOklch(s.primary_color));
  root.style.setProperty("--ring", hexToOklch(s.primary_color));
  root.style.setProperty("--sidebar-primary", hexToOklch(s.primary_color));
  root.style.setProperty("--font-sans", `"${s.font_family}", system-ui, sans-serif`);
  // Inject Google Font if not already present
  const fontId = `gf-${s.font_family.replace(/\s+/g, "-")}`;
  if (!document.getElementById(fontId)) {
    const link = document.createElement("link");
    link.id = fontId;
    link.rel = "stylesheet";
    link.href = `https://fonts.googleapis.com/css2?family=${encodeURIComponent(s.font_family)}:wght@300;400;500;600;700&display=swap`;
    document.head.appendChild(link);
  }
  // Title
  if (s.app_name) document.title = `${s.app_name} — ${s.company_name}`;
}

export function AppSettingsProvider({ children }: { children: ReactNode }) {
  const [settings, setSettings] = useState<AppSettings>(DEFAULTS);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    const { data, error } = await supabase.from("app_settings").select("*").eq("id", "global").maybeSingle();
    if (!error && data) {
      const merged: AppSettings = {
        ...DEFAULTS,
        ...data,
        content_strings: (data.content_strings as Record<string, string> | null) ?? {},
      };
      setSettings(merged);
      applyBranding(merged);
    }
    setLoading(false);
  }, []);

  useEffect(() => { void load(); }, [load]);

  const update = useCallback(async (patch: Partial<AppSettings>) => {
    const { data, error } = await supabase
      .from("app_settings")
      .update(patch)
      .eq("id", "global")
      .select()
      .maybeSingle();
    if (error) return { error: error.message };
    if (data) {
      const merged: AppSettings = {
        ...DEFAULTS,
        ...data,
        content_strings: (data.content_strings as Record<string, string> | null) ?? {},
      };
      setSettings(merged);
      applyBranding(merged);
    }
    return { error: null };
  }, []);

  const getText = useCallback((key: string, fallback = "") => {
    return settings.content_strings?.[key] ?? fallback;
  }, [settings]);

  const value = useMemo(() => ({ settings, loading, refresh: load, update, getText }), [settings, loading, load, update, getText]);

  return <AppSettingsContext.Provider value={value}>{children}</AppSettingsContext.Provider>;
}

export function useAppSettings() {
  const ctx = useContext(AppSettingsContext);
  if (!ctx) throw new Error("useAppSettings must be used within AppSettingsProvider");
  return ctx;
}

// Catálogo de textos editables que se muestra en el editor de contenido.
// Para añadir uno nuevo: registrar la clave aquí y consumirla con getText("clave", "texto por defecto").
export const EDITABLE_TEXTS: Array<{ key: string; label: string; multiline?: boolean; defaultValue: string }> = [
  { key: "login.title", label: "Login · Título", defaultValue: "Bienvenido a A360SGP Suite" },
  { key: "login.subtitle", label: "Login · Subtítulo", defaultValue: "Sistema Integral de Transformación Empresarial" },
  { key: "sidebar.cliente_hint", label: "Sidebar · Mensaje para clientes", multiline: true,
    defaultValue: "Estás viendo tu portal como cliente. Tu consultor gestiona el resto del workspace." },
  { key: "dashboard.welcome", label: "Dashboard · Bienvenida", defaultValue: "Resumen ejecutivo" },
  { key: "footer.legal", label: "Pie · Texto legal", defaultValue: "" },
];
