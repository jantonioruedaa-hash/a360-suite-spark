import { createFileRoute } from "@tanstack/react-router";
export const Route = createFileRoute("/app/kpis")({
  component: () => (
    <div className="max-w-3xl">
      <h1 className="font-display text-3xl text-navy">Seguimiento de KPIs</h1>
      <div className="a360-card a360-card-lg p-12 mt-8 text-center text-muted-foreground">Próxima fase</div>
    </div>
  ),
});
