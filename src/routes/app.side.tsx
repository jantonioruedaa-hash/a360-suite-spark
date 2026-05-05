import { createFileRoute } from "@tanstack/react-router";
import { Construction } from "lucide-react";

function Placeholder({ title, desc }: { title: string; desc: string }) {
  return (
    <div className="max-w-3xl">
      <h1 className="font-display text-3xl text-navy">{title}</h1>
      <p className="text-sm text-muted-foreground mt-1">{desc}</p>
      <div className="a360-card a360-card-lg p-12 mt-8 text-center">
        <div className="inline-flex w-14 h-14 rounded-full bg-gold/15 items-center justify-center text-gold mb-4">
          <Construction className="w-6 h-6" />
        </div>
        <h2 className="font-display text-xl text-navy">Módulo en desarrollo</h2>
        <p className="text-sm text-muted-foreground mt-2">
          Esta sección se construirá en la siguiente fase del proyecto.
        </p>
      </div>
    </div>
  );
}

export const Route = createFileRoute("/app/side")({
  component: () => <Placeholder title="Diagnóstico SIDE" desc="Sistema Integral de Diagnóstico Empresarial." />,
});
