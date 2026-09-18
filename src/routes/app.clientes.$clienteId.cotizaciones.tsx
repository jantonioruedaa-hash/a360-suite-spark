import { createFileRoute, useParams } from "@tanstack/react-router";
import { useEffect, useMemo, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/lib/auth-context";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { ESTADOS_COTIZACION } from "@/lib/clientes-helpers";
import { generarCotizacionPDF, PLANES_PRESET } from "@/lib/cotizacion-pdf";
import { generarPropuestaComercialPDF } from "@/lib/propuesta-pdf";
import { ENTREGABLES_PLAN, OBJETIVOS_PLAN, type EntregableItem } from "@/lib/cotizacion-entregables";
import {
  PAISES_LATAM, getPais, ajustarPrecioPorPais,
  RANGOS_FACTURACION, calcularIME, justificacionPorPlan,
} from "@/lib/cotizacion-helpers";
import { toast } from "sonner";
import { Plus, Download, Pencil, FileText, Sparkles, FileBadge, Trash2, RefreshCw } from "lucide-react";

export const Route = createFileRoute("/app/clientes/$clienteId/cotizaciones")({ component: Cotizaciones });

interface Servicio { nombre: string; cantidad: number; precio: number }
interface Cotizacion {
  id: string;
  numero_cotizacion: string;
  titulo: string;
  descripcion: string | null;
  plan: string | null;
  servicios: Servicio[];
  subtotal: number;
  descuento_porcentaje: number;
  descuento_valor: number;
  total: number;
  moneda: string;
  estado: string;
  validez_dias: number;
  fecha_emision: string | null;
  fecha_vencimiento: string | null;
  notas: string | null;
  condiciones: string | null;
  contacto_id: string | null;
  ime_estimado: string | null;
  justificacion_programa: string | null;
  entregables: EntregableItem[];
  objetivos_propuesta: string[];
  diagnostico_resumen: string | null;
  nivel_acompanamiento: string | null;
  plan_plataforma_id: string | null;
}

interface ClienteData {
  nombre_empresa: string;
  nombre_comercial: string | null;
  sector: string | null;
  direccion: string | null;
  ciudad: string | null;
  pais: string | null;
  plan_licencia: string | null;
  num_empleados: number | null;
  es_grupo_empresarial: boolean;
}

interface ContactoLite { id: string; nombre: string; apellido: string; email: string | null; telefono_oficina?: string | null; celular?: string | null }

const EMPTY: Partial<Cotizacion> = {
  titulo: "", descripcion: "", plan: "diagnostico", servicios: [],
  subtotal: 0, descuento_porcentaje: 0, descuento_valor: 0, total: 0,
  moneda: "USD", estado: "borrador", validez_dias: 30,
  fecha_emision: new Date().toISOString().slice(0, 10),
  notas: "", condiciones: "El presente documento tiene validez de 30 días desde su emisión.",
  contacto_id: null, ime_estimado: null, justificacion_programa: null,
  entregables: [], objetivos_propuesta: [], diagnostico_resumen: null,
  nivel_acompanamiento: null, plan_plataforma_id: null,
};

const NIVEL_LABELS: Record<string, string> = {
  autogestionado: "Autogestionado",
  guiado: "Guiado",
  acompanado: "Acompañado",
  advisory: "Advisory",
};

function Cotizaciones() {
  const { clienteId } = useParams({ from: "/app/clientes/$clienteId/cotizaciones" });
  const { user, profile, role } = useAuth();
  const isClientRole = role === "cliente" || role === "participante";
  const [list, setList] = useState<Cotizacion[]>([]);
  const [cliente, setCliente] = useState<ClienteData | null>(null);
  const [contactos, setContactos] = useState<ContactoLite[]>([]);
  const [editing, setEditing] = useState<Partial<Cotizacion> | null>(null);
  const [cotizadorPerms, setCotizadorPerms] = useState({ puede_editar: true, puede_eliminar: true });
  const [planesDisponibles, setPlanesDisponibles] = useState<Array<{ id: string; nombre: string }>>([]);

  useEffect(() => {
    (async () => {
      const { data } = await (supabase as any).from("planes").select("id, nombre").order("nombre");
      setPlanesDisponibles(data ?? []);
    })();
  }, []);

  useEffect(() => {
    if (!isClientRole || !user) return;
    (async () => {
      const { data: pum } = await (supabase as any)
        .from("permisos_usuario_modulo")
        .select("puede_editar, puede_eliminar")
        .eq("user_id", user.id)
        .eq("cliente_id", clienteId)
        .eq("modulo", "cotizador")
        .maybeSingle();
      setCotizadorPerms({
        puede_editar: pum?.puede_editar ?? false,
        puede_eliminar: pum?.puede_eliminar ?? false,
      });
    })();
  }, [isClientRole, user?.id, clienteId]);

  const reload = async () => {
    const [{ data: cs }, { data: cli }, { data: cts }] = await Promise.all([
      supabase.from("cliente_cotizaciones").select("*").eq("cliente_id", clienteId).order("created_at", { ascending: false }),
      supabase.from("clientes").select("nombre_empresa,nombre_comercial,sector,direccion,ciudad,pais,plan_licencia,num_empleados,es_grupo_empresarial").eq("id", clienteId).maybeSingle(),
      supabase.from("cliente_contactos").select("id,nombre,apellido,email,telefono_oficina,celular").eq("cliente_id", clienteId).eq("activo", true),
    ]);
    setList((cs ?? []) as unknown as Cotizacion[]);
    setCliente(cli as ClienteData | null);
    setContactos((cts ?? []) as ContactoLite[]);
  };

  useEffect(() => { reload(); }, [clienteId]);

  const stats = useMemo(() => {
    const total = list.reduce((s, c) => s + c.total, 0);
    const aprobado = list.filter((c) => c.estado === "aprobada").reduce((s, c) => s + c.total, 0);
    const cerradas = list.filter((c) => c.estado === "aprobada").length;
    return {
      cotizado: total,
      aprobado,
      tasa: list.length ? Math.round((cerradas / list.length) * 100) : 0,
    };
  }, [list]);

  const deleteCotizacion = async (id: string) => {
    if (!confirm("¿Eliminar esta cotización? Esta acción no se puede deshacer.")) return;
    const { error } = await supabase.from("cliente_cotizaciones").delete().eq("id", id);
    if (error) { toast.error(error.message); return; }
    toast.success("Cotización eliminada");
    reload();
  };

  const exportar = (c: Cotizacion) => {
    const ct = contactos.find((x) => x.id === c.contacto_id);
    if (!cliente) return;
    const doc = generarCotizacionPDF({
      numero: c.numero_cotizacion,
      titulo: c.titulo,
      descripcion: c.descripcion,
      plan: c.plan ? PLANES_PRESET[c.plan]?.label ?? c.plan : null,
      nivelAcompanamiento: c.nivel_acompanamiento ? NIVEL_LABELS[c.nivel_acompanamiento] ?? c.nivel_acompanamiento : null,
      planPlataformaNombre: c.plan_plataforma_id ? planesDisponibles.find((p) => p.id === c.plan_plataforma_id)?.nombre ?? null : null,
      fechaEmision: c.fecha_emision,
      fechaVencimiento: c.fecha_vencimiento,
      validezDias: c.validez_dias,
      moneda: c.moneda,
      servicios: c.servicios,
      subtotal: c.subtotal,
      descuentoPorcentaje: c.descuento_porcentaje,
      descuentoValor: c.descuento_valor,
      total: c.total,
      notas: c.notas,
      condiciones: c.condiciones,
      imeEstimado: c.ime_estimado,
      justificacion: c.justificacion_programa,
      cliente: {
        empresa: cliente.nombre_empresa,
        nombreComercial: cliente.nombre_comercial,
        contacto: ct ? `${ct.nombre} ${ct.apellido}` : null,
        email: ct?.email ?? null,
        direccion: cliente.direccion,
        ciudad: cliente.ciudad,
        pais: cliente.pais,
      },
      consultor: { nombre: profile?.name, email: profile?.email },
    });
    doc.save(`${c.numero_cotizacion}.pdf`);
  };

  const exportarPropuesta = async (c: Cotizacion) => {
    if (!cliente) return;
    const ct = contactos.find((x) => x.id === c.contacto_id);
    const [{ data: ob }, { data: sd }] = await Promise.all([
      supabase.from("cliente_onboarding").select("paso3_contexto,paso4_expectativas").eq("cliente_id", clienteId).maybeSingle(),
      supabase.from("side_sesiones").select("idf_score,cof_score,ivee_score,ime_score").eq("cliente_id", clienteId).order("created_at", { ascending: false }).limit(1).maybeSingle(),
    ]);
    const ctx = (ob?.paso3_contexto ?? {}) as { situacion_actual?: string; debilidades?: string[]; amenazas?: string[] };
    const retos = [...(ctx.debilidades ?? []), ...(ctx.amenazas ?? [])].slice(0, 6);
    const diag = c.diagnostico_resumen || ctx.situacion_actual || null;
    const doc = generarPropuestaComercialPDF({
      numero: c.numero_cotizacion, titulo: c.titulo,
      fechaEmision: c.fecha_emision, fechaVencimiento: c.fecha_vencimiento, validezDias: c.validez_dias, moneda: c.moneda,
      plan: c.plan, planLabel: c.plan ? PLANES_PRESET[c.plan]?.label ?? c.plan : null,
      nivelAcompanamiento: c.nivel_acompanamiento ? NIVEL_LABELS[c.nivel_acompanamiento] ?? c.nivel_acompanamiento : null,
      planPlataformaNombre: c.plan_plataforma_id ? planesDisponibles.find((p) => p.id === c.plan_plataforma_id)?.nombre ?? null : null,
      cliente: {
        empresa: cliente.nombre_empresa, nombreComercial: cliente.nombre_comercial, sector: cliente.sector,
        contacto: ct ? `${ct.nombre} ${ct.apellido}` : null, email: ct?.email ?? null,
        telefono: ct?.telefono_oficina ?? ct?.celular ?? null,
        direccion: cliente.direccion, ciudad: cliente.ciudad, pais: cliente.pais,
      },
      diagnosticoResumen: diag,
      scoresSide: sd ? { idf: sd.idf_score, cof: sd.cof_score, ivee: sd.ivee_score, ime: sd.ime_score } : null,
      retosClave: retos,
      objetivos: c.objetivos_propuesta?.length ? c.objetivos_propuesta : OBJETIVOS_PLAN[c.plan ?? ""] ?? [],
      entregables: c.entregables?.length ? c.entregables : ENTREGABLES_PLAN[c.plan ?? ""] ?? [],
      justificacion: c.justificacion_programa,
      servicios: c.servicios, subtotal: c.subtotal,
      descuentoPorcentaje: c.descuento_porcentaje, descuentoValor: c.descuento_valor, total: c.total,
      imeEstimado: c.ime_estimado, condiciones: c.condiciones, notas: c.notas,
      consultor: { nombre: profile?.name, email: profile?.email },
    });
    doc.save(`Propuesta-${c.numero_cotizacion}.pdf`);
    toast.success("Propuesta generada");
  };

  return (
    <div className="space-y-4 max-w-6xl">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <h2 className="font-display text-2xl text-navy">Cotizaciones y contratos</h2>
        {cotizadorPerms.puede_editar && (
          <Button onClick={() => setEditing(EMPTY)} className="bg-navy hover:bg-navy/90">
            <Plus className="w-4 h-4 mr-1" /> Nueva cotización
          </Button>
        )}
      </div>

      <div className="grid grid-cols-3 gap-4">
        <div className="a360-card p-4"><div className="text-xs text-muted-foreground uppercase">Total cotizado</div><div className="font-display text-2xl text-navy">${stats.cotizado.toLocaleString()}</div></div>
        <div className="a360-card p-4"><div className="text-xs text-muted-foreground uppercase">Aprobado</div><div className="font-display text-2xl text-emerald-600">${stats.aprobado.toLocaleString()}</div></div>
        <div className="a360-card p-4"><div className="text-xs text-muted-foreground uppercase">Tasa de cierre</div><div className="font-display text-2xl text-gold">{stats.tasa}%</div></div>
      </div>

      {list.length === 0 ? (
        <div className="a360-card a360-card-lg p-12 text-center text-muted-foreground">
          <FileText className="w-12 h-12 mx-auto mb-2 opacity-30" />
          Sin cotizaciones. Crea la primera.
        </div>
      ) : (
        <div className="a360-card a360-card-lg overflow-hidden">
          <table className="w-full text-sm">
            <thead className="bg-cream text-navy">
              <tr className="text-left">
                <th className="px-4 py-3 text-xs uppercase">Número</th>
                <th className="px-4 py-3 text-xs uppercase">Título</th>
                <th className="px-4 py-3 text-xs uppercase">Plan</th>
                <th className="px-4 py-3 text-xs uppercase text-right">Total</th>
                <th className="px-4 py-3 text-xs uppercase">Estado</th>
                <th className="px-4 py-3 text-xs uppercase">Vencimiento</th>
                <th className="px-4 py-3" />
              </tr>
            </thead>
            <tbody>
              {list.map((c) => {
                const est = ESTADOS_COTIZACION.find((e) => e.value === c.estado);
                return (
                  <tr key={c.id} className="border-t hover:bg-cream/40">
                    <td className="px-4 py-3 font-mono text-xs text-navy">{c.numero_cotizacion}</td>
                    <td className="px-4 py-3 text-navy">{c.titulo}</td>
                    <td className="px-4 py-3 text-muted-foreground capitalize text-xs">{c.plan ?? "—"}</td>
                    <td className="px-4 py-3 text-right font-semibold">{c.moneda} {c.total.toLocaleString()}</td>
                    <td className="px-4 py-3">{est && <Badge variant="outline" className={est.color}>{est.label}</Badge>}</td>
                    <td className="px-4 py-3 text-xs text-muted-foreground">{c.fecha_vencimiento ? new Date(c.fecha_vencimiento).toLocaleDateString() : "—"}</td>
                    <td className="px-4 py-3 text-right">
                      <Button size="sm" variant="ghost" onClick={() => exportarPropuesta(c)} title="Generar Propuesta Comercial PDF"><FileBadge className="w-3.5 h-3.5 text-gold" /></Button>
                      <Button size="sm" variant="ghost" onClick={() => exportar(c)} title="Exportar Cotización PDF"><Download className="w-3.5 h-3.5" /></Button>
                      {cotizadorPerms.puede_editar && (
                        <Button size="sm" variant="ghost" onClick={() => setEditing(c)} title="Editar"><Pencil className="w-3.5 h-3.5" /></Button>
                      )}
                      {cotizadorPerms.puede_eliminar && (
                        <Button size="sm" variant="ghost" onClick={() => deleteCotizacion(c.id)} title="Eliminar"><Trash2 className="w-3.5 h-3.5 text-red-500" /></Button>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}

      {editing && (
        <CotizacionEditor
          value={editing}
          contactos={contactos}
          clienteId={clienteId}
          consultorId={user?.id ?? null}
          cliente={cliente}
          planes={planesDisponibles}
          onClose={() => setEditing(null)}
          onSaved={() => { setEditing(null); reload(); }}
        />
      )}
    </div>
  );
}

function CotizacionEditor({ value, contactos, clienteId, consultorId, cliente, planes, onClose, onSaved }: {
  value: Partial<Cotizacion>;
  contactos: ContactoLite[];
  clienteId: string;
  consultorId: string | null;
  cliente: ClienteData | null;
  planes: Array<{ id: string; nombre: string }>;
  onClose: () => void;
  onSaved: () => void;
}) {
  const [form, setForm] = useState<Partial<Cotizacion>>(value);
  const [sugerenciaInicial, setSugerenciaInicial] = useState<{ plan: string; nivel: string; planId: string | null } | null>(null);
  const [paisCode, setPaisCode] = useState<string>(() => {
    const p = PAISES_LATAM.find((x) => x.moneda === (value.moneda ?? "USD"));
    return p?.code ?? "USD";
  });
  const [rangoFact, setRangoFact] = useState<string>("500k-1M");

  const recalcular = (servicios: Servicio[], descPct: number, descVal: number) => {
    const subtotal = servicios.reduce((s, x) => s + x.cantidad * x.precio, 0);
    const descuento = descPct > 0 ? subtotal * (descPct / 100) : descVal;
    return { subtotal, descuento_valor: descuento, total: Math.max(0, subtotal - descuento) };
  };

  useEffect(() => {
    if (form.servicios) {
      const r = recalcular(form.servicios, form.descuento_porcentaje ?? 0, form.descuento_valor ?? 0);
      if (r.subtotal !== form.subtotal || r.total !== form.total) {
        setForm((f) => ({ ...f, ...r }));
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [form.servicios, form.descuento_porcentaje]);

  useEffect(() => {
    if (value.id) return; // solo cotizaciones nuevas
    let cancelled = false;
    (async () => {
      const { data: sesion } = await (supabase as any)
        .from("side_sesiones")
        .select("scores, ime_score")
        .eq("cliente_id", clienteId)
        .order("updated_at", { ascending: false })
        .limit(1)
        .maybeSingle();
      if (cancelled || !sesion) return;
      const { contarBrechasCriticas, sugerirPlanYNivel } = await import("@/lib/cotizador-motor-reglas");
      const brechasCriticas = contarBrechasCriticas(sesion.scores ?? {});
      const sugerencia = sugerirPlanYNivel({
        numEmpleados: cliente?.num_empleados ?? null,
        esGrupoEmpresarial: cliente?.es_grupo_empresarial ?? false,
        imeGeneral: sesion.ime_score ?? 0,
        brechasCriticas,
      });
      const planMatch = planes.find((p) => p.nombre.toLowerCase() === sugerencia.plan.toLowerCase()) ?? null;
      const planId = planMatch?.id ?? null;
      setSugerenciaInicial({ plan: sugerencia.plan, nivel: sugerencia.nivel, planId });
      setForm((f) => ({
        ...f,
        nivel_acompanamiento: f.nivel_acompanamiento ?? sugerencia.nivel,
        plan_plataforma_id: f.plan_plataforma_id ?? planId,
      }));
    })();
    return () => { cancelled = true; };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const cargarPlan = (plan: string) => {
    const preset = PLANES_PRESET[plan];
    if (!preset) return;
    const pais = getPais(paisCode);
    const servicios = preset.servicios.map((s) => ({
      ...s, precio: ajustarPrecioPorPais(s.precio, pais),
    }));
    const r = recalcular(servicios, form.descuento_porcentaje ?? 0, 0);
    const ime = calcularIME(plan, rangoFact);
    setForm({
      ...form, plan,
      titulo: form.titulo || preset.label,
      servicios, ...r,
      moneda: pais.moneda,
      ime_estimado: ime?.texto ?? form.ime_estimado ?? null,
      justificacion_programa: form.justificacion_programa || justificacionPorPlan(plan),
      entregables: (form.entregables && form.entregables.length) ? form.entregables : (ENTREGABLES_PLAN[plan] ?? []),
      objetivos_propuesta: (form.objetivos_propuesta && form.objetivos_propuesta.length) ? form.objetivos_propuesta : (OBJETIVOS_PLAN[plan] ?? []),
    });
  };

  const importarDiagnostico = async () => {
    const { data: ob } = await supabase
      .from("cliente_onboarding")
      .select("paso3_contexto")
      .eq("cliente_id", clienteId)
      .maybeSingle();
    const ctx = (ob?.paso3_contexto ?? {}) as { situacion_actual?: string; debilidades?: string[]; amenazas?: string[]; contexto_sector?: string };
    const partes: string[] = [];
    if (ctx.situacion_actual) partes.push(ctx.situacion_actual);
    if (ctx.contexto_sector) partes.push(`Contexto del sector: ${ctx.contexto_sector}`);
    if (!partes.length) { toast.error("No hay diagnóstico en el Onboarding aún."); return; }
    setForm({ ...form, diagnostico_resumen: partes.join("\n\n") });
    toast.success("Diagnóstico importado del Onboarding");
  };

  const recargarEntregables = () => {
    if (!form.plan) { toast.error("Selecciona un plan primero"); return; }
    setForm({
      ...form,
      entregables: ENTREGABLES_PLAN[form.plan] ?? [],
      objetivos_propuesta: OBJETIVOS_PLAN[form.plan] ?? [],
    });
    toast.success("Entregables y objetivos recargados del catálogo");
  };

  const updateEntregable = (i: number, field: keyof EntregableItem, val: string) => {
    const arr = [...(form.entregables ?? [])];
    arr[i] = { ...arr[i], [field]: val };
    setForm({ ...form, entregables: arr });
  };
  const addEntregable = () => setForm({ ...form, entregables: [...(form.entregables ?? []), { titulo: "", descripcion: "" }] });
  const removeEntregable = (i: number) => setForm({ ...form, entregables: (form.entregables ?? []).filter((_, idx) => idx !== i) });

  const updateObjetivo = (i: number, val: string) => {
    const arr = [...(form.objetivos_propuesta ?? [])];
    arr[i] = val;
    setForm({ ...form, objetivos_propuesta: arr });
  };
  const addObjetivo = () => setForm({ ...form, objetivos_propuesta: [...(form.objetivos_propuesta ?? []), ""] });
  const removeObjetivo = (i: number) => setForm({ ...form, objetivos_propuesta: (form.objetivos_propuesta ?? []).filter((_, idx) => idx !== i) });


  const aplicarPais = (code: string) => {
    setPaisCode(code);
    const pais = getPais(code);
    // Re-precia los servicios actuales tomando el plan preset como referencia base USD
    if (form.plan && PLANES_PRESET[form.plan]) {
      const base = PLANES_PRESET[form.plan].servicios;
      const servicios = (form.servicios ?? []).map((s, i) => ({
        ...s,
        precio: base[i] ? ajustarPrecioPorPais(base[i].precio, pais) : s.precio,
      }));
      const r = recalcular(servicios, form.descuento_porcentaje ?? 0, form.descuento_valor ?? 0);
      setForm({ ...form, servicios, moneda: pais.moneda, ...r });
    } else {
      setForm({ ...form, moneda: pais.moneda });
    }
  };

  const recalcularIME = () => {
    if (!form.plan) { toast.error("Selecciona un plan primero"); return; }
    const ime = calcularIME(form.plan, rangoFact);
    if (!ime) { toast.error("No se pudo calcular el IME"); return; }
    setForm({ ...form, ime_estimado: ime.texto });
    toast.success("IME estimado actualizado");
  };

  const aplicarJustificacionAuto = () => {
    if (!form.plan) { toast.error("Selecciona un plan primero"); return; }
    setForm({ ...form, justificacion_programa: justificacionPorPlan(form.plan) });
    toast.success("Justificación cargada");
  };

  const updateServicio = (i: number, field: keyof Servicio, val: string) => {
    const servicios = [...(form.servicios ?? [])];
    servicios[i] = { ...servicios[i], [field]: field === "nombre" ? val : Number(val) };
    const r = recalcular(servicios, form.descuento_porcentaje ?? 0, form.descuento_valor ?? 0);
    setForm({ ...form, servicios, ...r });
  };

  const addServicio = () => setForm({ ...form, servicios: [...(form.servicios ?? []), { nombre: "", cantidad: 1, precio: 0 }] });
  const removeServicio = (i: number) => {
    const servicios = (form.servicios ?? []).filter((_, idx) => idx !== i);
    const r = recalcular(servicios, form.descuento_porcentaje ?? 0, form.descuento_valor ?? 0);
    setForm({ ...form, servicios, ...r });
  };

  const save = async () => {
    if (!form.titulo?.trim()) { toast.error("Falta el título"); return; }
    const payload = {
      cliente_id: clienteId,
      consultor_id: consultorId,
      contacto_id: form.contacto_id || null,
      titulo: form.titulo,
      descripcion: form.descripcion || null,
      plan: form.plan || null,
      servicios: form.servicios ?? [],
      subtotal: form.subtotal ?? 0,
      descuento_porcentaje: form.descuento_porcentaje ?? 0,
      descuento_valor: form.descuento_valor ?? 0,
      total: form.total ?? 0,
      moneda: form.moneda ?? "USD",
      estado: form.estado ?? "borrador",
      validez_dias: form.validez_dias ?? 30,
      fecha_emision: form.fecha_emision || null,
      notas: form.notas || null,
      condiciones: form.condiciones || null,
      ime_estimado: form.ime_estimado || null,
      justificacion_programa: form.justificacion_programa || null,
      entregables: form.entregables ?? [],
      objetivos_propuesta: form.objetivos_propuesta ?? [],
      diagnostico_resumen: form.diagnostico_resumen || null,
      nivel_acompanamiento: form.nivel_acompanamiento || null,
      plan_plataforma_id: form.plan_plataforma_id || null,
    };
    const { error } = form.id
      ? await supabase.from("cliente_cotizaciones").update(payload as never).eq("id", form.id)
      : await supabase.from("cliente_cotizaciones").insert(payload as never);
    if (error) { toast.error(error.message); return; }
    toast.success("Cotización guardada");
    onSaved();
  };

  return (
    <Dialog open onOpenChange={onClose}>
      <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
        <DialogHeader><DialogTitle>{form.id ? `Editar ${form.numero_cotizacion}` : "Nueva cotización"}</DialogTitle></DialogHeader>

        {cliente && (
          <div className="text-xs text-muted-foreground">
            <span className="font-medium text-navy">Plan actual del cliente:</span>{" "}
            <Badge variant="outline" className="text-xs">{cliente.plan_licencia ?? "Sin plan asignado"}</Badge>
          </div>
        )}

        <div className="grid grid-cols-2 gap-3">
          <div><Label>Plan</Label>
            <Select value={form.plan ?? ""} onValueChange={cargarPlan}>
              <SelectTrigger><SelectValue placeholder="Seleccionar plan" /></SelectTrigger>
              <SelectContent>
                {Object.entries(PLANES_PRESET).map(([k, v]) => <SelectItem key={k} value={k}>{v.label}</SelectItem>)}
              </SelectContent>
            </Select>
          </div>
          <div><Label>Estado</Label>
            <Select value={form.estado ?? "borrador"} onValueChange={(v) => setForm({ ...form, estado: v })}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>{ESTADOS_COTIZACION.map((e) => <SelectItem key={e.value} value={e.value}>{e.label}</SelectItem>)}</SelectContent>
            </Select>
          </div>
          <div><Label>Nivel de acompañamiento</Label>
            <Select value={form.nivel_acompanamiento ?? ""} onValueChange={(v) => setForm({ ...form, nivel_acompanamiento: v || null })}>
              <SelectTrigger><SelectValue placeholder="—" /></SelectTrigger>
              <SelectContent>
                {Object.entries(NIVEL_LABELS).map(([k, v]) => <SelectItem key={k} value={k}>{v}</SelectItem>)}
              </SelectContent>
            </Select>
            {sugerenciaInicial && !!form.nivel_acompanamiento && form.nivel_acompanamiento !== sugerenciaInicial.nivel && (
              <p className="text-xs text-amber-600 mt-1">⚠ Ajustado manualmente (sugerencia: {NIVEL_LABELS[sugerenciaInicial.nivel] ?? sugerenciaInicial.nivel})</p>
            )}
          </div>
          <div><Label>Plan de plataforma cotizado <span className="text-muted-foreground text-xs font-normal">(opcional)</span></Label>
            <Select value={form.plan_plataforma_id ?? "__ninguno__"} onValueChange={(v) => setForm({ ...form, plan_plataforma_id: v === "__ninguno__" ? null : v })}>
              <SelectTrigger><SelectValue placeholder="Sin plan cotizado" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="__ninguno__">Sin plan cotizado</SelectItem>
                {planes.map((p) => <SelectItem key={p.id} value={p.id}>{p.nombre}</SelectItem>)}
              </SelectContent>
            </Select>
            {sugerenciaInicial && !!form.plan_plataforma_id && form.plan_plataforma_id !== sugerenciaInicial.planId && (
              <p className="text-xs text-amber-600 mt-1">⚠ Ajustado manualmente (sugerencia: {sugerenciaInicial.plan.charAt(0).toUpperCase() + sugerenciaInicial.plan.slice(1)})</p>
            )}
          </div>
          <div className="col-span-2"><Label>Título *</Label><Input value={form.titulo ?? ""} onChange={(e) => setForm({ ...form, titulo: e.target.value })} /></div>
          <div className="col-span-2"><Label>Descripción</Label><Textarea rows={2} value={form.descripcion ?? ""} onChange={(e) => setForm({ ...form, descripcion: e.target.value })} /></div>

          <div><Label>Contacto</Label>
            <Select value={form.contacto_id ?? ""} onValueChange={(v) => setForm({ ...form, contacto_id: v })}>
              <SelectTrigger><SelectValue placeholder="—" /></SelectTrigger>
              <SelectContent>{contactos.map((c) => <SelectItem key={c.id} value={c.id}>{c.nombre} {c.apellido}</SelectItem>)}</SelectContent>
            </Select>
          </div>
          <div><Label>País / referencia de precios</Label>
            <Select value={paisCode} onValueChange={aplicarPais}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                {PAISES_LATAM.map((p) => (
                  <SelectItem key={p.code} value={p.code}>{p.nombre} ({p.moneda})</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div><Label>Moneda</Label><Input value={form.moneda ?? "USD"} onChange={(e) => setForm({ ...form, moneda: e.target.value })} /></div>
          <div><Label>Fecha emisión</Label><Input type="date" value={form.fecha_emision ?? ""} onChange={(e) => setForm({ ...form, fecha_emision: e.target.value })} /></div>
          <div><Label>Validez (días)</Label><Input type="number" value={form.validez_dias ?? 30} onChange={(e) => setForm({ ...form, validez_dias: Number(e.target.value) })} /></div>
        </div>

        {/* Servicios */}
        <div className="mt-4">
          <div className="flex items-center justify-between mb-2">
            <Label>Servicios</Label>
            <Button size="sm" variant="outline" onClick={addServicio}><Plus className="w-3 h-3 mr-1" /> Agregar línea</Button>
          </div>
          <div className="space-y-2">
            {(form.servicios ?? []).map((s, i) => (
              <div key={i} className="grid grid-cols-12 gap-2 items-center">
                <Input className="col-span-7" placeholder="Servicio" value={s.nombre} onChange={(e) => updateServicio(i, "nombre", e.target.value)} />
                <Input className="col-span-2" type="number" placeholder="Cant" value={s.cantidad} onChange={(e) => updateServicio(i, "cantidad", e.target.value)} />
                <Input className="col-span-2" type="number" placeholder="Precio" value={s.precio} onChange={(e) => updateServicio(i, "precio", e.target.value)} />
                <Button size="sm" variant="ghost" className="col-span-1 text-red-600" onClick={() => removeServicio(i)}>×</Button>
              </div>
            ))}
            {(form.servicios ?? []).length === 0 && <div className="text-xs text-muted-foreground p-3 bg-cream rounded">Selecciona un plan o agrega servicios manualmente.</div>}
          </div>
        </div>

        {/* Totales */}
        <div className="grid grid-cols-3 gap-3 mt-4">
          <div><Label>Descuento %</Label><Input type="number" value={form.descuento_porcentaje ?? 0} onChange={(e) => setForm({ ...form, descuento_porcentaje: Number(e.target.value) })} /></div>
          <div><Label>Subtotal</Label><Input value={(form.subtotal ?? 0).toFixed(2)} disabled /></div>
          <div><Label>Total</Label><Input value={(form.total ?? 0).toFixed(2)} disabled className="font-semibold" /></div>
        </div>

        <div className="grid grid-cols-1 gap-3 mt-4">
          {/* IME */}
          <div className="border-2 border-gold/40 bg-cream/50 rounded p-3 space-y-2">
            <div className="flex items-center justify-between">
              <Label className="text-navy font-semibold">Impacto Monetario Esperado (IME)</Label>
              <Button size="sm" variant="outline" onClick={recalcularIME}>
                <Sparkles className="w-3 h-3 mr-1" /> Calcular
              </Button>
            </div>
            <div className="grid grid-cols-2 gap-2">
              <div>
                <Label className="text-xs">Rango facturación cliente</Label>
                <Select value={rangoFact} onValueChange={setRangoFact}>
                  <SelectTrigger className="h-9"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {RANGOS_FACTURACION.map((r) => (
                      <SelectItem key={r.value} value={r.value}>{r.label}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
            <Textarea
              rows={2}
              placeholder="Estimación del retorno esperado para el cliente"
              value={form.ime_estimado ?? ""}
              onChange={(e) => setForm({ ...form, ime_estimado: e.target.value })}
            />
          </div>

          {/* Justificación */}
          <div>
            <div className="flex items-center justify-between">
              <Label>Justificación de la inversión</Label>
              <Button size="sm" variant="ghost" onClick={aplicarJustificacionAuto}>
                <Sparkles className="w-3 h-3 mr-1" /> Sugerir según plan
              </Button>
            </div>
            <Textarea
              rows={3}
              value={form.justificacion_programa ?? ""}
              onChange={(e) => setForm({ ...form, justificacion_programa: e.target.value })}
              placeholder="Por qué este programa es la mejor opción para el cliente"
            />
          </div>

          {/* Diagnóstico para Propuesta Comercial */}
          <div className="border-2 border-navy/20 bg-navy/5 rounded p-3 space-y-2">
            <div className="flex items-center justify-between">
              <Label className="text-navy font-semibold">Diagnóstico (para Propuesta Comercial)</Label>
              <Button size="sm" variant="outline" onClick={importarDiagnostico}>
                <RefreshCw className="w-3 h-3 mr-1" /> Importar del Onboarding
              </Button>
            </div>
            <Textarea
              rows={3}
              placeholder="Resumen del diagnóstico actual del cliente (situación, retos, contexto)…"
              value={form.diagnostico_resumen ?? ""}
              onChange={(e) => setForm({ ...form, diagnostico_resumen: e.target.value })}
            />
            <p className="text-xs text-muted-foreground">El SIDE más reciente y los retos del Onboarding se anexan automáticamente al PDF.</p>
          </div>

          {/* Objetivos del programa */}
          <div className="border rounded p-3 space-y-2">
            <div className="flex items-center justify-between">
              <Label className="text-navy font-semibold">Objetivos del programa</Label>
              <div className="flex gap-1">
                <Button size="sm" variant="ghost" onClick={recargarEntregables} title="Recargar del catálogo según plan"><Sparkles className="w-3 h-3 mr-1" /> Catálogo</Button>
                <Button size="sm" variant="outline" onClick={addObjetivo}><Plus className="w-3 h-3" /></Button>
              </div>
            </div>
            <div className="space-y-1">
              {(form.objetivos_propuesta ?? []).map((o, i) => (
                <div key={i} className="flex gap-2 items-start">
                  <Input value={o} onChange={(e) => updateObjetivo(i, e.target.value)} placeholder="Objetivo concreto y medible" />
                  <Button size="sm" variant="ghost" className="text-red-600" onClick={() => removeObjetivo(i)}><Trash2 className="w-3 h-3" /></Button>
                </div>
              ))}
              {(form.objetivos_propuesta ?? []).length === 0 && (
                <div className="text-xs text-muted-foreground">Selecciona un plan o agrega objetivos.</div>
              )}
            </div>
          </div>

          {/* Entregables */}
          <div className="border rounded p-3 space-y-2">
            <div className="flex items-center justify-between">
              <Label className="text-navy font-semibold">Entregables del programa</Label>
              <Button size="sm" variant="outline" onClick={addEntregable}><Plus className="w-3 h-3 mr-1" /> Agregar</Button>
            </div>
            <div className="space-y-2">
              {(form.entregables ?? []).map((e, i) => (
                <div key={i} className="grid grid-cols-12 gap-2 items-start">
                  <Input className="col-span-4" placeholder="Entregable" value={e.titulo} onChange={(ev) => updateEntregable(i, "titulo", ev.target.value)} />
                  <Input className="col-span-7" placeholder="Descripción" value={e.descripcion} onChange={(ev) => updateEntregable(i, "descripcion", ev.target.value)} />
                  <Button size="sm" variant="ghost" className="col-span-1 text-red-600" onClick={() => removeEntregable(i)}><Trash2 className="w-3 h-3" /></Button>
                </div>
              ))}
              {(form.entregables ?? []).length === 0 && <div className="text-xs text-muted-foreground">Selecciona un plan para precargar.</div>}
            </div>
          </div>

          <div><Label>Condiciones</Label><Textarea rows={2} value={form.condiciones ?? ""} onChange={(e) => setForm({ ...form, condiciones: e.target.value })} /></div>
          <div><Label>Notas</Label><Textarea rows={2} value={form.notas ?? ""} onChange={(e) => setForm({ ...form, notas: e.target.value })} /></div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={onClose}>Cancelar</Button>
          <Button onClick={save} className="bg-gold text-navy hover:bg-gold/90">Guardar</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
