import { createFileRoute } from "@tanstack/react-router";
import { Sparkles } from "lucide-react";

export const Route = createFileRoute("/app/clientes/$clienteId/analisis-ia")({
  component: () => (
    <div className="space-y-4 max-w-3xl">
      <h2 className="font-display text-2xl text-navy">Análisis IA del cliente</h2>
      <div className="a360-card a360-card-lg p-12 text-center">
        <Sparkles className="w-10 h-10 text-gold mx-auto mb-3" />
        <p className="text-muted-foreground">Consolidación de todos los análisis IA por módulo y generación del informe maestro.</p>
        <p className="text-xs text-gold mt-2 uppercase tracking-wider">Disponible en Fase 2</p>
      </div>
    </div>
  ),
});
