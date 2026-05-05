import { createFileRoute } from "@tanstack/react-router";
import { demoClientes, imeColor, imeLabel } from "@/lib/demo-data";

export const Route = createFileRoute("/app/clientes")({ component: ClientesPage });

function ClientesPage() {
  return (
    <div className="max-w-[1400px]">
      <h1 className="font-display text-3xl text-navy">Mis clientes</h1>
      <p className="text-sm text-muted-foreground mt-1">Cartera completa asignada a tu cuenta.</p>

      <div className="a360-card a360-card-lg mt-6 overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-cream text-navy">
            <tr className="text-left">
              <th className="px-5 py-3 font-semibold text-xs uppercase tracking-wider">Empresa</th>
              <th className="px-5 py-3 font-semibold text-xs uppercase tracking-wider">Sector</th>
              <th className="px-5 py-3 font-semibold text-xs uppercase tracking-wider">Ubicación</th>
              <th className="px-5 py-3 font-semibold text-xs uppercase tracking-wider">IME</th>
              <th className="px-5 py-3 font-semibold text-xs uppercase tracking-wider">Última actividad</th>
            </tr>
          </thead>
          <tbody>
            {demoClientes.map((c) => (
              <tr key={c.id} className="border-t border-border/60 hover:bg-cream/50">
                <td className="px-5 py-3 font-medium text-navy">{c.nombre_empresa}</td>
                <td className="px-5 py-3 text-muted-foreground">{c.sector}</td>
                <td className="px-5 py-3 text-muted-foreground">{c.ciudad}, {c.pais}</td>
                <td className="px-5 py-3">
                  <span className={`inline-flex items-center gap-2 px-2.5 py-1 rounded-md text-xs font-semibold ${imeColor(c.ime_estado)}`}>
                    <span className="font-mono-num">{c.ime.toFixed(1)}</span>
                    <span className="text-[10px] uppercase tracking-wider">{imeLabel(c.ime_estado)}</span>
                  </span>
                </td>
                <td className="px-5 py-3 text-muted-foreground text-xs">{c.ultima_actividad}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
