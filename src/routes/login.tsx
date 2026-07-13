import { createFileRoute, useNavigate, Link, redirect } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/lib/auth-context";
import { A360Logo } from "@/components/A360Logo";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import { Loader2 } from "lucide-react";

export const Route = createFileRoute("/login")({
  component: LoginPage,
  head: () => ({
    meta: [
      { title: "Iniciar sesión | A360SGP Suite" },
      { name: "description", content: "Accede a Aceleradora 360 SGP: panel de consultoría para PyMEs con Plan Estratégico, Coaching, programa LEE y diagnóstico SIDE." },
      { property: "og:title", content: "Iniciar sesión | A360SGP Suite" },
      { property: "og:description", content: "Acceso al portal de consultores y administradores de Aceleradora 360 SGP." },
      { property: "og:url", content: "https://a360-suite-spark.lovable.app/login" },
      { property: "og:type", content: "website" },
      { name: "twitter:title", content: "Iniciar sesión | A360SGP Suite" },
      { name: "twitter:description", content: "Acceso al portal de Aceleradora 360 SGP." },
    ],
    links: [{ rel: "canonical", href: "https://a360-suite-spark.lovable.app/login" }],
  }),
});

function LoginPage() {
  const navigate = useNavigate();
  const { user, loading: authLoading } = useAuth();
  const [mode, setMode] = useState<"signin" | "signup" | "reset">("signin");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [name, setName] = useState("");
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (!authLoading && user) navigate({ to: "/app/dashboard" });
  }, [authLoading, user, navigate]);

  useEffect(() => {
    if (typeof window !== "undefined" && new URLSearchParams(window.location.search).get("reset") === "1") {
      toast.success("Contraseña actualizada. Inicia sesión con tu nueva contraseña.");
      window.history.replaceState({}, "", "/login");
    }
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      if (mode === "signin") {
        const { error } = await supabase.auth.signInWithPassword({ email, password });
        if (error) throw error;
        toast.success("Bienvenido de vuelta");
      } else if (mode === "signup") {
        const { error } = await supabase.auth.signUp({
          email, password,
          options: { emailRedirectTo: `${window.location.origin}/app/dashboard`, data: { name } },
        });
        if (error) throw error;
        toast.success("Cuenta creada. Revisa tu correo para verificar.");
      } else {
        const { error } = await supabase.auth.resetPasswordForEmail(email, {
          redirectTo: `${window.location.origin}/reset-password`,
        });
        if (error) throw error;
        toast.success("Te enviamos un correo para restablecer tu contraseña.");
        setMode("signin");
      }
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Error de autenticación");
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
          <h1 className="font-display text-2xl text-navy mt-4">Acceso a Aceleradora 360 SGP</h1>
          <p className="text-sm text-muted-foreground mt-1">
            Sistema Integral de Transformación Empresarial
          </p>
          <div className="h-px w-16 bg-gold mt-5 mb-6" />
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          {mode === "signup" && (
            <div className="space-y-1.5">
              <Label htmlFor="name">Nombre completo</Label>
              <Input id="name" value={name} onChange={(e) => setName(e.target.value)} required />
            </div>
          )}
          <div className="space-y-1.5">
            <Label htmlFor="email">Correo electrónico</Label>
            <Input id="email" type="email" value={email} onChange={(e) => setEmail(e.target.value)} required autoComplete="email" />
          </div>
          {mode !== "reset" && (
            <div className="space-y-1.5">
              <div className="flex items-center justify-between">
                <Label htmlFor="password">Contraseña</Label>
                {mode === "signin" && (
                  <button type="button" onClick={() => setMode("reset")} className="text-xs text-gold hover:underline">
                    ¿Olvidaste tu contraseña?
                  </button>
                )}
              </div>
              <Input id="password" type="password" value={password} onChange={(e) => setPassword(e.target.value)} required minLength={6} autoComplete={mode === "signin" ? "current-password" : "new-password"} />
            </div>
          )}

          <Button type="submit" disabled={submitting} className="w-full bg-navy text-primary-foreground hover:bg-navy/90 h-11 mt-2">
            {submitting && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
            {mode === "signin" ? "Iniciar sesión" : mode === "signup" ? "Crear cuenta" : "Enviar instrucciones"}
          </Button>

          <div className="text-center text-xs text-muted-foreground pt-2">
            {mode === "signin" ? (
              <>¿No tienes cuenta?{" "}
                <button type="button" onClick={() => setMode("signup")} className="text-gold font-medium hover:underline">Regístrate</button>
              </>
            ) : (
              <button type="button" onClick={() => setMode("signin")} className="text-gold font-medium hover:underline">Volver a iniciar sesión</button>
            )}
          </div>
        </form>

        <div className="mt-8 pt-6 border-t border-border/60 text-center text-[11px] text-muted-foreground tracking-wide">
          A360SGP Suite v2.0 · Acceso restringido
        </div>
      </div>
    </div>
  );
}
