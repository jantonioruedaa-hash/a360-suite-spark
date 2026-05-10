import { Link } from "@tanstack/react-router";
import { Bell, AlertTriangle, Clock, FileText, Calendar, CheckCheck } from "lucide-react";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Button } from "@/components/ui/button";
import { useAlertas, formatearDelta, type Alerta } from "@/lib/alertas-helpers";
import { useState } from "react";

const iconoTipo = (a: Alerta) => {
  if (a.tipo === "compromiso_vencido") return <AlertTriangle className="w-4 h-4 text-red-600" />;
  if (a.tipo === "compromiso_proximo") return <Clock className="w-4 h-4 text-amber-600" />;
  if (a.tipo === "sesion_proxima") return <Calendar className="w-4 h-4 text-emerald-600" />;
  return <FileText className="w-4 h-4 text-navy" />;
};

const colorSev = (s: Alerta["severidad"]) =>
  s === "critica" ? "border-l-red-500 bg-red-50/40"
  : s === "alta" ? "border-l-amber-500 bg-amber-50/40"
  : "border-l-gold/60 bg-cream/50";

export function NotificacionesBell() {
  const { alertas, noLeidas, marcarLeida, marcarTodasLeidas } = useAlertas();
  const [open, setOpen] = useState(false);
  const count = noLeidas.length;

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <button className="relative p-2 rounded-md hover:bg-muted text-navy" aria-label="Notificaciones">
          <Bell className="w-4 h-4" />
          {count > 0 && (
            <span className="absolute -top-0.5 -right-0.5 min-w-[18px] h-[18px] px-1 rounded-full bg-red-600 text-white text-[10px] font-bold flex items-center justify-center">
              {count > 99 ? "99+" : count}
            </span>
          )}
        </button>
      </PopoverTrigger>
      <PopoverContent align="end" className="w-[380px] p-0">
        <div className="flex items-center justify-between px-4 py-3 border-b border-border/60">
          <div>
            <h3 className="font-display text-navy text-sm">Notificaciones</h3>
            <p className="text-[11px] text-muted-foreground">{count} sin leer · {alertas.length} totales</p>
          </div>
          {count > 0 && (
            <Button size="sm" variant="ghost" className="h-7 text-xs gap-1" onClick={marcarTodasLeidas}>
              <CheckCheck className="w-3 h-3" /> Marcar todas
            </Button>
          )}
        </div>
        <ScrollArea className="max-h-[420px]">
          {alertas.length === 0 ? (
            <div className="p-8 text-center text-sm text-muted-foreground">
              <Bell className="w-8 h-8 mx-auto mb-2 opacity-30" />
              No tienes alertas pendientes
            </div>
          ) : (
            <ul className="divide-y divide-border/50">
              {alertas.map((a) => (
                <li key={a.id}>
                  <Link
                    to={a.to}
                    onClick={() => { marcarLeida(a.id); setOpen(false); }}
                    className={`block border-l-2 px-4 py-3 hover:bg-muted/50 transition-colors ${colorSev(a.severidad)}`}
                  >
                    <div className="flex items-start gap-2.5">
                      <div className="mt-0.5 shrink-0">{iconoTipo(a)}</div>
                      <div className="min-w-0 flex-1">
                        <div className="flex items-baseline justify-between gap-2">
                          <p className="text-sm font-semibold text-navy truncate">{a.titulo}</p>
                          <span className="text-[10px] text-muted-foreground shrink-0">{formatearDelta(a.diasDelta)}</span>
                        </div>
                        <p className="text-xs text-muted-foreground truncate">{a.clienteNombre}</p>
                        <p className="text-xs text-foreground/80 line-clamp-2 mt-0.5">{a.detalle}</p>
                      </div>
                    </div>
                  </Link>
                </li>
              ))}
            </ul>
          )}
        </ScrollArea>
      </PopoverContent>
    </Popover>
  );
}
