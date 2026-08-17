export const AREA_COLORS = [
  { bg: "#EFF6FF", border: "#BFDBFE", dot: "#3B82F6" },
  { bg: "#F5F3FF", border: "#DDD6FE", dot: "#7C3AED" },
  { bg: "#ECFDF5", border: "#A7F3D0", dot: "#059669" },
  { bg: "#FFFBEB", border: "#FDE68A", dot: "#D97706" },
  { bg: "#FFF1F2", border: "#FECDD3", dot: "#E11D48" },
  { bg: "#F0F9FF", border: "#BAE6FD", dot: "#0284C7" },
  { bg: "#F0FDF4", border: "#BBF7D0", dot: "#16A34A" },
  { bg: "#FDF4FF", border: "#E9D5FF", dot: "#9333EA" },
] as const;

export type AreaColor = (typeof AREA_COLORS)[number];

const AREA_ICONS: Record<string, string> = {
  "Gerencia General": "🏢",
  "Planificacion Estrategica": "🎯",
  "Planificación Estratégica": "🎯",
  "Comercial": "💼",
  "Comercial Promocionales": "🎁",
  "Mercadeo": "📣",
  "Compras / Importaciones": "📦",
  "Logistica": "🚚",
  "Logística": "🚚",
  "Personalizacion": "🎨",
  "Personalización": "🎨",
  "Credito y Cobranzas": "💳",
  "Crédito y Cobranzas": "💳",
  "Contabilidad": "🧾",
  "Servicio al Cliente": "🤝",
  "Administrativa": "📁",
  "Finanzas": "📊",
  "Legal y Compliance": "⚖️",
  "Calidad y Mejora Continua": "✅",
  "Recursos Humanos": "👥",
  "Sistemas / TI": "💻",
};

export function getAreaColor(idx: number): AreaColor {
  return AREA_COLORS[idx % AREA_COLORS.length];
}

export function getAreaIcon(nombre: string): string {
  return AREA_ICONS[nombre] ?? "📋";
}
