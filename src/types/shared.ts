// ── A360 Shared Types ─────────────────────────────────────────────────────────
// Base types shared across all modules (SIDE, Coaching, Plan, LEE, Manual
// de Funciones, and future modules: Finanzas, Estrategia, Procesos).
// New modules extend these instead of redefining equivalent shapes.

// ── 1. BaseRecord ─────────────────────────────────────────────────────────────
// Every DB-backed module record has these fields.
export interface BaseRecord {
  id: string;
  cliente_id: string;
  consultor_id: string | null;
  created_at: string;
  updated_at?: string;
}

// ── 2. StatusLevel + SemaforoResult ──────────────────────────────────────────
// Unified status/semaphore — replaces:
//   • sem: "rojo"|"amarillo"|"verde"  (Marketing)
//   • semaforo: string                (Manual de Funciones)
//   • completada: boolean used as proxy for status (Coaching, LEE)
export type StatusLevel = "success" | "warning" | "danger" | "info" | "muted";

export interface SemaforoResult {
  level: StatusLevel;
  label: string;   // "Cumple", "En riesgo", "Crítico", "Iniciado", etc.
  icon?: string;   // optional emoji
}

// ── 3. ScoreSnapshot ─────────────────────────────────────────────────────────
// Normalized score carrier. value is always 0-100 (percentage).
// raw holds the original value before normalization (e.g. 3.8 on a 1-5 scale).
export interface ScoreSnapshot {
  value: number;
  raw?: number;
  semaforo: SemaforoResult;
}

// ── 4. ModuleRecord ───────────────────────────────────────────────────────────
// Base for module session/record types. New modules extend this:
//   interface FinanzasRecord extends ModuleRecord { ... }
//
// scores uses Record<string, ScoreSnapshot> to support both single-score
// modules ({ total: {...} }) and multi-score modules like SIDE
// ({ ime: {...}, ivee: {...}, idf: {...}, cof: {...} }).
export interface ModuleRecord extends BaseRecord {
  nombre_sesion?: string | null;
  completada: boolean;
  fecha_completado?: string | null;
  scores?: Record<string, ScoreSnapshot>;
}
