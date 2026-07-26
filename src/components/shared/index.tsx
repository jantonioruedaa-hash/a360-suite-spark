/**
 * A360 Shared Components
 * Extracted from SIDE, Coaching, Plan Estratégico, LEE, Manual de Funciones.
 * Use these as the base for every new module (Finanzas, Estrategia, Procesos…).
 */
import type { ReactNode, CSSProperties } from "react";
import { Button } from "@/components/ui/button";

// ── 1. StatusBadge ────────────────────────────────────────────────────────────
// Color-coded pill badge. 5 variants extracted from nivelIME() in SIDE and
// the semáforo patterns in Manual Funciones / Coaching.

const BADGE_STYLES: Record<StatusVariant, { bg: string; color: string; border: string }> = {
  success: { bg: "#D1FAE5", color: "#065F46", border: "#6EE7B7" },
  warning: { bg: "#FFFBEB", color: "#92400E", border: "#FCD34D" },
  danger:  { bg: "#FEE2E2", color: "#991B1B", border: "#FCA5A5" },
  info:    { bg: "#EFF6FF", color: "#1D4ED8", border: "#93C5FD" },
  muted:   { bg: "#F1F5F9", color: "#64748B", border: "#CBD5E1" },
};

export type StatusVariant = "success" | "warning" | "danger" | "info" | "muted";

export function StatusBadge({
  variant = "muted",
  label,
  icon,
  style,
}: {
  variant?: StatusVariant;
  label: string;
  icon?: string;
  style?: CSSProperties;
}) {
  const s = BADGE_STYLES[variant];
  return (
    <span style={{
      display: "inline-flex", alignItems: "center", gap: "5px",
      fontSize: "11px", fontWeight: 700, letterSpacing: "0.04em",
      padding: "3px 10px", borderRadius: "99px",
      background: s.bg, color: s.color,
      border: `1px solid ${s.border}`,
      whiteSpace: "nowrap",
      ...style,
    }}>
      {icon && <span style={{ fontSize: "13px", lineHeight: 1 }}>{icon}</span>}
      {label}
    </span>
  );
}

// ── 2. StatCard ───────────────────────────────────────────────────────────────
// KPI metric card. Pattern from: SIDE (4-col KPI header), Resumen (a360-card-lg),
// Coaching (progress counters). Always: label on top, big number, optional badge.

