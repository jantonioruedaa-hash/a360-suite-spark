export type ThemeId = "aurora-v2" | "indigo-elite" | "editorial-premium";

export interface Theme {
  id: ThemeId;
  name: string;
  description: string;
  preview: {
    sidebar: string;
    topbar: string;
    accent: string;
    text: string;
  };
  /** CSS variables applied to :root via document.documentElement.style.setProperty */
  variables: Record<string, string>;
}

export const DEFAULT_THEME_ID: ThemeId = "aurora-v2";

export const THEMES: Record<ThemeId, Theme> = {
  "aurora-v2": {
    id: "aurora-v2",
    name: "Aurora V2",
    description: "Azul cielo e índigo — moderno y profesional",
    preview: {
      sidebar: "linear-gradient(180deg, #EFF6FF, #EDE9FE)",
      topbar: "#FFFFFF",
      accent: "linear-gradient(135deg, #0EA5E9, #6366F1)",
      text: "#0C4A6E",
    },
    variables: {
      "--background": "#F5F7FF",
      "--foreground": "#0C4A6E",
      "--navy": "#0C4A6E",
      "--gold": "#0EA5E9",
      "--primary": "#0EA5E9",
      "--primary-foreground": "#FFFFFF",
      "--muted-foreground": "#94A3B8",
      "--border": "#E0F2FE",
      "--input": "#E0F2FE",
      "--ring": "#0EA5E9",
      "--sidebar": "transparent",
      "--sidebar-foreground": "#0369A1",
      "--sidebar-accent": "#FFFFFF",
      "--sidebar-accent-foreground": "#0EA5E9",
      "--sidebar-border": "#C7D2FE",
      "--sidebar-bg": "linear-gradient(180deg, #EFF6FF 0%, #EDE9FE 100%)",
      "--sidebar-label-text": "#7DD3FC",
      "--topbar-border-color": "#BAE6FD",
    },
  },

  "indigo-elite": {
    id: "indigo-elite",
    name: "Índigo Elite",
    description: "Índigo profundo — sofisticado y premium",
    preview: {
      sidebar: "linear-gradient(180deg, #1E1B4B, #16134A)",
      topbar: "#1E1B4B",
      accent: "#6366F1",
      text: "#A5B4FC",
    },
    variables: {
      "--background": "#EEF2FF",
      "--foreground": "#312E81",
      "--navy": "#312E81",
      // gold mapea al acento; en Índigo Elite es violeta-lavanda claro para
      // garantizar contraste legible con --navy oscuro sobre él
      "--gold": "#A5B4FC",
      "--primary": "#6366F1",
      "--primary-foreground": "#FFFFFF",
      "--secondary-foreground": "#FFFFFF",
      "--accent-foreground": "#FFFFFF",
      "--muted-foreground": "#818CF8",
      "--border": "#C7D2FE",
      "--input": "#C7D2FE",
      "--ring": "#6366F1",
      "--sidebar": "transparent",
      "--sidebar-foreground": "#A5B4FC",
      "--sidebar-accent": "rgba(99,102,241,0.25)",
      "--sidebar-accent-foreground": "#C7D2FE",
      "--sidebar-border": "rgba(99,102,241,0.2)",
      "--sidebar-bg": "linear-gradient(180deg, #1E1B4B 0%, #16134A 100%)",
      "--sidebar-label-text": "rgba(165,180,252,0.6)",
      "--topbar-border-color": "rgba(99,102,241,0.25)",
    },
  },

  "editorial-premium": {
    id: "editorial-premium",
    name: "Editorial Premium",
    description: "Crema y dorado — elegante y clásico",
    preview: {
      sidebar: "#EDE8DE",
      topbar: "#1a1a1a",
      accent: "#C9A84C",
      text: "#1a1a1a",
    },
    variables: {
      "--background": "#F5F2EC",
      "--foreground": "#1a1a1a",
      "--navy": "#1a1a1a",
      "--gold": "#C9A84C",
      "--primary": "#C9A84C",
      "--primary-foreground": "#FFFFFF",
      "--secondary-foreground": "#FFFFFF",
      "--accent-foreground": "#1a1a1a",
      "--muted-foreground": "#78716C",
      "--border": "#DDD6CC",
      "--input": "#DDD6CC",
      "--ring": "#C9A84C",
      "--sidebar": "transparent",
      "--sidebar-foreground": "#4A3F32",
      "--sidebar-accent": "#FFFFFF",
      "--sidebar-accent-foreground": "#1a1a1a",
      "--sidebar-border": "#D0C8B8",
      "--sidebar-bg": "#EDE8DE",
      "--sidebar-label-text": "#9C8E78",
      "--topbar-border-color": "#D0C8B8",
    },
  },
};

export function applyTheme(id: ThemeId): void {
  const theme = THEMES[id];
  const root = document.documentElement;
  Object.entries(theme.variables).forEach(([name, value]) => {
    root.style.setProperty(name, value);
  });
  root.setAttribute("data-theme", id);
}

export function resetTheme(): void {
  const root = document.documentElement;
  const theme = THEMES[DEFAULT_THEME_ID];
  Object.keys(theme.variables).forEach((name) => {
    root.style.removeProperty(name);
  });
  root.removeAttribute("data-theme");
}
