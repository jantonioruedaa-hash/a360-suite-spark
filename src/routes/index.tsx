import { createFileRoute, Link } from "@tanstack/react-router";
import { A360Logo } from "@/components/A360Logo";

export const Route = createFileRoute("/")({
  component: WelcomePage,
});

function WelcomePage() {
  return (
    <div className="min-h-screen bg-cream flex flex-col items-center justify-center px-4">
      <div className="flex flex-col items-center gap-8 max-w-md w-full text-center">
        <A360Logo size={56} withText={false} />

        <div>
          <h1 className="font-display text-4xl text-navy leading-tight">
            A360SP
          </h1>
          <p className="mt-2 text-muted-foreground text-base">
            Aceleradora 360 — Sistema Integral de Transformación Empresarial
          </p>
        </div>

        <div className="flex flex-col sm:flex-row gap-3 w-full sm:w-auto">
          <Link
            to="/app/dashboard"
            className="px-6 py-2.5 rounded bg-navy text-white font-semibold text-sm hover:bg-navy/90 transition-colors text-center"
          >
            Ingresar a la plataforma
          </Link>
          <Link
            to="/login"
            className="px-6 py-2.5 rounded border border-gold/60 text-navy font-semibold text-sm hover:bg-gold/10 transition-colors text-center"
          >
            Iniciar sesión
          </Link>
        </div>
      </div>
    </div>
  );
}
