import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/lib/auth-context";

export const Route = createFileRoute("/app/clientes")({ component: ClientesPage });

interface Cliente {
  id: string;
  nombre_empresa: string;
  sector: string | null;
  tamano: string | null;
  pais: string | null;
  ciudad: string | null;
  plan_licencia: string;
  updated_at: string;
}

function ClientesPage() {
  const { user } = useAuth();
  const [clientes, setClientes] = useState<Cliente[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) return;
    supabase
      .from("clientes")
      .select("id,nombre_empresa,sector,tamano,pais,ciudad,plan_licencia,updated_at")
      .eq("activo", true)
      .order("nombre_empresa")
      .then(({ data }) => {
        setClientes((data ?? []) as Cliente[]);
        setLoading(false);
      });
  }, [user]);

  return (
    <div className="max-w-[1400px]">
      <h1 className="font-display text-3xl text-navy">Mis clientes</h1>
      <p className="text-sm text-muted-foreground mt-1">Cartera completa asignada a tu cuenta.</p>

      <div className="a360-card a360-card-lg mt-6 overflow-hidden">
        {loading ? (
          <div className="p-8 text-center text-muted-foreground text-sm">Cargando…</div>
        ) : clientes.length === 0 ? (
          <div className="p-8 text-center text-muted-foreground text-sm">No tienes clientes asignados aún.</div>
        ) : (
          <table className="w-full text-sm">
            <thead className="bg-cream text-navy">
              <tr className="text-left">
                <th className="px-5 py-3 font-semibold text-xs uppercase tracking-wider">Empresa</th>
                <th className="px-5 py-3 font-semibold text-xs uppercase tracking-wider">Sector</th>
                <th className="px-5 py-3 font-semibold text-xs uppercase tracking-wider">Ubicación</th>
                <th className="px-5 py-3 font-semibold text-xs uppercase tracking-wider">Plan</th>
                <th className="px-5 py-3 font-semibold text-xs uppercase tracking-wider">Actualizado</th>
              </tr>
            </thead>
            <tbody>
              {clientes.map((c) => (
                <tr key={c.id} className="border-t border-border/60 hover:bg-cream/50">
                  <td className="px-5 py-3 font-medium text-navy">{c.nombre_empresa}</td>
                  <td className="px-5 py-3 text-muted-foreground">{c.sector ?? "—"}</td>
                  <td className="px-5 py-3 text-muted-foreground">
                    {[c.ciudad, c.pais].filter(Boolean).join(", ") || "—"}
                  </td>
                  <td className="px-5 py-3 text-muted-foreground capitalize">{c.plan_licencia}</td>
                  <td className="px-5 py-3 text-muted-foreground text-xs">
                    {new Date(c.updated_at).toLocaleDateString()}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}
