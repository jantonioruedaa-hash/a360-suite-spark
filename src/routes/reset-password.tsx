import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect, useMemo, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { A360Logo } from "@/components/A360Logo";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import { Loader2 } from "lucide-react";

export const Route = createFileRoute("/reset-password")({ component: ResetPasswordPage });

function parseAuthParams(): { error?: string; errorCode?: string; errorDescription?: string; hasRecoveryHash: boolean } {
  if (typeof window === "undefined") return { hasRecoveryHash: false };
  const out: { error?: string; errorCode?: string; errorDescription?: string; hasRecoveryHash: boolean } = { hasRecoveryHash: false };
  const search = new URLSearchParams(window.location.search);
  const hash = new URLSearchParams(window.location.hash.replace(/^#/, ""));
  out.error = search.get("error") ?? hash.get("error") ?? undefined;
  out.errorCode = search.get("error_code") ?? hash.get("error_code") ?? undefined;
  out.errorDescription = search.get("error_description") ?? hash.get("error_description") ?? undefined;
  out.hasRecoveryHash = hash.get("type") === "recovery" || !!hash.get("access_token");
  return out;
}

function ResetPasswordPage() {
  const navigate = useNavigate();
  const params = useMemo(() => parseAuthParams(), []);
  const [ready, setReady] = useState(false);
  const [invalidLink, setInvalidLink] = useState(!!params.error);
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [requestEmail, setRequestEmail] = useState("");
  const [requesting, setRequesting] = useState(false);

  useEffect(() => {
    if (params.error) return; // ya sabemos que el link está expirado/inválido
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

    const t = setTimeout(() => {
      if (!resolved) setInvalidLink(true);
    }, 4000);

    return () => {
      sub.subscription.unsubscribe();
      clearTimeout(t);
    };
  }, [params.error]);

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

  const handleRequestNew = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!requestEmail.trim()) {
      toast.error("Ingresa tu correo electrónico.");
      return;
    }
    setRequesting(true);
    try {
      const { error } = await supabase.auth.resetPasswordForEmail(requestEmail.trim(), {
        redirectTo: `${window.location.origin}/reset-password`,
      });
      if (error) throw error;
      toast.success("Te enviamos un nuevo enlace. Revisa tu correo y haz clic una sola vez.");
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "No se pudo enviar el enlace.");
    } finally {
      setRequesting(false);
    }
  };

  const expiredMessage = params.errorCode === "otp_expired"
    ? "El enlace ya fue usado o expiró. Los enlaces de recuperación son de un solo uso y caducan rápidamente."
    : "El enlace de recuperación no es válido o ya expiró.";

  return (
    <div className="relative min-h-screen overflow-hidden bg-cream flex items-center justify-center px-4 py-10">
      <div className="watermark-side font-display">SIDE</div>

      <div className="relative w-full max-w-md a360-card a360-card-lg p-10 z-10">
        <div className="flex flex-col items-center text-center">
          <A360Logo size={56} withText={false} />
          <h1 className="font-display text-2xl text-navy mt-4">Restablecer contraseña</h1>
          <p className="text-sm text-muted-foreground mt-1">
            {invalidLink ? "Solicita un nuevo enlace de recuperación" : "Ingresa y confirma tu nueva contraseña"}
          </p>
          <div className="h-px w-16 bg-gold mt-5 mb-6" />
        </div>

        {invalidLink ? (
          <div className="space-y-5">
            <div className="rounded-md border border-amber-300/60 bg-amber-50 text-amber-900 text-sm p-3">
              <p className="font-medium mb-1">Enlace no válido</p>
              <p>{expiredMessage}</p>
              <p className="mt-2 text-xs">
                Algunos correos (Gmail corporativo, Outlook, antivirus) abren los enlaces automáticamente para escanearlos y los consumen antes de que tú hagas clic. Solicita uno nuevo y ábrelo de inmediato.
              </p>
            </div>

            <form onSubmit={handleRequestNew} className="space-y-3">
              <div className="space-y-1.5">
                <Label htmlFor="requestEmail">Tu correo electrónico</Label>
                <Input
                  id="requestEmail"
                  type="email"
                  value={requestEmail}
                  onChange={(e) => setRequestEmail(e.target.value)}
                  placeholder="tu@correo.com"
                  required
                  autoComplete="email"
                />
              </div>
              <Button type="submit" disabled={requesting} className="w-full bg-navy text-primary-foreground hover:bg-navy/90 h-11">
                {requesting && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
                Enviar nuevo enlace
              </Button>
            </form>

            <div className="text-center text-xs text-muted-foreground pt-1">
              <button type="button" onClick={() => navigate({ to: "/login" })} className="text-gold font-medium hover:underline">
                Volver al inicio de sesión
              </button>
            </div>
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
