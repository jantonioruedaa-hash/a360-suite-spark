import { createFileRoute, Link } from "@tanstack/react-router";
import { Button } from "@/components/ui/button";
import { ArrowRight } from "lucide-react";

export const Route = createFileRoute("/app/clientes/$clienteId/lee")({
  component: () => (
    <div className="space-y-4 max-w-3xl">
      <h2 className="font-display text-2xl text-navy">Programa LEE</h2>
      <div className="a360-card a360-card-lg p-12 text-center">
        <p className="text-muted-foreground">Capítulos, participantes y workbooks.</p>
        <p className="text-xs text-gold mt-2 uppercase tracking-wider">Integración completa en Fase 2</p>
        <Button asChild className="mt-6 bg-navy hover:bg-navy/90"><Link to="/app/lee">Ir a LEE <ArrowRight className="w-4 h-4 ml-1" /></Link></Button>
      </div>
    </div>
  ),
});