export function StatCard({
  label,
  value,
  unit,
  sub,
  badge,
  delta,
}: {
  label: string;
  value: string | number;
  unit?: string;
  sub?: string;
  badge?: { label: string; variant: StatusVariant; icon?: string };
  delta?: number | null;
}) {
  return (
    <div className="a360-card a360-card-lg" style={{ padding: "16px 20px" }}>
      <div style={{ fontSize: "10px", fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.1em", color: "#94A3B8", marginBottom: "6px" }}>
        {label}
      </div>
      <div style={{ display: "flex", alignItems: "baseline", gap: "4px" }}>
        <span className="font-display" style={{ fontSize: "28px", fontWeight: 900, color: "#0C4A6E", lineHeight: 1 }}>
          {value}
        </span>
        {unit && <span style={{ fontSize: "13px", fontWeight: 600, color: "#64748B" }}>{unit}</span>}
      </div>
      {badge && (
        <div style={{ marginTop: "6px" }}>
          <StatusBadge variant={badge.variant} label={badge.label} icon={badge.icon} />
        </div>
      )}
      {delta != null && (
        <div style={{ fontSize: "12px", fontWeight: 700, color: delta >= 0 ? "#059669" : "#DC2626", marginTop: "4px" }}>
          {delta > 0 ? `+${delta}` : delta} vs anterior
        </div>
      )}
      {sub && !badge && !delta && (
        <div style={{ fontSize: "12px", color: "#94A3B8", marginTop: "4px" }}>{sub}</div>
      )}
    </div>
  );
}

// ── 3. PageHeader ─────────────────────────────────────────────────────────────
// Consistent page-level header. Pattern: `flex items-start justify-between`
// with h2.font-display.text-navy + subtitle. Used in every module.

export function PageHeader({
  title,
  subtitle,
  action,
}: {
  title: string;
  subtitle?: string;
  action?: ReactNode;
}) {
  return (
    <div className="flex items-start justify-between flex-wrap gap-3">
      <div>
        <h2 className="font-display text-2xl text-navy">{title}</h2>
        {subtitle && <p className="text-sm text-muted-foreground mt-1">{subtitle}</p>}
      </div>
      {action && <div className="flex items-center gap-2">{action}</div>}
    </div>
  );
}

// ── 4. SectionCard ────────────────────────────────────────────────────────────
// Content section wrapper. Follows .a360-section-title convention: gold
// border-bottom on the header (same as Plan, LEE, Onboarding).

export function SectionCard({
  title,
  action,
  children,
  className,
}: {
  title?: string;
  action?: ReactNode;
  children: ReactNode;
  className?: string;
}) {
  return (
    <div className={`a360-card a360-card-lg${className ? ` ${className}` : ""}`} style={{ padding: 0 }}>
      {title && (
        <div style={{
          display: "flex", alignItems: "center", justifyContent: "space-between",
          padding: "14px 20px", borderBottom: "2px solid var(--color-gold)",
        }}>
          <h3 className="font-display text-navy" style={{ margin: 0, fontSize: "15px" }}>{title}</h3>
          {action}
        </div>
      )}
      <div style={{ padding: "16px 20px" }}>{children}</div>
    </div>
  );
}

// ── 5. EmptyState ─────────────────────────────────────────────────────────────
// Centered empty placeholder. Pattern from LEE (sin programa), Coaching,
// Manual Funciones (sin evaluaciones). Always: icon + title + description + action.

export function EmptyState({
  icon,
  title,
  description,
  action,
}: {
  icon?: ReactNode;
  title: string;
  description?: string;
  action?: ReactNode;
}) {
  return (
    <div className="a360-card a360-card-lg" style={{ padding: "48px 24px", textAlign: "center" }}>
      {icon && (
        <div style={{ marginBottom: "16px", display: "flex", justifyContent: "center", opacity: 0.5 }}>
          {icon}
        </div>
      )}
      <p style={{ fontWeight: 700, color: "#0C4A6E", fontSize: "16px", margin: "0 0 8px" }}>{title}</p>
      {description && <p style={{ fontSize: "14px", color: "#94A3B8", margin: "0 0 20px" }}>{description}</p>}
      {action}
    </div>
  );
}

// ── 6. HistorialTable + HistorialRow ──────────────────────────────────────────
// Striped table with dark header. Pattern from Manual Funciones historial,
// SIDE sesiones list, Coaching historial rows.

export function HistorialTable({
  cols,
  colWidths,
  children,
  emptyMessage = "Sin registros.",
}: {
  cols: string[];
  colWidths: string;
  children?: ReactNode;
  emptyMessage?: string;
}) {
  return (
    <div style={{ borderRadius: "10px", overflow: "hidden", border: "1px solid var(--color-border)" }}>
      <div style={{ display: "grid", gridTemplateColumns: colWidths, background: "var(--navy)", padding: "8px 12px", gap: "10px" }}>
        {cols.map((h) => (
          <span key={h} style={{ fontSize: "10px", fontWeight: 800, color: "rgba(255,255,255,0.75)", textTransform: "uppercase", letterSpacing: "0.1em" }}>{h}</span>
        ))}
      </div>
      {children ?? (
        <div style={{ padding: "20px 16px", fontSize: "13px", color: "var(--muted-foreground)", textAlign: "center" }}>{emptyMessage}</div>
      )}
    </div>
  );
}

export function HistorialRow({
  colWidths,
  children,
  active,
  idx,
  onClick,
}: {
  colWidths: string;
  children: ReactNode;
  active?: boolean;
  idx: number;
  onClick?: () => void;
}) {
  return (
    <div
      onClick={onClick}
      style={{
        display: "grid", gridTemplateColumns: colWidths,
        gap: "10px", padding: "9px 12px", alignItems: "center",
        background: active ? "var(--cream)" : idx % 2 === 0 ? "white" : "#F8FAFF",
        borderTop: "1px solid var(--color-border)",
        cursor: onClick ? "pointer" : undefined,
      }}
    >
      {children}
    </div>
  );
}

// ── Convenience re-exports for new modules ────────────────────────────────────
export { Button };
