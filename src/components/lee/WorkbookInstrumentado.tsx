import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ListaEditable } from "@/components/plan/ListaEditable";
import { RichTextEditor } from "@/components/ui/rich-text-editor";
import { MessageCircle, Plus, Trash2, BookOpen } from "lucide-react";
import type {
  WorkbookSchema, Campo, CampoEscala, CampoTabla, CampoSemaforo, CampoOpcion,
} from "@/lib/lee-workbook-schemas";

type Respuestas = Record<string, unknown>;

interface Props {
  schema: WorkbookSchema;
  respuestas: Respuestas;
  onChange: (next: Respuestas) => void;
}

const key = (seccionId: string, campoId: string) => `${seccionId}.${campoId}`;

export function WorkbookInstrumentado({ schema, respuestas, onChange }: Props) {
  const set = (k: string, v: unknown) => onChange({ ...respuestas, [k]: v });

  return (
    <div className="space-y-5">
      <div className="bg-gold/10 border border-gold/30 rounded p-3 text-xs">
        <div className="flex items-center gap-2 font-semibold text-navy">
          <BookOpen className="w-3.5 h-3.5 text-gold" /> Workbook instrumentado
        </div>
        <p className="text-muted-foreground mt-1">{schema.proposito}</p>
        {schema.duracionEstimada && (
          <p className="text-[10px] text-muted-foreground mt-1">⏱ {schema.duracionEstimada}</p>
        )}
      </div>

      {schema.secciones.map((sec) => (
        <section key={sec.id} className="border rounded-lg p-4 space-y-3 bg-white">
          <div className="flex items-start justify-between gap-2 flex-wrap">
            <h4 className="font-display text-navy text-sm">{sec.titulo}</h4>
            {sec.moduloRef && <Badge variant="outline" className="text-[10px]">Módulo {sec.moduloRef}</Badge>}
          </div>
          {sec.descripcion && <p className="text-xs text-muted-foreground">{sec.descripcion}</p>}
          {sec.preguntaCoaching && (
            <div className="flex items-start gap-2 bg-navy/5 border-l-2 border-gold p-2 text-xs italic">
              <MessageCircle className="w-3.5 h-3.5 text-gold shrink-0 mt-0.5" />
              <span>{sec.preguntaCoaching}</span>
            </div>
          )}

          <div className="space-y-4">
            {sec.campos.map((c) => {
              const k = key(sec.id, c.id);
              const v = respuestas[k];
              return (
                <CampoRender
                  key={c.id}
                  campo={c}
                  value={v}
                  onChange={(nv) => set(k, nv)}
                />
              );
            })}
          </div>
        </section>
      ))}
    </div>
  );
}

function CampoRender({ campo, value, onChange }: { campo: Campo; value: unknown; onChange: (v: unknown) => void }) {
  return (
    <div>
      <label className="text-xs font-medium text-navy block mb-1">
        {campo.label}{campo.requerido && <span className="text-red-500"> *</span>}
      </label>
      {campo.ayuda && <p className="text-[10px] text-muted-foreground mb-1">{campo.ayuda}</p>}
      {renderInput(campo, value, onChange)}
    </div>
  );
}

function renderInput(c: Campo, value: unknown, onChange: (v: unknown) => void) {
  switch (c.type) {
    case "text":
      return <Input value={(value as string) ?? ""} onChange={(e) => onChange(e.target.value)} placeholder={c.placeholder} className="h-9 text-sm" />;
    case "textarea":
      return <Textarea value={(value as string) ?? ""} onChange={(e) => onChange(e.target.value)} placeholder={c.placeholder} rows={c.rows ?? 4} />;
    case "lista":
      return <ListaEditable items={(value as string[]) ?? []} onChange={(items) => onChange(items)} placeholder={c.placeholder ?? "Nuevo ítem"} inputLabel={c.inputLabel ?? "+ Agregar"} />;
    case "escala":
      return <EscalaRender c={c} value={(value as Record<string, number>) ?? {}} onChange={onChange} />;
    case "semaforo":
      return <SemaforoRender c={c} value={(value as { color?: string; nota?: string }) ?? {}} onChange={onChange} />;
    case "tabla":
      return <TablaRender c={c} value={(value as Record<string, string>[]) ?? []} onChange={onChange} />;
    case "opcion":
      return <OpcionRender c={c} value={(value as string) ?? ""} onChange={onChange} />;
  }
}

