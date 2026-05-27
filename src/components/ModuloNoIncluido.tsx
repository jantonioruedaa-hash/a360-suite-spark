import { Lock } from "lucide-react";
import { PLAN_LABELS, type PlanKey } from "@/lib/plans";

interface Props {
  moduloLabel: string;
  planActual?: PlanKey;
}

export function ModuloNoIncluido({ moduloLabel, planActual }: Props) {
  return (
    <div className="max-w-xl mx-auto mt-12 a360-card p-8 text-center">
      <div className="mx-auto w-14 h-14 rounded-full bg-gold/15 flex items-center justify-center mb-4">
        <Lock className="w-7 h-7 text-gold" />
      </div>
      <h2 className="font-display text-navy text-2xl mb-2">
        {moduloLabel} no está incluido en tu plan
      </h2>
      <p className="text-muted-foreground text-sm mb-4">
        Este módulo no está incluido en tu plan actual
        {planActual ? <> (<span className="font-semibold">{PLAN_LABELS[planActual]}</span>)</> : null}.
        Contacta a tu consultor para actualizar tu plan.
      </p>
    </div>
  );
}
