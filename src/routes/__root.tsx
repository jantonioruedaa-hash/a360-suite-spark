import { Outlet, createRootRoute, HeadContent, Scripts } from "@tanstack/react-router";
import appCss from "../styles.css?url";
import { AuthProvider } from "@/lib/auth-context";
import { Toaster } from "@/components/ui/sonner";

export const Route = createRootRoute({
  head: () => ({
    meta: [
      { charSet: "utf-8" },
      { name: "viewport", content: "width=device-width, initial-scale=1" },
      { title: "A360SGP Suite — Aceleradora 360 SGP" },
      { name: "description", content: "Sistema Integral de Transformación Empresarial — A360SGP Suite" },
    ],
    links: [{ rel: "stylesheet", href: appCss }],
  }),
  shellComponent: RootShell,
  component: () => (
    <AuthProvider>
      <Outlet />
      <Toaster richColors position="top-right" />
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
    <html lang="es">
      <head><HeadContent /></head>
      <body>{children}<Scripts /></body>
    </html>
  );
}
