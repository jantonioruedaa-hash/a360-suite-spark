import { createFileRoute, Outlet, Link, useRouterState, useParams, redirect } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { ESTADOS } from "@/lib/clientes-helpers";
import { Badge } from "@/components/ui/badge";
import {
  LayoutDashboard, Building2, Users, Activity, FileText,
  BarChart3, Target, Users2, BookOpen, Sparkles, ArrowLeft, Rocket,
} from "lucide-react";

export const Route = createFileRoute("/app/clientes/$clienteId")({
  component: ClienteLayout,
  beforeLoad: ({ params, location }) => {
    if (location.pathname === `/app/clientes/${params.clienteId}` || location.pathname === `/app/clientes/${params.clienteId}/`) {
      throw redirect({ to: "/app/clientes/$clienteId/resumen", params: { clienteId: params.clienteId } });
    }
  },
});

interface ClienteFull {
  id: string;
  nombre_empresa: string;
  nombre_comercial: string | null;
  sector: string | null;
  subsector: string | null;
  estado: string | null;
  plan_licencia: string;
  logo_url: string | null;
  fecha_inicio_relacion: string | null;
}

const SECCIONES = [
  { url: "onboarding", label: "Onboarding", icon: Rocket },
  { url: "resumen", label: "Resumen ejecutivo", icon: LayoutDashboard },
  { url: "empresa", label: "Información empresa", icon: Building2 },
  { url: "contactos", label: "Contactos", icon: Users },
  { url: "actividades", label: "Actividades", icon: Activity },
  { url: "cotizaciones", label: "Cotizaciones", icon: FileText },
  { url: "side", label: "Diagnósticos SIDE", icon: BarChart3 },
  { url: "plan", label: "Plan estratégico", icon: Target },
  { url: "coaching", label: "Coaching Platform", icon: Users2 },
  { url: "lee", label: "Programa LEE", icon: BookOpen },
  { url: "analisis-ia", label: "Análisis IA", icon: Sparkles },
];

function ClienteLayout() {
  const { clienteId } = useParams({ from: "/app/clientes/$clienteId" });
  const [cliente, setCliente] = useState<ClienteFull | null>(null);
  const path = useRouterState({ select: (r) => r.location.pathname });

  useEffect(() => {
    supabase.from("clientes")
      .select("id,nombre_empresa,nombre_comercial,sector,subsector,estado,plan_licencia,logo_url,fecha_inicio_relacion")
      .eq("id", clienteId).maybeSingle()
      .then(({ data }) => setCliente(data as ClienteFull | null));
  }, [clienteId]);

  if (!cliente) {
    return <div className="p-8 text-center text-muted-foreground">Cargando cliente…</div>;
  }

  const estado = ESTADOS.find((e) => e.value === (cliente.estado ?? "activo"));
  const isActive = (url: string) => path.endsWith(`/${url}`) || path.includes(`/${url}/`);

  return (
    <div className="-m-6 lg:-m-8 min-h-[calc(100vh-4rem)] flex flex-col">
      {/* Topbar cliente */}
      <div className="bg-white border-b border-border sticky top-0 z-20 px-6 py-3 flex items-center gap-4 flex-wrap">
        <Link to="/app/clientes" className="text-muted-foreground hover:text-navy text-xs flex items-center gap-1">
          <ArrowLeft className="w-3 h-3" /> Clientes
        </Link>
        <div className="flex items-center gap-3 flex-1 min-w-0">
          {cliente.logo_url ? (
            <img src={cliente.logo_url} alt="" className="w-10 h-10 rounded border object-cover" />
          ) : (
            <div className="w-10 h-10 rounded bg-navy text-white flex items-center justify-center font-display">
              {cliente.nombre_empresa[0]}
            </div>
          )}
          <div className="min-w-0">
            <div className="font-display text-navy text-lg leading-tight truncate">{cliente.nombre_empresa}</div>
            <div className="text-xs text-muted-foreground truncate">
              {cliente.nombre_comercial ?? cliente.sector ?? "—"}
              {cliente.subsector && ` · ${cliente.subsector}`}
            </div>
          </div>
        </div>
        <div className="flex items-center gap-2">
          {estado && <Badge variant="outline" className={estado.color}>{estado.label}</Badge>}
          <Badge variant="outline" className="capitalize">{cliente.plan_licencia}</Badge>
        </div>
      </div>

      {/* Tabs horizontales (visible en todos los tamaños) */}
      <div className="bg-white border-b border-border sticky top-[61px] z-10 px-2 overflow-x-auto">
        <nav className="flex gap-1 min-w-max">
          {SECCIONES.map((s) => (
            <Link key={s.url}
              to={`/app/clientes/$clienteId/${s.url}` as "/app/clientes/$clienteId/resumen"}
              params={{ clienteId }}
              className={`flex items-center gap-1.5 px-3 py-2.5 text-xs whitespace-nowrap border-b-2 transition ${
                isActive(s.url)
                  ? "border-gold text-navy font-semibold"
                  : "border-transparent text-muted-foreground hover:text-navy"
              }`}>
              <s.icon className="w-3.5 h-3.5" />
              {s.label}
            </Link>
          ))}
        </nav>
      </div>

      <div className="flex-1 p-6 lg:p-8 min-w-0 overflow-x-auto">
        <Outlet />
      </div>
    </div>
  );
}
