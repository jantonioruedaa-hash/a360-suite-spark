import { createFileRoute } from "@tanstack/react-router";
export const Route = createFileRoute("/app/plan")({
  component: () => (
    <div className="max-w-3xl">
      <h1 className="font-display text-3xl text-navy">Plan Estratégico</h1>
      <p className="text-sm text-muted-foreground mt-1">18 secciones del plan + herramientas avanzadas.</p>
      <div className="a360-card a360-card-lg p-12 mt-8 text-center text-muted-foreground">Próxima fase</div>
    </div>
  ),
});
