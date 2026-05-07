import { createFileRoute, useParams, Link } from "@tanstack/react-router";
import { Button } from "@/components/ui/button";
import { ArrowRight } from "lucide-react";

export const Route = createFileRoute("/app/clientes/$clienteId/side")({ component: () => <Placeholder titulo="Diagnósticos SIDE" descripcion="Lista de diagnósticos, evolución del IME y comparativos." linkTo="/app/side" /> });

function Placeholder({ titulo, descripcion, linkTo }: { titulo: string; descripcion: string; linkTo: string }) {
  useParams({ from: "/app/clientes/$clienteId/side" });
  return (
    <div className="space-y-4 max-w-3xl">
      <h2 className="font-display text-2xl text-navy">{titulo}</h2>
      <div className="a360-card a360-card-lg p-12 text-center">
        <p className="text-muted-foreground">{descripcion}</p>
        <p className="text-xs text-gold mt-2 uppercase tracking-wider">Integración completa en Fase 2</p>
        <Button asChild className="mt-6 bg-navy hover:bg-navy/90">
          <Link to={linkTo}>Ir al módulo <ArrowRight className="w-4 h-4 ml-1" /></Link>
        </Button>
      </div>
    </div>
  );
}