function EscalaRender({ c, value, onChange }: { c: CampoEscala; value: Record<string, number>; onChange: (v: unknown) => void }) {
  const items = c.items ?? [{ id: "_v", texto: "" }];
  const range = Array.from({ length: c.max - c.min + 1 }, (_, i) => c.min + i);
  const valores = Object.values(value).filter((n) => typeof n === "number") as number[];
  const promedio = valores.length ? (valores.reduce((a, b) => a + b, 0) / valores.length).toFixed(2) : "—";

  return (
    <div className="space-y-1.5">
      <div className="flex justify-between text-[10px] text-muted-foreground">
        <span>{c.minLabel ?? c.min}</span><span>{c.maxLabel ?? c.max}</span>
      </div>
      {items.map((it) => (
        <div key={it.id} className="flex items-center gap-2 text-xs border rounded p-2">
          <span className="flex-1">{it.texto}</span>
          <div className="flex gap-1">
            {range.map((n) => (
              <button
                key={n}
                type="button"
                onClick={() => onChange({ ...value, [it.id]: n })}
                className={`w-7 h-7 rounded text-xs font-semibold border ${value[it.id] === n ? "bg-navy text-white border-navy" : "bg-white hover:bg-muted"}`}
              >{n}</button>
            ))}
          </div>
        </div>
      ))}
      <p className="text-[11px] text-muted-foreground text-right">Promedio: <span className="font-bold text-navy">{promedio}</span></p>
    </div>
  );
}

function SemaforoRender({ c, value, onChange }: { c: CampoSemaforo; value: { color?: string; nota?: string }; onChange: (v: unknown) => void }) {
  const opts = c.opciones ?? [
    { value: "verde", label: "🟢 Verde — saludable" },
    { value: "ambar", label: "🟡 Ámbar — atención" },
    { value: "rojo", label: "🔴 Rojo — crítico" },
  ];
  return (
    <div className="space-y-2">
      <div className="flex gap-2 flex-wrap">
        {opts.map((o) => (
          <button
            key={o.value}
            type="button"
            onClick={() => onChange({ ...value, color: o.value })}
            className={`text-xs px-3 py-1.5 rounded border ${value.color === o.value ? "bg-navy text-white border-navy" : "bg-white hover:bg-muted"}`}
          >{o.label}</button>
        ))}
      </div>
      {c.pedirJustificacion !== false && (
        <Textarea value={value.nota ?? ""} onChange={(e) => onChange({ ...value, nota: e.target.value })} rows={2} placeholder="Justifica tu elección con evidencia concreta…" />
      )}
    </div>
  );
}

function OpcionRender({ c, value, onChange }: { c: CampoOpcion; value: string; onChange: (v: unknown) => void }) {
  return (
    <div className="space-y-1.5">
      {c.opciones.map((o) => (
        <button
          key={o.value}
          type="button"
          onClick={() => onChange(o.value)}
          className={`w-full text-left text-xs border rounded p-2 ${value === o.value ? "border-navy bg-navy/5" : "hover:bg-muted"}`}
        >
          <div className="font-medium">{o.label}</div>
          {o.descripcion && <div className="text-muted-foreground text-[11px] mt-0.5">{o.descripcion}</div>}
        </button>
      ))}
    </div>
  );
}

function TablaRender({ c, value, onChange }: { c: CampoTabla; value: Record<string, string>[]; onChange: (v: unknown) => void }) {
  const filas: Record<string, string>[] = value.length === 0 && c.minFilas
    ? Array.from({ length: c.minFilas }, () => ({} as Record<string, string>))
    : value;

  const update = (i: number, colId: string, v: string) => {
    const next = [...filas];
    next[i] = { ...next[i], [colId]: v };
    onChange(next);
  };
  const add = () => onChange([...filas, {}]);
  const remove = (i: number) => onChange(filas.filter((_, idx) => idx !== i));

  return (
    <div className="space-y-2">
      <div className="overflow-x-auto border rounded">
        <table className="w-full text-xs">
          <thead className="bg-muted/40">
            <tr>
              {c.columnas.map((col) => (
                <th key={col.id} className="text-left p-2 font-medium" style={{ width: col.ancho }}>{col.label}</th>
              ))}
              <th className="w-8"></th>
            </tr>
          </thead>
          <tbody>
            {filas.map((fila, i) => (
              <tr key={i} className="border-t align-top">
                {c.columnas.map((col) => (
                  <td key={col.id} className="p-1">
                    <Textarea
                      value={fila[col.id] ?? ""}
                      onChange={(e) => update(i, col.id, e.target.value)}
                      placeholder={col.placeholder}
                      rows={2}
                      className="text-xs resize-none min-h-[40px]"
                    />
                  </td>
                ))}
                <td className="p-1">
                  <Button type="button" size="icon" variant="ghost" className="h-7 w-7 text-red-600" onClick={() => remove(i)}>
                    <Trash2 className="w-3 h-3" />
                  </Button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <Button type="button" size="sm" variant="outline" onClick={add} className="text-xs"><Plus className="w-3 h-3 mr-1" />Agregar fila</Button>
    </div>
  );
}
