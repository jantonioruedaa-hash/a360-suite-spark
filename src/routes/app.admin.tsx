import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { useAuth } from "@/lib/auth-context";
import { supabase } from "@/integrations/supabase/client";
import { adminListUsersExtra } from "@/lib/admin-users.functions";
import AdminSidebar, { type AdminSection } from "@/components/admin/AdminSidebar";
import AdminKpiCard from "@/components/admin/AdminKpiCard";
import AdminUserTable, { type AdminUserRow } from "@/components/admin/AdminUserTable";
import AdminEmpresaTable, { type AdminEmpresaRow } from "@/components/admin/AdminEmpresaTable";
import AdminPlanCard, { type AdminPlanData } from "@/components/admin/AdminPlanCard";
import AdminPermisosMatrix from "@/components/admin/AdminPermisosMatrix";
import AdminConfiguracion from "@/components/admin/AdminConfiguracion";
import AdminPlanEditor, { type PlanRecord } from "@/components/admin/AdminPlanEditor";
import AdminModulosSection from "@/components/admin/AdminModulosSection";
import { toast } from "sonner";

export const Route = createFileRoute("/app/admin")({ component: AdminPanel });

// ─── shared style helpers ───────────────────────────────────────────────────

const pageEyebrow = {
  fontSize: "12px",
  fontWeight: 700,
  color: "#0EA5E9",
  textTransform: "uppercase" as const,
  letterSpacing: "0.14em",
  marginBottom: "10px",
  display: "flex",
  alignItems: "center",
  gap: "10px",
};

const pageTitle = {
  fontSize: "36px",
  fontWeight: 900,
  color: "#0C4A6E",
  letterSpacing: "-0.02em",
  marginBottom: "8px",
};

const pageSub = {
  fontSize: "17px",
  color: "#64748B",
  lineHeight: "1.85",
  marginBottom: "36px",
  textAlign: "justify" as const,
};

const tableCard = {
  background: "white",
  borderRadius: "20px",
  border: "1px solid #E0E7FF",
  overflow: "hidden",
  marginBottom: "28px",
};

// ─── default plan records (used as fallback before DB load) ──────────────────

const DEFAULT_PLAN_RECORDS: PlanRecord[] = [
  {
    id: "esencial",
    name: "Básico",
    price: "$297",
    priceUnit: "/mes",
    description:
      "Para empresas que inician su proceso de diagnóstico y transformación empresarial.",
    features: [
      { text: "Diagnóstico SIDE completo", included: true },
      { text: "Dashboard de resultados", included: true },
      { text: "1 usuario cliente", included: true },
      { text: "Soporte por email", included: true },
      { text: "Módulo Coaching A360", included: false },
      { text: "Programa LEE", included: false },
      { text: "Plan Estratégico", included: false },
    ],
    maxUsers: 1,
    modulos: ["SIDE"],
  },
  {
    id: "avanzado",
    name: "Profesional",
    price: "$597",
    priceUnit: "/mes",
    description:
      "Para empresas en proceso activo de transformación con acompañamiento ejecutivo.",
    features: [
      { text: "Todo el plan Básico", included: true },
      { text: "Coaching A360 (12 herramientas)", included: true },
      { text: "Programa LEE", included: true },
      { text: "Hasta 3 usuarios", included: true },
      { text: "Soporte prioritario", included: true },
      { text: "Plan Estratégico", included: false },
      { text: "BizOS / Manual", included: false },
    ],
    maxUsers: 3,
    modulos: ["SIDE", "Coaching A360", "LEE"],
    popular: true,
  },
  {
    id: "corporativo",
    name: "Premium",
    price: "$997",
    priceUnit: "/mes",
    description: "Suite completa para empresas comprometidas con la transformación total.",
    features: [
      { text: "Todo el plan Profesional", included: true },
      { text: "Plan Estratégico completo", included: true },
      { text: "BizOS + Manual de Funciones", included: true },
      { text: "Marketing Digital", included: true },
      { text: "Hasta 5 usuarios", included: true },
      { text: "Soporte dedicado", included: true },
    ],
    maxUsers: 5,
    modulos: ["SIDE", "Coaching A360", "LEE", "Plan Estratégico", "Marketing Digital"],
  },
  {
    id: "enterprise",
    name: "Enterprise",
    price: "A medida",
    description:
      "Para grupos empresariales que requieren personalización total y white label.",
    features: [
      { text: "Todo el plan Premium", included: true },
      { text: "White label completo", included: true },
      { text: "Usuarios ilimitados", included: true },
      { text: "Integraciones a medida", included: true },
      { text: "SLA garantizado", included: true },
      { text: "Consultor dedicado", included: true },
    ],
    maxUsers: 0,
    modulos: ["SIDE", "Coaching A360", "LEE", "Plan Estratégico", "Marketing Digital", "BizOS", "Manual de Funciones"],
    dark: true,
  },
];


