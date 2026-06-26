import { Outlet, createRootRoute, HeadContent, Scripts } from "@tanstack/react-router";
import appCss from "../styles.css?url";
import { AuthProvider } from "@/lib/auth-context";
import { AppSettingsProvider } from "@/lib/app-settings";
import { Toaster } from "@/components/ui/sonner";

export const Route = createRootRoute({
  head: () => ({
    meta: [
      { charSet: "utf-8" },
      { name: "viewport", content: "width=device-width, initial-scale=1" },
      { title: "A360SGP Suite — Aceleradora 360 SGP" },
      { name: "description", content: "Sistema Integral de Transformación Empresarial para PyMEs: Plan Estratégico, Coaching, Liderazgo (LEE) y SIDE." },
      { name: "google", content: "notranslate" },
      { property: "og:title", content: "A360SGP Suite — Aceleradora 360 SGP" },
      { property: "og:description", content: "Sistema Integral de Transformación Empresarial para PyMEs: Plan Estratégico, Coaching, Liderazgo (LEE) y SIDE." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
      { name: "twitter:title", content: "A360SGP Suite — Aceleradora 360 SGP" },
      { name: "twitter:description", content: "Sistema Integral de Transformación Empresarial para PyMEs." },
    ],
    links: [
      { rel: "stylesheet", href: appCss },
      { rel: "preconnect", href: "https://fonts.googleapis.com" },
      { rel: "preconnect", href: "https://fonts.gstatic.com", crossOrigin: "anonymous" },
      { rel: "stylesheet", href: "https://fonts.googleapis.com/css2?family=JetBrains+Mono:wght@400;500;600&display=swap" },
    ],
  }),
  shellComponent: RootShell,
  component: () => (
    <AuthProvider>
      <AppSettingsProvider>
        <Outlet />
        <Toaster richColors position="top-right" />
      </AppSettingsProvider>
    </AuthProvider>
  ),
  notFoundComponent: () => (
    <div className="min-h-screen flex items-center justify-center bg-cream">
      <div className="text-center">
        <h1 className="font-display text-7xl text-navy">404</h1>
        <p className="mt-2 text-muted-foreground">Página no encontrada</p>
        <a href="/" className="mt-6 inline-block text-gold font-medium">Volver al inicio</a>
      </div>
    </div>
  ),
});

function RootShell({ children }: { children: React.ReactNode }) {
  return (
    <html lang="es" translate="no" className="notranslate">
      <head><HeadContent /></head>
      <body>{children}<Scripts /></body>
    </html>
  );
}
