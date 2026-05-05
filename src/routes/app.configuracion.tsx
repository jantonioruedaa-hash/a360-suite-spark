import { createFileRoute } from "@tanstack/react-router";
import { useAuth } from "@/lib/auth-context";

export const Route = createFileRoute("/app/configuracion")({ component: Config });

function Config() {
  const { user, profile, role } = useAuth();
  return (
    <div className="max-w-2xl">
      <h1 className="font-display text-3xl text-navy">Configuración</h1>
      <div className="a360-card a360-card-lg p-6 mt-6 space-y-3 text-sm">
        <div className="flex justify-between"><span className="text-muted-foreground">Correo</span><span className="text-navy font-medium">{user?.email}</span></div>
        <div className="flex justify-between"><span className="text-muted-foreground">Nombre</span><span className="text-navy font-medium">{profile?.name ?? "—"}</span></div>
        <div className="flex justify-between"><span className="text-muted-foreground">Rol</span><span className="text-gold font-semibold uppercase tracking-wider text-xs">{role ?? "—"}</span></div>
      </div>
    </div>
  );
}