// ─── static activity items ────────────────────────────────────────────────────

const ACTIVIDADES_STATIC = [
  {
    icon: "👤",
    bg: "#EFF6FF",
    text: (
      <>
        <strong>María González</strong> completó el Radar de Liderazgo con{" "}
        <strong>Empresa Alnusan</strong> — Score: 7.2/10
      </>
    ),
    time: "Hoy 09:45",
  },
  {
    icon: "🤖",
    bg: "#ECFDF5",
    text: (
      <>
        Análisis IA generado para sesión #12 de{" "}
        <strong>Coaching A360</strong> — Empresa Textiles del Norte
      </>
    ),
    time: "Hoy 09:23",
  },
  {
    icon: "📊",
    bg: "#EDE9FE",
    text: (
      <>
        Diagnóstico SIDE completado — <strong>MediSalud Ecuador</strong> · IME: 62/100
      </>
    ),
    time: "Hoy 08:55",
  },
  {
    icon: "📦",
    bg: "#FEF3C7",
    text: (
      <>
        Plan actualizado: <strong>Textiles del Norte</strong> migró de Básico a Profesional
      </>
    ),
    time: "Ayer 17:30",
  },
  {
    icon: "🔐",
    bg: "#FEF2F2",
    text: (
      <>
        Intento de acceso fallido — usuario <strong>unknown@test.com</strong> · IP 45.xx.xx.xx
        bloqueado
      </>
    ),
    time: "Ayer 14:20",
  },
];

// ─── default app settings fallback ───────────────────────────────────────────

const DEFAULT_SETTINGS = {
  company_name: "Aceleradora 360",
  app_name: "A360SGP Suite",
  logo_url: null as string | null,
  primary_color: "#1a2b5a",
  accent_color: "#c9a84c",
  font_family: "DM Sans",
};

// ─── main component ───────────────────────────────────────────────────────────

