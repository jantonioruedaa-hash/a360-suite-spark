import { createFileRoute, useParams } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { ESTADOS, PLANES_LICENCIA, TAMANOS, ORIGENES } from "@/lib/clientes-helpers";
import { toast } from "sonner";
import { Save } from "lucide-react";

export const Route = createFileRoute("/app/clientes/$clienteId/empresa")({ component: Empresa });

const FIELDS = [
  "nombre_empresa", "nombre_comercial", "sector", "subsector", "tamano",
  "num_empleados", "facturacion_anual", "moneda", "pais", "ciudad",
  "direccion", "codigo_postal", "web", "linkedin_empresa", "logo_url",
  "descripcion", "estado", "plan_licencia", "fecha_inicio_relacion",
  "origen", "notas_internas",
] as const;

type Form = Partial<Record<(typeof FIELDS)[number], string>>;

function Empresa() {
  const { clienteId } = useParams({ from: "/app/clientes/$clienteId/empresa" });
  const [form, setForm] = useState<Form>({});
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    supabase.from("clientes").select("*").eq("id", clienteId).maybeSingle().then(({ data }) => {
      if (data) {
        const f: Form = {};
        FIELDS.forEach((k) => { f[k] = data[k] != null ? String(data[k]) : ""; });
        setForm(f);
      }
    });
  }, [clienteId]);

  const set = (k: keyof Form, v: string) => setForm({ ...form, [k]: v });

  const save = async () => {
    setSaving(true);
    const payload: Record<string, unknown> = {};
    FIELDS.forEach((k) => {
      const v = form[k];
      if (k === "num_empleados" || k === "facturacion_anual") {
        payload[k] = v ? Number(v) : null;
      } else {
        payload[k] = v || null;
      }
    });
    const { error } = await supabase.from("clientes").update(payload as never).eq("id", clienteId);
    if (error) toast.error(error.message); else toast.success("Información guardada");
    setSaving(false);
  };

  return (
    <div className="space-y-6 max-w-4xl">
      <div className="flex items-center justify-between">
        <h2 className="font-display text-2xl text-navy">Información de la empresa</h2>
        <Button onClick={save} disabled={saving} className="bg-gold hover:bg-gold/90 text-navy">
          <Save className="w-4 h-4 mr-1" />{saving ? "Guardando…" : "Guardar cambios"}
        </Button>
      </div>

      <Section title="Datos generales">
        <Field label="Nombre legal *"><Input value={form.nombre_empresa ?? ""} onChange={(e) => set("nombre_empresa", e.target.value)} /></Field>
        <Field label="Nombre comercial"><Input value={form.nombre_comercial ?? ""} onChange={(e) => set("nombre_comercial", e.target.value)} /></Field>
        <Field label="Sector"><Input value={form.sector ?? ""} onChange={(e) => set("sector", e.target.value)} /></Field>
        <Field label="Subsector"><Input value={form.subsector ?? ""} onChange={(e) => set("subsector", e.target.value)} /></Field>
        <Field label="Tamaño">
          <Select value={form.tamano ?? ""} onValueChange={(v) => set("tamano", v)}>
            <SelectTrigger><SelectValue placeholder="—" /></SelectTrigger>
            <SelectContent>{TAMANOS.map((t) => <SelectItem key={t.value} value={t.value}>{t.label}</SelectItem>)}</SelectContent>
          </Select>
        </Field>
        <Field label="N° empleados"><Input type="number" value={form.num_empleados ?? ""} onChange={(e) => set("num_empleados", e.target.value)} /></Field>
        <Field label="Facturación anual"><Input type="number" value={form.facturacion_anual ?? ""} onChange={(e) => set("facturacion_anual", e.target.value)} /></Field>
        <Field label="Moneda"><Input value={form.moneda ?? ""} onChange={(e) => set("moneda", e.target.value)} /></Field>
      </Section>

      <Section title="Ubicación">
        <Field label="País"><Input value={form.pais ?? ""} onChange={(e) => set("pais", e.target.value)} /></Field>
        <Field label="Ciudad"><Input value={form.ciudad ?? ""} onChange={(e) => set("ciudad", e.target.value)} /></Field>
        <Field label="Dirección" wide><Input value={form.direccion ?? ""} onChange={(e) => set("direccion", e.target.value)} /></Field>
        <Field label="Código postal"><Input value={form.codigo_postal ?? ""} onChange={(e) => set("codigo_postal", e.target.value)} /></Field>
      </Section>

      <Section title="Información digital">
        <Field label="Web" wide><Input value={form.web ?? ""} onChange={(e) => set("web", e.target.value)} /></Field>
        <Field label="LinkedIn" wide><Input value={form.linkedin_empresa ?? ""} onChange={(e) => set("linkedin_empresa", e.target.value)} /></Field>
        <Field label="URL del logo" wide><Input value={form.logo_url ?? ""} onChange={(e) => set("logo_url", e.target.value)} placeholder="https://..." /></Field>
      </Section>

      <Section title="Estado y comercial">
        <Field label="Estado">
          <Select value={form.estado ?? ""} onValueChange={(v) => set("estado", v)}>
            <SelectTrigger><SelectValue /></SelectTrigger>
            <SelectContent>{ESTADOS.map((e) => <SelectItem key={e.value} value={e.value}>{e.label}</SelectItem>)}</SelectContent>
          </Select>
        </Field>
        <Field label="Plan de licencia">
          <Select value={form.plan_licencia ?? ""} onValueChange={(v) => set("plan_licencia", v)}>
            <SelectTrigger><SelectValue /></SelectTrigger>
            <SelectContent>{PLANES_LICENCIA.map((p) => <SelectItem key={p} value={p} className="capitalize">{p}</SelectItem>)}</SelectContent>
          </Select>
        </Field>
        <Field label="Fecha inicio de relación"><Input type="date" value={form.fecha_inicio_relacion ?? ""} onChange={(e) => set("fecha_inicio_relacion", e.target.value)} /></Field>
        <Field label="Origen">
          <Select value={form.origen ?? ""} onValueChange={(v) => set("origen", v)}>
            <SelectTrigger><SelectValue placeholder="—" /></SelectTrigger>
            <SelectContent>{ORIGENES.map((o) => <SelectItem key={o} value={o} className="capitalize">{o}</SelectItem>)}</SelectContent>
          </Select>
        </Field>
      </Section>

      <Section title="Descripción y notas">
        <Field label="Descripción del negocio" wide><Textarea rows={3} value={form.descripcion ?? ""} onChange={(e) => set("descripcion", e.target.value)} /></Field>
        <Field label="Notas internas" wide><Textarea rows={3} value={form.notas_internas ?? ""} onChange={(e) => set("notas_internas", e.target.value)} /></Field>
      </Section>
    </div>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="a360-card a360-card-lg p-5">
      <h3 className="font-display text-navy mb-4">{title}</h3>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">{children}</div>
    </div>
  );
}

function Field({ label, children, wide }: { label: string; children: React.ReactNode; wide?: boolean }) {
  return <div className={wide ? "md:col-span-2" : ""}><Label className="text-xs">{label}</Label>{children}</div>;
}
