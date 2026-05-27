import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { A360Logo } from "@/components/A360Logo";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import { Loader2 } from "lucide-react";

export const Route = createFileRoute("/reset-password")({ component: ResetPasswordPage });

function ResetPasswordPage() {
  const navigate = useNavigate();
  const [ready, setReady] = useState(false);
  const [invalidLink, setInvalidLink] = useState(false);
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [submitting, setSubmitting] = useState(false);

  // Supabase parsea automáticamente el hash con el token de recovery y emite
  // el evento PASSWORD_RECOVERY. Esperamos ese evento (o una sesión existente)
  // antes de permitir el cambio de contraseña.
  useEffect(() => {
    let resolved = false;

    const { data: sub } = supabase.auth.onAuthStateChange((event, session) => {
      if (event === "PASSWORD_RECOVERY" || (event === "SIGNED_IN" && session)) {
        resolved = true;
        setReady(true);
      }
    });

    supabase.auth.getSession().then(({ data }) => {
      if (data.session) {
        resolved = true;
        setReady(true);
      }
    });

    // Si en 3s no hay sesión ni evento de recovery, el enlace no es válido.
    const t = setTimeout(() => {
      if (!resolved) setInvalidLink(true);
    }, 3000);

    return () => {
      sub.subscription.unsubscribe();
      clearTimeout(t);
    };
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (password.length < 6) {
      toast.error("La contraseña debe tener al menos 6 caracteres.");
      return;
    }
    if (password !== confirm) {
      toast.error("Las contraseñas no coinciden.");
      return;
    }
    setSubmitting(true);
    try {
      const { error } = await supabase.auth.updateUser({ password });
      if (error) throw error;
      await supabase.auth.signOut();
      toast.success("Contraseña actualizada correctamente.");
      navigate({ to: "/login", search: { reset: "1" } as never });
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "No se pudo actualizar la contraseña.");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="relative min-h-screen overflow-hidden bg-cream flex items-center justify-center px-4">
      <div className="watermark-side font-display">SIDE</div>

      <div className="relative w-full max-w-md a360-card a360-card-lg p-10 z-10">
        <div className="flex flex-col items-center text-center">
          <A360Logo size={56} withText={false} />
          <h1 className="font-display text-2xl text-navy mt-4">Restablecer contraseña</h1>
          <p className="text-sm text-muted-foreground mt-1">
            Ingresa y confirma tu nueva contraseña
          </p>
          <div className="h-px w-16 bg-gold mt-5 mb-6" />
        </div>

        {invalidLink ? (
          <div className="text-center space-y-4">
            <p className="text-sm text-muted-foreground">
              El enlace de recuperación no es válido o ya expiró. Solicita uno nuevo desde la pantalla de inicio de sesión.
            </p>
            <Button onClick={() => navigate({ to: "/login" })} className="w-full bg-navy text-primary-foreground hover:bg-navy/90 h-11">
              Volver al inicio de sesión
            </Button>
          </div>
        ) : !ready ? (
          <div className="flex items-center justify-center py-10 text-muted-foreground">
            <Loader2 className="w-5 h-5 mr-2 animate-spin" /> Validando enlace…
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-1.5">
              <Label htmlFor="password">Nueva contraseña</Label>
              <Input id="password" type="password" value={password} onChange={(e) => setPassword(e.target.value)} required minLength={6} autoComplete="new-password" />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="confirm">Confirmar contraseña</Label>
              <Input id="confirm" type="password" value={confirm} onChange={(e) => setConfirm(e.target.value)} required minLength={6} autoComplete="new-password" />
            </div>

            <Button type="submit" disabled={submitting} className="w-full bg-navy text-primary-foreground hover:bg-navy/90 h-11 mt-2">
              {submitting && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
              Guardar nueva contraseña
            </Button>

            <div className="text-center text-xs text-muted-foreground pt-2">
              <button type="button" onClick={() => navigate({ to: "/login" })} className="text-gold font-medium hover:underline">
                Volver a iniciar sesión
              </button>
            </div>
          </form>
        )}

        <div className="mt-8 pt-6 border-t border-border/60 text-center text-[11px] text-muted-foreground tracking-wide">
          A360SGP Suite v2.0 · Acceso restringido
        </div>
      </div>
    </div>
  );
}
