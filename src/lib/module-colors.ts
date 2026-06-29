import { useRouterState } from "@tanstack/react-router";

export interface ModuleColor {
  gradient: string;
  accent: string;
}

// Order matters: more specific prefixes first so the longest match wins.
const MODULE_COLORS: [string, ModuleColor][] = [
  ["/app/coaching",        { gradient: "linear-gradient(135deg, #312E81, #6366F1)", accent: "#6366F1" }],
  ["/app/side",            { gradient: "linear-gradient(135deg, #0C4A6E, #1E3A8A)", accent: "#0EA5E9" }],
  ["/app/crecimiento",     { gradient: "linear-gradient(135deg, #065F46, #0EA5E9)", accent: "#10B981" }],
  ["/app/lee",             { gradient: "linear-gradient(135deg, #92400E, #D97706)", accent: "#D97706" }],
  ["/app/plan-estrategico",{ gradient: "linear-gradient(135deg, #1E1B4B, #4338CA)", accent: "#4338CA" }],
  ["/app/plan",            { gradient: "linear-gradient(135deg, #1E1B4B, #4338CA)", accent: "#4338CA" }],
  ["/app/admin",           { gradient: "linear-gradient(135deg, #7F1D1D, #DC2626)", accent: "#DC2626" }],
  ["/app/dashboard",       { gradient: "linear-gradient(135deg, #0369A1, #0EA5E9)", accent: "#0EA5E9" }],
];

const DEFAULT_COLOR: ModuleColor = {
  gradient: "linear-gradient(135deg, #334155, #475569)",
  accent: "#64748B",
};

export function getModuleColor(path: string): ModuleColor {
  const match = MODULE_COLORS.find(([prefix]) => path === prefix || path.startsWith(prefix + "/"));
  return match ? match[1] : DEFAULT_COLOR;
}

export function useModuleColor(): ModuleColor {
  const path = useRouterState({ select: (r) => r.location.pathname });
  return getModuleColor(path);
}
