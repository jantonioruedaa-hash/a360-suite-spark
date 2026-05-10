// Componente reutilizable: lista editable con +Agregar, eliminar, reordenar (subir/bajar)
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Plus, Trash2, ChevronUp, ChevronDown } from "lucide-react";

interface Props {
  items: string[];
  onChange: (items: string[]) => void;
  placeholder?: string;
  emptyMsg?: string;
  inputLabel?: string;
}

export function ListaEditable({ items, onChange, placeholder = "Nuevo ítem", emptyMsg = "Sin ítems aún", inputLabel = "+ Agregar" }: Props) {
  const update = (i: number, v: string) => onChange(items.map((x, idx) => idx === i ? v : x));
  const remove = (i: number) => onChange(items.filter((_, idx) => idx !== i));
  const move = (i: number, dir: -1 | 1) => {
    const j = i + dir;
    if (j < 0 || j >= items.length) return;
    const next = [...items];
    [next[i], next[j]] = [next[j], next[i]];
    onChange(next);
  };
  const add = () => onChange([...items, ""]);

  return (
    <div className="space-y-2">
      {items.length === 0 && <p className="text-xs text-muted-foreground italic">{emptyMsg}</p>}
      {items.map((it, i) => (
        <div key={i} className="flex items-center gap-1">
          <Input value={it} onChange={(e) => update(i, e.target.value)} placeholder={placeholder} className="h-8 text-sm" />
          <Button type="button" size="icon" variant="ghost" className="h-8 w-8" onClick={() => move(i, -1)} disabled={i === 0}><ChevronUp className="w-3 h-3" /></Button>
          <Button type="button" size="icon" variant="ghost" className="h-8 w-8" onClick={() => move(i, 1)} disabled={i === items.length - 1}><ChevronDown className="w-3 h-3" /></Button>
          <Button type="button" size="icon" variant="ghost" className="h-8 w-8 text-red-600 hover:bg-red-50" onClick={() => remove(i)}><Trash2 className="w-3 h-3" /></Button>
        </div>
      ))}
      <Button type="button" size="sm" variant="outline" onClick={add} className="text-xs"><Plus className="w-3 h-3 mr-1" />{inputLabel}</Button>
    </div>
  );
}