function AdminPanel() {
  const { user, profile, role, loading } = useAuth();
  const navigate = useNavigate();
  const [section, setSection] = useState<AdminSection>("dashboard");
  const [usuarios, setUsuarios] = useState<AdminUserRow[]>([]);
  const [empresas, setEmpresas] = useState<AdminEmpresaRow[]>([]);
  const [settings, setSettings] = useState(DEFAULT_SETTINGS);
  const [dataLoaded, setDataLoaded] = useState(false);
  const [accessToken, setAccessToken] = useState<string | null>(null);
  const [refreshKey, setRefreshKey] = useState(0);
  const [hoveredEmpresaId, setHoveredEmpresaId] = useState<string | null>(null);
  const [plans, setPlans] = useState<PlanRecord[]>(DEFAULT_PLAN_RECORDS);
  const [planModal, setPlanModal] = useState<{ open: boolean; plan: PlanRecord | null }>({
    open: false,
    plan: null,
  });
  const [planSaving, setPlanSaving] = useState(false);

  // Auth guard
  useEffect(() => {
    if (loading) return;
    if (!user) { navigate({ to: "/login" }); return; }
    if (role && role !== "admin") {
      navigate({ to: "/app/dashboard" });
    }
  }, [loading, user, role, navigate]);

  // Load data
  useEffect(() => {
    if (!user || role !== "admin") return;

    const load = async () => {
      // Get session token for admin API calls
      const { data: sessionData } = await supabase.auth.getSession();
      const token = sessionData?.session?.access_token ?? null;
      setAccessToken(token);

      // Parallel fetch
      const [{ data: profiles }, { data: roles }, { data: clientes }, { data: appSettings }] =
        await Promise.all([
          supabase.from("profiles").select("id,email,name,company,created_at"),
          supabase.from("user_roles").select("user_id,role"),
          supabase
            .from("clientes")
            .select("id,nombre_empresa,sector,ciudad,plan_licencia,consultor_id,cliente_user_id,activo,created_at,descripcion,fecha_inicio_relacion,estado"),
          supabase.from("app_settings").select("*").eq("id", "global").maybeSingle(),
        ]);

      // Fetch auth extras (ban status + last sign-in) via server function
      type UserExtra = { id: string; banned_until: string | null; last_sign_in_at: string | null };
      const extras: UserExtra[] = token
        ? await adminListUsersExtra({ data: { accessToken: token } }).catch(() => [] as UserExtra[])
        : [];
      const extraMap = new Map<string, UserExtra>();
      for (const e of extras) extraMap.set(e.id, e);

      // Build user rows
      const roleMap = new Map<string, string>();
      for (const r of roles ?? []) roleMap.set(r.user_id, r.role);

      // Reverse maps: user_id → linked cliente id
      const clienteUserMap = new Map<string, string>(); // cliente_user_id → cliente.id
      const consultorClienteMap = new Map<string, string>(); // consultor_id → first cliente.id
      for (const c of clientes ?? []) {
        if (c.cliente_user_id) clienteUserMap.set(c.cliente_user_id, c.id);
        if (c.consultor_id && !consultorClienteMap.has(c.consultor_id)) {
          consultorClienteMap.set(c.consultor_id, c.id);
        }
      }

      const userRows: AdminUserRow[] = (profiles ?? []).map((p) => {
        const ext = extraMap.get(p.id);
        const bannedUntil = ext?.banned_until ?? null;
        const isActive = bannedUntil ? new Date(bannedUntil) <= new Date() : true;
        const userRole = roleMap.get(p.id) ?? "cliente";
        const empresaId =
          userRole === "cliente" || userRole === "participante"
            ? (clienteUserMap.get(p.id) ?? null)
            : userRole === "consultor"
              ? (consultorClienteMap.get(p.id) ?? null)
              : null;
        return {
          id: p.id,
          name: p.name ?? null,
          email: p.email,
          role: userRole,
          empresa: p.company ?? null,
          empresaId,
          plan: null,
          activo: isActive,
          ultimo_acceso: ext?.last_sign_in_at ?? null,
          created_at: p.created_at,
        };
      });
      setUsuarios(userRows);

      // Consultant name map (for empresa rows)
      const consultorMap = new Map<string, string>();
      for (const u of userRows) {
        if (u.role === "consultor" || u.role === "admin") {
          consultorMap.set(u.id, u.name ?? u.email);
        }
      }

      // Build empresa rows
      const planModulos = (plan: string): string[] =>
        ({
          esencial: ["SIDE"],
          avanzado: ["SIDE", "Coaching A360", "LEE"],
          corporativo: ["SIDE", "Coaching A360", "LEE", "Plan Estratégico"],
          enterprise: ["SIDE", "Coaching A360", "LEE", "Plan Estratégico", "BizOS"],
        })[plan] ?? ["SIDE"];

      const empresaRows: AdminEmpresaRow[] = (clientes ?? []).map((c) => ({
        id: c.id,
        nombre_empresa: c.nombre_empresa,
        sector: c.sector ?? null,
        ciudad: c.ciudad ?? null,
        plan_licencia: c.plan_licencia ?? "esencial",
        consultor_id: c.consultor_id ?? null,
        consultor_nombre: c.consultor_id
          ? (consultorMap.get(c.consultor_id) ?? null)
          : null,
        cliente_user_id: c.cliente_user_id ?? null,
        usuarios_activos: [c.consultor_id, c.cliente_user_id].filter(Boolean).length || 1,
        modulos: planModulos(c.plan_licencia ?? "esencial"),
        activo: c.activo ?? true,
        estado: (c as { estado?: string | null }).estado ?? null,
        descripcion: (c as { descripcion?: string | null }).descripcion ?? null,
        fecha_inicio_relacion:
          (c as { fecha_inicio_relacion?: string | null }).fecha_inicio_relacion ?? null,
        created_at: c.created_at,
      }));
      setEmpresas(empresaRows);

      if (appSettings) {
        setSettings({
          company_name: appSettings.company_name ?? DEFAULT_SETTINGS.company_name,
          app_name: appSettings.app_name ?? DEFAULT_SETTINGS.app_name,
          logo_url: appSettings.logo_url ?? null,
          primary_color: appSettings.primary_color ?? DEFAULT_SETTINGS.primary_color,
          accent_color: appSettings.accent_color ?? DEFAULT_SETTINGS.accent_color,
          font_family: appSettings.font_family ?? DEFAULT_SETTINGS.font_family,
        });
        // Load plans from content_strings if available
        const cs = appSettings.content_strings;
        if (
          cs &&
          typeof cs === "object" &&
          !Array.isArray(cs) &&
          "planes" in (cs as object) &&
          Array.isArray((cs as Record<string, unknown>).planes)
        ) {
          setPlans((cs as Record<string, unknown>).planes as PlanRecord[]);
        }
      }

      setDataLoaded(true);
    };

    load();
  }, [user, role, refreshKey]);

  // Save plans to app_settings.content_strings
  const savePlans = async (updatedPlan: PlanRecord) => {
    setPlanSaving(true);
    try {
      const isNew = !plans.some((p) => p.id === updatedPlan.id);
      const updatedPlans = isNew
        ? [...plans, updatedPlan]
        : plans.map((p) => (p.id === updatedPlan.id ? updatedPlan : p));

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
        // JSON round-trip satisfies Supabase's Json index-signature constraint
        .update({ content_strings: JSON.parse(JSON.stringify({ ...existingCs, planes: updatedPlans })) })
        .eq("id", "global");

      if (error) throw new Error(error.message);
      setPlans(updatedPlans);
      setPlanModal({ open: false, plan: null });
      toast.success(isNew ? "Plan creado exitosamente" : "Plan actualizado");
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Error al guardar plan");
    } finally {
      setPlanSaving(false);
    }
  };

  if (loading || !user) {
    return (
      <div
        style={{
          position: "fixed",
          top: 0, left: 0, right: 0, bottom: 0,
          zIndex: 1000,
          background: "#F5F7FF",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          fontFamily: "-apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif",
        }}
      >
        <div style={{ fontSize: "17px", fontWeight: 700, color: "#0C4A6E" }}>
          Cargando panel de administración…
        </div>
      </div>
    );
  }

  if (role && role !== "admin") return null;

  const initials = (profile?.name ?? user.email ?? "?")
    .split(" ")
    .map((s) => s[0] ?? "")
    .slice(0, 2)
    .join("")
    .toUpperCase();

  const counts = {
    usuarios: usuarios.length,
    empresas: empresas.length,
  };

  // ─── section renderers ────────────────────────────────────────────────────

  const renderDashboard = () => (
    <>
      {/* KPI grid */}
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(4, 1fr)",
          gap: "20px",
          marginBottom: "32px",
        }}
      >
        <AdminKpiCard
          icon="👥"
          value={dataLoaded ? usuarios.length : "—"}
          label="Usuarios activos"
          change="↑ +3 este mes"
          gradient="linear-gradient(135deg, #0C4A6E, #1E3A8A)"
        />
        <AdminKpiCard
          icon="🏢"
          value={dataLoaded ? empresas.length : "—"}
          label="Empresas clientes"
          change="↑ +1 este mes"
          gradient="linear-gradient(135deg, #065F46, #059669)"
        />
        <AdminKpiCard
          icon="🧩"
          value="6"
          label="Módulos activos"
          change="Coaching · SIDE · LEE..."
          gradient="linear-gradient(135deg, #312E81, #6366F1)"
        />
        <AdminKpiCard
          icon="📈"
          value="87%"
          label="Uso promedio plataforma"
          change="↑ +12% vs mes anterior"
          gradient="linear-gradient(135deg, #92580E, #BA7517)"
        />
      </div>

      {/* Actividad reciente */}
      <div style={tableCard}>
        <div
          style={{
            padding: "22px 28px",
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            borderBottom: "1px solid #F0F4FF",
          }}
        >
          <div style={{ fontSize: "19px", fontWeight: 800, color: "#0C4A6E" }}>
            Actividad reciente
          </div>
          <button
            onClick={() => setSection("actividad")}
            style={{
              padding: "11px 18px",
              borderRadius: "10px",
              background: "white",
              color: "#0EA5E9",
              fontSize: "14px",
              fontWeight: 600,
              border: "1.5px solid #BAE6FD",
              cursor: "pointer",
            }}
          >
            Ver todo →
          </button>
        </div>
        {ACTIVIDADES_STATIC.slice(0, 4).map((a, i) => (
          <div
            key={i}
            style={{
              display: "flex",
              gap: "16px",
              padding: "18px 28px",
              borderBottom: i < 3 ? "1px solid #F8FAFF" : undefined,
              alignItems: "flex-start",
            }}
          >
            <div
              style={{
                width: "38px",
                height: "38px",
                borderRadius: "11px",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                fontSize: "17px",
                flexShrink: 0,
                background: a.bg,
              }}
            >
              {a.icon}
            </div>
            <div style={{ fontSize: "15px", color: "#374151", lineHeight: "1.65", flex: 1 }}>
              {a.text}
            </div>
            <div
              style={{
                fontSize: "13px",
                color: "#94A3B8",
                whiteSpace: "nowrap",
                fontWeight: 600,
              }}
            >
              {a.time}
            </div>
          </div>
        ))}
      </div>

      {/* Empresas por plan */}
      <div style={tableCard}>
        <div
          style={{
            padding: "22px 28px",
            borderBottom: "1px solid #F0F4FF",
          }}
        >
          <div style={{ fontSize: "19px", fontWeight: 800, color: "#0C4A6E" }}>
            Empresas por plan
          </div>
        </div>
        <div style={{ overflowX: "auto" }}>
          <table style={{ width: "100%", borderCollapse: "collapse" }}>
            <thead>
              <tr>
                {["Empresa", "Plan", "Usuarios", "Módulos activos", "Estado"].map((h) => (
                  <th
                    key={h}
                    style={{
                      fontSize: "12px",
                      fontWeight: 700,
                      color: "#94A3B8",
                      textTransform: "uppercase",
                      letterSpacing: "0.08em",
                      padding: "14px 28px",
                      textAlign: "left",
                      background: "#F8FAFF",
                      borderBottom: "1px solid #F0F4FF",
                    }}
                  >
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {(dataLoaded ? empresas.slice(0, 5) : []).map((e, i) => (
                <tr
                  key={e.id}
                  onMouseEnter={() => setHoveredEmpresaId(e.id)}
                  onMouseLeave={() => setHoveredEmpresaId(null)}
                  style={{ background: hoveredEmpresaId === e.id ? "#F8FAFF" : "white", cursor: "pointer" }}
                >
                  <td
                    style={{
                      padding: "18px 28px",
                      fontSize: "15px",
                      color: "#374151",
                      borderBottom: i < empresas.slice(0, 5).length - 1 ? "1px solid #F8FAFF" : undefined,
                      verticalAlign: "middle",
                    }}
                  >
                    <div style={{ display: "flex", alignItems: "center", gap: "14px" }}>
                      <div
                        style={{
                          width: "38px",
                          height: "38px",
                          borderRadius: "10px",
                          background: "linear-gradient(135deg, #0EA5E9, #6366F1)",
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "center",
                          color: "white",
                          fontWeight: 800,
                          fontSize: "15px",
                          flexShrink: 0,
                        }}
                      >
                        {e.nombre_empresa[0]?.toUpperCase()}
                      </div>
                      <div>
                        <div style={{ fontWeight: 700, color: "#0C4A6E" }}>
                          {e.nombre_empresa}
                        </div>
                        <div style={{ fontSize: "13px", color: "#94A3B8" }}>
                          {[e.sector, e.ciudad].filter(Boolean).join(" · ") || "—"}
                        </div>
                      </div>
                    </div>
                  </td>
                  <td
                    style={{
                      padding: "18px 28px",
                      fontSize: "15px",
                      color: "#374151",
                      borderBottom: i < empresas.slice(0, 5).length - 1 ? "1px solid #F8FAFF" : undefined,
                      verticalAlign: "middle",
                    }}
                  >
                    <span
                      style={{
                        display: "inline-flex",
                        alignItems: "center",
                        fontSize: "12px",
                        fontWeight: 700,
                        padding: "5px 13px",
                        borderRadius: "999px",
                        background: "#F5F7FF",
                        color: "#6366F1",
                        border: "1px solid #E0E7FF",
                      }}
                    >
                      {e.plan_licencia}
                    </span>
                  </td>
                  <td
                    style={{
                      padding: "18px 28px",
                      fontSize: "15px",
                      color: "#374151",
                      borderBottom: i < empresas.slice(0, 5).length - 1 ? "1px solid #F8FAFF" : undefined,
                      verticalAlign: "middle",
                    }}
                  >
                    {e.usuarios_activos}
                  </td>
                  <td
                    style={{
                      padding: "18px 28px",
                      fontSize: "13px",
                      color: "#64748B",
                      borderBottom: i < empresas.slice(0, 5).length - 1 ? "1px solid #F8FAFF" : undefined,
                      verticalAlign: "middle",
                    }}
                  >
                    {e.modulos.join(" · ")}
                  </td>
                  <td
                    style={{
                      padding: "18px 28px",
                      fontSize: "15px",
                      color: "#374151",
                      borderBottom: i < empresas.slice(0, 5).length - 1 ? "1px solid #F8FAFF" : undefined,
                      verticalAlign: "middle",
                    }}
                  >
                    <span
                      style={{
                        display: "inline-flex",
                        alignItems: "center",
                        gap: "5px",
                        fontSize: "12px",
                        fontWeight: 700,
                        padding: "5px 13px",
                        borderRadius: "999px",
                        background: e.activo ? "#ECFDF5" : "#FEF2F2",
                        color: e.activo ? "#059669" : "#DC2626",
                      }}
                    >
                      ● {e.activo ? "Activo" : "Inactivo"}
                    </span>
                  </td>
                </tr>
              ))}
              {dataLoaded && empresas.length === 0 && (
                <tr>
                  <td
                    colSpan={5}
                    style={{
                      padding: "32px 28px",
                      textAlign: "center",
                      color: "#94A3B8",
                      fontSize: "15px",
                    }}
                  >
                    No hay empresas registradas aún
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </>
  );

  const renderActividad = () => (
    <div style={tableCard}>
      <div
        style={{
          padding: "22px 28px",
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          borderBottom: "1px solid #F0F4FF",
        }}
      >
        <div style={{ fontSize: "19px", fontWeight: 800, color: "#0C4A6E" }}>
          Log de actividad
        </div>
        <button
          style={{
            padding: "11px 18px",
            borderRadius: "10px",
            background: "white",
            color: "#0EA5E9",
            fontSize: "14px",
            fontWeight: 600,
            border: "1.5px solid #BAE6FD",
            cursor: "pointer",
          }}
        >
          Exportar CSV
        </button>
      </div>
      {ACTIVIDADES_STATIC.map((a, i) => (
        <div
          key={i}
          style={{
            display: "flex",
            gap: "16px",
            padding: "18px 28px",
            borderBottom: i < ACTIVIDADES_STATIC.length - 1 ? "1px solid #F8FAFF" : undefined,
            alignItems: "flex-start",
          }}
        >
          <div
            style={{
              width: "38px",
              height: "38px",
              borderRadius: "11px",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              fontSize: "17px",
              flexShrink: 0,
              background: a.bg,
            }}
          >
            {a.icon}
          </div>
          <div style={{ fontSize: "15px", color: "#374151", lineHeight: "1.65", flex: 1 }}>
            {a.text}
          </div>
          <div
            style={{
              fontSize: "13px",
              color: "#94A3B8",
              whiteSpace: "nowrap",
              fontWeight: 600,
            }}
          >
            {a.time}
          </div>
        </div>
      ))}
    </div>
  );

  const SECTION_META: Record<AdminSection, { eyebrow: string; title: string; sub: string }> = {
    dashboard: {
      eyebrow: "Panel de Administración",
      title: "Dashboard general",
      sub: "Vista consolidada de toda la plataforma A360SGP",
    },
    actividad: {
      eyebrow: "Monitoreo",
      title: "Actividad reciente",
      sub: "Registro completo de todas las acciones realizadas en la plataforma",
    },
    usuarios: {
      eyebrow: "Gestión de usuarios",
      title: "Usuarios de la plataforma",
      sub: "Administra todos los usuarios, roles y accesos de la plataforma",
    },
    empresas: {
      eyebrow: "Gestión de empresas",
      title: "Empresas clientes",
      sub: "Administra las empresas, sus planes y accesos a módulos de la plataforma",
    },
    planes: {
      eyebrow: "Planes y suscripciones",
      title: "Estructura de planes",
      sub: "Define qué módulos y funcionalidades incluye cada plan de la plataforma",
    },
    permisos: {
      eyebrow: "Control de accesos",
      title: "Permisos por rol",
      sub: "Define qué puede ver y hacer cada rol en cada módulo de la plataforma",
    },
    modulos: {
      eyebrow: "Control de módulos",
      title: "Módulos de la plataforma",
      sub: "Activa o desactiva módulos globalmente para toda la plataforma o por empresa",
    },
    configuracion: {
      eyebrow: "Sistema",
      title: "Configuración de la plataforma",
      sub: "Personaliza la identidad visual, tipografía, colores y aspectos legales",
    },
  };

  const meta = SECTION_META[section];

  return (
    <div
      style={{
        position: "fixed",
        top: 0, left: 0, right: 0, bottom: 0,
        zIndex: 1000,
        background: "#F5F7FF",
        fontFamily: "-apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif",
        fontSize: "17px",
        lineHeight: "1.85",
        color: "#1E293B",
        display: "flex",
        flexDirection: "column",
        overflow: "hidden",
      }}
    >
      {/* ── TOPBAR ─────────────────────────────────────────────────────────── */}
      <div
        style={{
          background: "linear-gradient(135deg, #0C4A6E, #1E3A8A)",
          height: "56px",
          display: "flex",
          alignItems: "center",
          padding: "0 32px",
          gap: "16px",
          flexShrink: 0,
        }}
      >
        <div
          style={{
            fontSize: "17px",
            fontWeight: 900,
            color: "white",
            letterSpacing: "-0.02em",
          }}
        >
          A360<span style={{ color: "#38BDF8" }}>SGP</span>
        </div>

        <div
          style={{
            background: "rgba(239,68,68,0.2)",
            border: "1px solid rgba(239,68,68,0.4)",
            color: "#FCA5A5",
            fontSize: "12px",
            fontWeight: 700,
            padding: "4px 12px",
            borderRadius: "20px",
            textTransform: "uppercase",
            letterSpacing: "0.08em",
          }}
        >
          🔐 Panel Admin
        </div>

        <div style={{ marginLeft: "auto", display: "flex", alignItems: "center", gap: "14px" }}>
          <button
            onClick={() => navigate({ to: "/app/dashboard" })}
            style={{
              fontSize: "13px",
              fontWeight: 600,
              color: "rgba(255,255,255,0.7)",
              background: "none",
              border: "none",
              cursor: "pointer",
              padding: "6px 12px",
              borderRadius: "8px",
            }}
          >
            ← Volver al app
          </button>
          <div
            style={{
              width: "36px",
              height: "36px",
              borderRadius: "50%",
              background: "linear-gradient(135deg, #0EA5E9, #6366F1)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              fontSize: "14px",
              fontWeight: 800,
              color: "white",
            }}
          >
            {initials}
          </div>
          <div
            style={{
              fontSize: "14px",
              fontWeight: 600,
              color: "rgba(255,255,255,0.8)",
            }}
          >
            {profile?.name ?? user.email} · Super Admin
          </div>
        </div>
      </div>

      {/* ── LAYOUT ─────────────────────────────────────────────────────────── */}
      <div style={{ display: "flex", flex: 1, overflow: "hidden" }}>
        <AdminSidebar active={section} onChange={setSection} counts={counts} />

        {/* ── MAIN CONTENT ──────────────────────────────────────────────── */}
        <main
          style={{
            flex: 1,
            overflowY: "auto",
            padding: "36px",
          }}
        >
          {/* Page header */}
          <div style={{ marginBottom: "36px" }}>
            <div style={pageEyebrow}>
              <span
                style={{
                  display: "inline-block",
                  width: "24px",
                  height: "3px",
                  background: "linear-gradient(90deg, #0EA5E9, #6366F1)",
                  borderRadius: "2px",
                }}
              />
              {meta.eyebrow}
            </div>
            <div style={pageTitle}>{meta.title}</div>
            <div style={pageSub}>{meta.sub}</div>
          </div>

          {/* Section content */}
          {section === "dashboard" && renderDashboard()}

          {section === "actividad" && renderActividad()}

          {section === "usuarios" && (
            <AdminUserTable
              usuarios={dataLoaded ? usuarios : []}
              accessToken={accessToken}
              clientes={empresas.map(e => ({ id: e.id, nombre_empresa: e.nombre_empresa }))}
              onRefresh={() => setRefreshKey(k => k + 1)}
            />
          )}

          {section === "empresas" && (
            <AdminEmpresaTable
              empresas={dataLoaded ? empresas : []}
              consultores={usuarios
                .filter((u) => u.role === "consultor" || u.role === "admin")
                .map((u) => ({ id: u.id, nombre: u.name ?? u.email }))}
              onRefresh={() => setRefreshKey((k) => k + 1)}
            />
          )}

          {section === "planes" && (() => {
            // Real client count per plan id
            const clientCountByPlan = new Map<string, number>();
            for (const e of empresas) {
              clientCountByPlan.set(
                e.plan_licencia,
                (clientCountByPlan.get(e.plan_licencia) ?? 0) + 1,
              );
            }
            return (
              <>
                {/* Toolbar */}
                <div
                  style={{
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "space-between",
                    marginBottom: "24px",
                    flexWrap: "wrap",
                    gap: "12px",
                  }}
                >
                  <div style={{ fontSize: "17px", fontWeight: 700, color: "#0C4A6E" }}>
                    {plans.length} plan{plans.length !== 1 ? "es" : ""} configurados
                  </div>
                  <button
                    onClick={() => setPlanModal({ open: true, plan: null })}
                    style={{
                      padding: "11px 22px",
                      borderRadius: "10px",
                      background: "linear-gradient(135deg, #0EA5E9, #6366F1)",
                      color: "white",
                      fontSize: "14px",
                      fontWeight: 700,
                      border: "none",
                      cursor: "pointer",
                      boxShadow: "0 4px 14px rgba(14,165,233,0.3)",
                    }}
                  >
                    + Nuevo plan
                  </button>
                </div>
                {/* Plan cards */}
                <div
                  style={{
                    display: "grid",
                    gridTemplateColumns: "repeat(auto-fill, minmax(260px, 1fr))",
                    gap: "20px",
                  }}
                >
                  {plans.map((p) => (
                    <AdminPlanCard
                      key={p.id}
                      plan={{
                        name: p.name,
                        price: p.price,
                        priceUnit: p.priceUnit,
                        description: p.description,
                        features: p.features,
                        clientCount: clientCountByPlan.get(p.id) ?? 0,
                        popular: p.popular,
                        dark: p.dark,
                      }}
                      onEdit={() => setPlanModal({ open: true, plan: p })}
                    />
                  ))}
                </div>
              </>
            );
          })()}

          {section === "permisos" && <AdminPermisosMatrix />}

          {section === "modulos" && (
            <AdminModulosSection empresas={dataLoaded ? empresas : []} />
          )}

          {section === "configuracion" && <AdminConfiguracion settings={settings} />}
        </main>
      </div>

      {/* Plan editor modal */}
      {planModal.open && (
        <AdminPlanEditor
          plan={planModal.plan}
          onClose={() => setPlanModal({ open: false, plan: null })}
          onSave={savePlans}
          saving={planSaving}
        />
      )}
    </div>
  );
}
