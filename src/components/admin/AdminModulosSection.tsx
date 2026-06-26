import React, { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAppSettings } from "@/lib/app-settings";
import AdminModuloCard from "@/components/admin/AdminModuloCard";
import type { AdminEmpresaRow } from "@/components/admin/AdminEmpresaTable";

// ─── Module definitions ───────────────────────────────────────────────────────

const MODULOS_DEF = [
  {
    id: "coaching",
    emoji: "🎯",
    name: "Coaching A360",
    description: "Suite de coaching ejecutivo · 12 herramientas · 4 etapas",
    pending: false,
    defaultActive: true,
  },
  {
    id: "side",
    emoji: "🔍",
    name: "SIDE Diagnóstico",
    description: "Diagnóstico empresarial integral · IME + IVEE + IDF + COF",
    pending: false,
    defaultActive: true,
  },
  {
    id: "lee",
    emoji: "📚",
    name: "Programa LEE",
    description: "Liderazgo Empresarial Evolutivo · 10 capítulos · 40 sesiones",
    pending: false,
    defaultActive: true,
  },
  {
    id: "plan",
    emoji: "📋",
    name: "Plan Estratégico",
    description: "Planificación estratégica en 18 secciones",
    pending: false,
    defaultActive: true,
  },
  {
    id: "marketing",
    emoji: "📱",
    name: "Marketing Digital",
    description: "Suite de marketing · Integración nativa pendiente",
    pending: true,
    defaultActive: false,
  },
  {
    id: "bizos",
    emoji: "⚙️",
    name: "BizOS",
    description: "Sistema de gestión de procesos empresariales",
    pending: true,
    defaultActive: false,
  },
  {
    id: "manual",
    emoji: "📖",
    name: "Manual de Funciones",
    description: "Manual organizacional · Estructura de roles y funciones",
    pending: true,
    defaultActive: false,
  },
] as const;

// Maps module id → label used in AdminEmpresaRow.modulos[]
const MODULE_EMPRESA_LABEL: Record<string, string> = {
  coaching: "Coaching A360",
  side: "SIDE",
  lee: "LEE",
  plan: "Plan Estratégico",
  marketing: "Marketing Digital",
  bizos: "BizOS",
  manual: "Manual de Funciones",
};

const DEFAULT_ACTIVOS: Record<string, boolean> = {
  coaching: true,
  side: true,
  lee: true,
  plan: true,
  marketing: false,
  bizos: false,
  manual: false,
};

interface Props {
  empresas: AdminEmpresaRow[];
}

export default function AdminModulosSection({ empresas }: Props) {
  const { refresh } = useAppSettings();
  const [modulosActivos, setModulosActivos] = useState<Record<string, boolean>>(DEFAULT_ACTIVOS);
  const [savingId, setSavingId] = useState<string | null>(null);
  const [savedId, setSavedId] = useState<string | null>(null);
  const [sessionCounts, setSessionCounts] = useState<Record<string, number>>({});

  // ── Load from DB on mount ──────────────────────────────────────────────────

  useEffect(() => {
    const load = async () => {
      const { data } = await supabase
        .from("app_settings")
        .select("content_strings")
        .eq("id", "global")
        .single();

      const cs = data?.content_strings;
      if (
        cs &&
        typeof cs === "object" &&
        !Array.isArray(cs) &&
        "modulos_activos" in (cs as object)
      ) {
        const stored = (cs as Record<string, unknown>).modulos_activos;
        if (stored && typeof stored === "object" && !Array.isArray(stored)) {
          setModulosActivos(stored as Record<string, boolean>);
        }
      }

      // Query session counts for trackable modules
      const [coachingR, leeR] = await Promise.all([
        supabase
          .from("cliente_actividades")
          .select("*", { count: "exact", head: true })
          .eq("tipo", "sesion_coaching"),
        supabase
          .from("cliente_actividades")
          .select("*", { count: "exact", head: true })
          .eq("tipo", "sesion_lee"),
      ]);
      setSessionCounts({
        coaching: coachingR.count ?? 0,
        lee: leeR.count ?? 0,
      });
    };
    void load();
  }, []);

  // ── Toggle + auto-save ────────────────────────────────────────────────────

  const toggleModule = async (id: string) => {
    const newActive = !(modulosActivos[id] ?? DEFAULT_ACTIVOS[id] ?? false);
    const newModulosActivos = { ...modulosActivos, [id]: newActive };
    setModulosActivos(newModulosActivos);
    setSavingId(id);

    try {
      const { data: current } = await supabase
        .from("app_settings")
        .select("content_strings")
        .eq("id", "global")
        .single();

      const existingCs =
        current?.content_strings &&
        typeof current.content_strings === "object" &&
        !Array.isArray(current.content_strings)
          ? (current.content_strings as Record<string, unknown>)
          : {};

      const { error } = await supabase
        .from("app_settings")
        .update({
          content_strings: JSON.parse(
            JSON.stringify({ ...existingCs, modulos_activos: newModulosActivos }),
          ),
        })
        .eq("id", "global");

      if (!error) {
        await refresh(); // propagates to AppSidebar and all consumers
        setSavedId(id);
        setTimeout(() => setSavedId(null), 2200);
      }
    } finally {
      setSavingId(null);
    }
  };

  // ── Derived stats ─────────────────────────────────────────────────────────

  const activeCount = MODULOS_DEF.filter((m) => modulosActivos[m.id] ?? m.defaultActive).length;
  const isSaving = savingId !== null;

  // ── Render ────────────────────────────────────────────────────────────────

  return (
    <>
      {/* Status bar */}
      <div
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          marginBottom: "20px",
          flexWrap: "wrap",
          gap: "12px",
        }}
      >
        <div style={{ fontSize: "15px", color: "#64748B" }}>
          <strong style={{ color: "#0C4A6E" }}>{activeCount}</strong> de {MODULOS_DEF.length}{" "}
          módulos activos
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
          {isSaving && (
            <span style={{ fontSize: "13px", color: "#94A3B8", fontWeight: 500 }}>
              Guardando…
            </span>
          )}
          {savedId !== null && !isSaving && (
            <span
              style={{
                display: "inline-flex",
                alignItems: "center",
                gap: "5px",
                padding: "5px 14px",
                borderRadius: "999px",
                background: "#ECFDF5",
                color: "#059669",
                fontSize: "13px",
                fontWeight: 700,
              }}
            >
              ✓ Guardado
            </span>
          )}
        </div>
      </div>

      {/* Cards grid */}
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "1fr 1fr",
          gap: "20px",
        }}
      >
        {MODULOS_DEF.map((m) => {
          const active = modulosActivos[m.id] ?? m.defaultActive;
          const empresasCount = empresas.filter((e) =>
            e.modulos.includes(MODULE_EMPRESA_LABEL[m.id] ?? ""),
          ).length;
          return (
            <AdminModuloCard
              key={m.id}
              modulo={{
                id: m.id,
                emoji: m.emoji,
                name: m.name,
                description: m.description,
                badge: "",
                pending: m.pending,
                defaultActive: m.defaultActive,
              }}
              active={active}
              onToggle={() => void toggleModule(m.id)}
              empresasCount={empresasCount}
              sesionesCount={sessionCounts[m.id]}
            />
          );
        })}
      </div>
    </>
  );
}
