import { INSTRUCTIVO_SESION } from "@/lib/sesion-templates";
import { Sparkles } from "lucide-react";

export function InstructivoSesion() {
  return (
    <div className="a360-card a360-card-lg p-5 border-l-4 border-gold">
      <div className="flex items-start gap-3">
        <div className="w-9 h-9 rounded-full bg-gold/15 flex items-center justify-center shrink-0">
          <Sparkles className="w-4 h-4 text-gold" />
        </div>
        <div className="flex-1">
          <h3 className="font-display text-lg text-navy">{INSTRUCTIVO_SESION.titulo}</h3>
          <p className="text-sm text-muted-foreground mt-1">{INSTRUCTIVO_SESION.descripcion}</p>
          <div className="grid md:grid-cols-5 gap-2 mt-4">
            {INSTRUCTIVO_SESION.flujo.map((f) => (
              <div key={f.etapa} className="bg-cream rounded p-3">
                <div className="text-xs font-bold text-gold uppercase tracking-wider">{f.etapa}</div>
                <div className="text-xs text-navy mt-1 leading-snug">{f.desc}</div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
