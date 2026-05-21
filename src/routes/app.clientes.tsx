import { createFileRoute, Link, Outlet, useRouterState } from "@tanstack/react-router";
import { useEffect, useMemo, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/lib/auth-context";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { ESTADOS, PLANES_LICENCIA, TAMANOS, ORIGENES, imeColor, imeLabel } from "@/lib/clientes-helpers";
import { LayoutGrid, List, Plus, Search, Building2, MapPin, User as UserIcon, ArrowRight } from "lucide-react";
import { toast } from "sonner";

export const Route = createFileRoute("/app/clientes")({ component: ClientesPage });

interface Cliente {
  id: string;
  nombre_empresa: string;
  nombre_comercial: string | null;
  sector: string | null;
  ciudad: string | null;
  pais: string | null;
  estado: string | null;
  plan_licencia: string;
  logo_url: string | null;
  updated_at: string;
}

interface IMEItem { cliente_id: string; ime_score: number | null; updated_at: string }
interface ContactoLite { cliente_id: string; nombre: string; apellido: string; cargo: string | null }

function ClientesPage() {
  const path = useRouterState({ select: (r) => r.location.pathname });
  const { user } = useAuth();
  const [clientes, setClientes] = useState<Cliente[]>([]);
  const [imes, setImes] = useState<Record<string, number | null>>({});
  const [contactos, setContactos] = useState<Record<string, ContactoLite>>({});
  const [loading, setLoading] = useState(true);
  const [view, setView] = useState<"cards" | "table">("cards");
  const [search, setSearch] = useState("");
  const [fEstado, setFEstado] = useState("__all");
  const [fPlan, setFPlan] = useState("__all");
  const [fSector, setFSector] = useState("__all");
  const [openWizard, setOpenWizard] = useState(false);

  const reload = async () => {
    setLoading(true);
    const { data: cs } = await supabase
      .from("clientes")
      .select("id,nombre_empresa,nombre_comercial,sector,ciudad,pais,estado,plan_licencia,logo_url,updated_at")
      .eq("activo", true)
      .order("updated_at", { ascending: false });
    const list = (cs ?? []) as Cliente[];
    setClientes(list);

    if (list.length) {
      const ids = list.map((c) => c.id);
      const [{ data: sides }, { data: cts }] = await Promise.all([
        supabase.from("side_sesiones").select("cliente_id, ime_score, updated_at").in("cliente_id", ids).order("updated_at", { ascending: false }),
        supabase.from("cliente_contactos").select("cliente_id,nombre,apellido,cargo,es_contacto_principal").in("cliente_id", ids).eq("activo", true),
      ]);
      const im: Record<string, number | null> = {};
      (sides ?? []).forEach((s: IMEItem) => { if (!(s.cliente_id in im)) im[s.cliente_id] = s.ime_score; });
      setImes(im);
      const cm: Record<string, ContactoLite> = {};
      (cts ?? []).forEach((c: ContactoLite & { es_contacto_principal: boolean }) => {
        if (c.es_contacto_principal || !cm[c.cliente_id]) cm[c.cliente_id] = c;
      });
      setContactos(cm);
    }
    setLoading(false);
  };

  useEffect(() => { if (user) reload(); }, [user]);

  const sectores = useMemo(() => Array.from(new Set(clientes.map((c) => c.sector).filter(Boolean) as string[])).sort(), [clientes]);

  const filtered = useMemo(() => clientes.filter((c) => {
    if (fEstado !== "__all" && (c.estado ?? "activo") !== fEstado) return false;
    if (fPlan !== "__all" && c.plan_licencia !== fPlan) return false;
    if (fSector !== "__all" && c.sector !== fSector) return false;
    if (search) {
      const q = search.toLowerCase();
      const ct = contactos[c.id];
      const ctName = ct ? `${ct.nombre} ${ct.apellido}` : "";
      if (![c.nombre_empresa, c.nombre_comercial, c.sector, c.ciudad, ctName].filter(Boolean).join(" ").toLowerCase().includes(q)) return false;
    }
    return true;
  }), [clientes, fEstado, fPlan, fSector, search, contactos]);

  if (path !== "/app/clientes") {
    return <Outlet />;
  }

  return (
    <div className="max-w-[1400px]">
      <div className="flex items-end justify-between flex-wrap gap-4">
        <div>
          <h1 className="font-display text-3xl text-navy">Mis clientes</h1>
          <p className="text-sm text-muted-foreground mt-1">Cartera completa con vista 360°.</p>
        </div>
        <Button onClick={() => setOpenWizard(true)} className="bg-navy hover:bg-navy/90">
          <Plus className="w-4 h-4 mr-1" /> Nuevo cliente
        </Button>
      </div>

      {/* Filtros */}
      <div className="a360-card a360-card-lg mt-6 p-4 grid grid-cols-1 md:grid-cols-5 gap-3">
        <div className="relative md:col-span-2">
          <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
          <Input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Buscar empresa, contacto, sector..." className="pl-9" />
        </div>
        <Select value={fEstado} onValueChange={setFEstado}>
          <SelectTrigger><SelectValue placeholder="Estado" /></SelectTrigger>
          <SelectContent>
            <SelectItem value="__all">Todos los estados</SelectItem>
            {ESTADOS.map((e) => <SelectItem key={e.value} value={e.value}>{e.label}</SelectItem>)}
          </SelectContent>
        </Select>
        <Select value={fPlan} onValueChange={setFPlan}>
          <SelectTrigger><SelectValue placeholder="Plan" /></SelectTrigger>
          <SelectContent>
            <SelectItem value="__all">Todos los planes</SelectItem>
            {PLANES_LICENCIA.map((p) => <SelectItem key={p} value={p} className="capitalize">{p}</SelectItem>)}
          </SelectContent>
        </Select>
        <Select value={fSector} onValueChange={setFSector}>
          <SelectTrigger><SelectValue placeholder="Sector" /></SelectTrigger>
          <SelectContent>
            <SelectItem value="__all">Todos los sectores</SelectItem>
            {sectores.map((s) => <SelectItem key={s} value={s}>{s}</SelectItem>)}
          </SelectContent>
        </Select>
      </div>

      <div className="flex items-center justify-between mt-4">
        <div className="text-sm text-muted-foreground">{filtered.length} de {clientes.length} clientes</div>
        <div className="flex gap-1 bg-cream rounded-md p-1 border">
          <button onClick={() => setView("cards")} className={`px-3 py-1.5 rounded text-xs font-medium flex items-center gap-1 ${view === "cards" ? "bg-white text-navy shadow-sm" : "text-muted-foreground"}`}>
            <LayoutGrid className="w-3.5 h-3.5" /> Tarjetas
          </button>
          <button onClick={() => setView("table")} className={`px-3 py-1.5 rounded text-xs font-medium flex items-center gap-1 ${view === "table" ? "bg-white text-navy shadow-sm" : "text-muted-foreground"}`}>
            <List className="w-3.5 h-3.5" /> Tabla
          </button>
        </div>
      </div>

      {loading ? (
        <div className="a360-card a360-card-lg p-12 mt-4 text-center text-muted-foreground">Cargando…</div>
      ) : filtered.length === 0 ? (
        <div className="a360-card a360-card-lg p-12 mt-4 text-center text-muted-foreground">No hay clientes con esos filtros.</div>
      ) : view === "cards" ? (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4 mt-4">
          {filtered.map((c) => {
            const estado = ESTADOS.find((e) => e.value === (c.estado ?? "activo"));
            const ime = imes[c.id];
            const ct = contactos[c.id];
            return (
              <Link key={c.id} to="/app/clientes/$clienteId" params={{ clienteId: c.id }}
                className="a360-card a360-card-lg p-5 hover:shadow-lg transition-all group">
                <div className="flex items-start gap-3">
                  {c.logo_url ? (
                    <img src={c.logo_url} alt="" className="w-12 h-12 rounded-md object-cover border" />
                  ) : (
                    <div className="w-12 h-12 rounded-md bg-navy text-white flex items-center justify-center font-display text-lg">
                      {c.nombre_empresa[0]?.toUpperCase()}
                    </div>
                  )}
                  <div className="flex-1 min-w-0">
                    <div className="font-semibold text-navy truncate group-hover:text-gold transition">{c.nombre_empresa}</div>
                    {c.nombre_comercial && <div className="text-xs text-muted-foreground truncate">{c.nombre_comercial}</div>}
                    <div className="flex items-center gap-2 text-xs text-muted-foreground mt-1">
                      <Building2 className="w-3 h-3" />{c.sector ?? "—"}
                      <MapPin className="w-3 h-3 ml-2" />{c.ciudad ?? "—"}
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-2 mt-3 flex-wrap">
                  {estado && <Badge variant="outline" className={estado.color}>{estado.label}</Badge>}
                  <Badge variant="outline" className="capitalize">{c.plan_licencia}</Badge>
                </div>

                {ct && (
                  <div className="mt-3 flex items-center gap-2 text-xs text-muted-foreground">
                    <UserIcon className="w-3 h-3" />
                    <span className="truncate"><span className="text-navy font-medium">{ct.nombre} {ct.apellido}</span>{ct.cargo ? ` · ${ct.cargo}` : ""}</span>
                  </div>
                )}

                <div className="mt-3 pt-3 border-t flex items-center justify-between">
                  <div>
                    <div className="text-[10px] uppercase tracking-wider text-muted-foreground">IME actual</div>
                    <div className={`font-display text-lg ${imeColor(ime)}`}>
                      {ime != null ? ime.toFixed(0) : "—"} <span className="text-xs font-normal">{imeLabel(ime)}</span>
                    </div>
                  </div>
                  <ArrowRight className="w-4 h-4 text-gold opacity-0 group-hover:opacity-100 transition" />
                </div>
              </Link>
            );
          })}
        </div>
      ) : (
        <div className="a360-card a360-card-lg mt-4 overflow-hidden">
          <table className="w-full text-sm">
            <thead className="bg-cream text-navy">
              <tr className="text-left">
                <th className="px-5 py-3 font-semibold text-xs uppercase tracking-wider">Empresa</th>
                <th className="px-5 py-3 font-semibold text-xs uppercase tracking-wider">Estado</th>
                <th className="px-5 py-3 font-semibold text-xs uppercase tracking-wider">Sector</th>
                <th className="px-5 py-3 font-semibold text-xs uppercase tracking-wider">Ubicación</th>
                <th className="px-5 py-3 font-semibold text-xs uppercase tracking-wider">Plan</th>
                <th className="px-5 py-3 font-semibold text-xs uppercase tracking-wider">IME</th>
                <th className="px-5 py-3" />
              </tr>
            </thead>
            <tbody>
              {filtered.map((c) => {
                const estado = ESTADOS.find((e) => e.value === (c.estado ?? "activo"));
                const ime = imes[c.id];
                return (
                  <tr key={c.id} className="border-t border-border/60 hover:bg-cream/40">
                    <td className="px-5 py-3 font-medium text-navy">{c.nombre_empresa}</td>
                    <td className="px-5 py-3">{estado && <Badge variant="outline" className={estado.color}>{estado.label}</Badge>}</td>
                    <td className="px-5 py-3 text-muted-foreground">{c.sector ?? "—"}</td>
                    <td className="px-5 py-3 text-muted-foreground">{[c.ciudad, c.pais].filter(Boolean).join(", ") || "—"}</td>
                    <td className="px-5 py-3 text-muted-foreground capitalize">{c.plan_licencia}</td>
                    <td className={`px-5 py-3 font-semibold ${imeColor(ime)}`}>{ime != null ? ime.toFixed(0) : "—"}</td>
                    <td className="px-5 py-3 text-right">
                      <Link to="/app/clientes/$clienteId" params={{ clienteId: c.id }} className="text-gold text-xs font-semibold hover:underline">Abrir 360° →</Link>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}

      {openWizard && <NuevoClienteWizard onClose={() => setOpenWizard(false)} onCreated={reload} />}
    </div>
  );
}

function NuevoClienteWizard({ onClose, onCreated }: { onClose: () => void; onCreated: () => void }) {
  const { user } = useAuth();
  const [step, setStep] = useState(1);
  const [saving, setSaving] = useState(false);

  // Step 1
  const [empresa, setEmpresa] = useState({
    nombre_empresa: "", nombre_comercial: "", sector: "", subsector: "",
    tamano: "", num_empleados: "", pais: "", ciudad: "", web: "", descripcion: "",
  });
  // Step 2
  const [contacto, setContacto] = useState({
    nombre: "", apellido: "", cargo: "", area: "", email: "", celular: "",
  });
  // Step 3
  const [config, setConfig] = useState({ plan_licencia: "esencial", estado: "activo", origen: "" });

  const next = () => {
    if (step === 1 && !empresa.nombre_empresa.trim()) { toast.error("Falta el nombre de la empresa"); return; }
    if (step === 2 && (!contacto.nombre.trim() || !contacto.apellido.trim())) { toast.error("Falta nombre/apellido del contacto"); return; }
    setStep(step + 1);
  };

  const submit = async () => {
    if (!user) { toast.error("Sesión no detectada. Vuelve a iniciar sesión."); return; }
    if (!empresa.nombre_empresa.trim()) { toast.error("Falta el nombre legal de la empresa"); setStep(1); return; }
    setSaving(true);
    try {
      const cleanStr = (v: string) => (v.trim() === "" ? null : v);
      const payload = {
        nombre_empresa: empresa.nombre_empresa.trim(),
        nombre_comercial: cleanStr(empresa.nombre_comercial),
        sector: cleanStr(empresa.sector),
        subsector: cleanStr(empresa.subsector),
        tamano: cleanStr(empresa.tamano),
        pais: cleanStr(empresa.pais),
        ciudad: cleanStr(empresa.ciudad),
        web: cleanStr(empresa.web),
        descripcion: cleanStr(empresa.descripcion),
        num_empleados: empresa.num_empleados ? parseInt(empresa.num_empleados) : null,
        plan_licencia: config.plan_licencia || "esencial",
        estado: config.estado || "activo",
        origen: cleanStr(config.origen),
        consultor_id: user.id,
        fecha_inicio_relacion: new Date().toISOString().slice(0, 10),
      };
      console.log("[clientes] insert payload", payload);
      const { data: cli, error: e1 } = await supabase.from("clientes").insert(payload).select("id").single();
      if (e1 || !cli) {
        console.error("[clientes] insert error", e1);
        toast.error(`No se pudo crear el cliente: ${e1?.message ?? "error desconocido"}`);
        setSaving(false);
        return;
      }

      if (contacto.nombre.trim() && contacto.apellido.trim()) {
        const { error: e2 } = await supabase.from("cliente_contactos").insert({
          cliente_id: cli.id,
          ...clean(contacto),
          nombre: contacto.nombre,
          apellido: contacto.apellido,
          es_contacto_principal: true,
        });
        if (e2) {
          console.error("[contactos] insert error", e2);
          toast.warning(`Cliente creado, pero falló el contacto: ${e2.message}`);
        }
      }
      toast.success("Cliente creado");
      onCreated();
      onClose();
    } catch (err) {
      console.error("[clientes] submit exception", err);
      toast.error(`Error inesperado: ${err instanceof Error ? err.message : String(err)}`);
    } finally {
      setSaving(false);
    }
  };

  return (
    <Dialog open onOpenChange={onClose}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>Nuevo cliente — Paso {step} de 3</DialogTitle>
          <div className="flex gap-1 mt-2">
            {[1, 2, 3].map((s) => (
              <div key={s} className={`flex-1 h-1.5 rounded ${s <= step ? "bg-gold" : "bg-muted"}`} />
            ))}
          </div>
        </DialogHeader>

        {step === 1 && (
          <div className="grid grid-cols-2 gap-3 mt-2">
            <div className="col-span-2"><Label>Nombre legal *</Label><Input value={empresa.nombre_empresa} onChange={(e) => setEmpresa({ ...empresa, nombre_empresa: e.target.value })} /></div>
            <div><Label>Nombre comercial</Label><Input value={empresa.nombre_comercial} onChange={(e) => setEmpresa({ ...empresa, nombre_comercial: e.target.value })} /></div>
            <div><Label>Sector</Label><Input value={empresa.sector} onChange={(e) => setEmpresa({ ...empresa, sector: e.target.value })} /></div>
            <div><Label>Subsector</Label><Input value={empresa.subsector} onChange={(e) => setEmpresa({ ...empresa, subsector: e.target.value })} /></div>
            <div><Label>Tamaño</Label>
              <Select value={empresa.tamano} onValueChange={(v) => setEmpresa({ ...empresa, tamano: v })}>
                <SelectTrigger><SelectValue placeholder="Seleccionar" /></SelectTrigger>
                <SelectContent>{TAMANOS.map((t) => <SelectItem key={t.value} value={t.value}>{t.label}</SelectItem>)}</SelectContent>
              </Select>
            </div>
            <div><Label>N° empleados</Label><Input type="number" value={empresa.num_empleados} onChange={(e) => setEmpresa({ ...empresa, num_empleados: e.target.value })} /></div>
            <div><Label>País</Label><Input value={empresa.pais} onChange={(e) => setEmpresa({ ...empresa, pais: e.target.value })} /></div>
            <div><Label>Ciudad</Label><Input value={empresa.ciudad} onChange={(e) => setEmpresa({ ...empresa, ciudad: e.target.value })} /></div>
            <div className="col-span-2"><Label>Web</Label><Input value={empresa.web} onChange={(e) => setEmpresa({ ...empresa, web: e.target.value })} /></div>
            <div className="col-span-2"><Label>Descripción</Label><Textarea rows={2} value={empresa.descripcion} onChange={(e) => setEmpresa({ ...empresa, descripcion: e.target.value })} /></div>
          </div>
        )}

        {step === 2 && (
          <div className="grid grid-cols-2 gap-3 mt-2">
            <div className="col-span-2 text-xs text-muted-foreground">Agrega al menos 1 contacto principal. Después podrás añadir más.</div>
            <div><Label>Nombre *</Label><Input value={contacto.nombre} onChange={(e) => setContacto({ ...contacto, nombre: e.target.value })} /></div>
            <div><Label>Apellido *</Label><Input value={contacto.apellido} onChange={(e) => setContacto({ ...contacto, apellido: e.target.value })} /></div>
            <div><Label>Cargo</Label><Input value={contacto.cargo} onChange={(e) => setContacto({ ...contacto, cargo: e.target.value })} /></div>
            <div><Label>Área</Label><Input value={contacto.area} onChange={(e) => setContacto({ ...contacto, area: e.target.value })} /></div>
            <div><Label>Email</Label><Input type="email" value={contacto.email} onChange={(e) => setContacto({ ...contacto, email: e.target.value })} /></div>
            <div><Label>Celular</Label><Input value={contacto.celular} onChange={(e) => setContacto({ ...contacto, celular: e.target.value })} /></div>
          </div>
        )}

        {step === 3 && (
          <div className="grid grid-cols-2 gap-3 mt-2">
            <div><Label>Plan de licencia</Label>
              <Select value={config.plan_licencia} onValueChange={(v) => setConfig({ ...config, plan_licencia: v })}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>{PLANES_LICENCIA.map((p) => <SelectItem key={p} value={p} className="capitalize">{p}</SelectItem>)}</SelectContent>
              </Select>
            </div>
            <div><Label>Estado inicial</Label>
              <Select value={config.estado} onValueChange={(v) => setConfig({ ...config, estado: v })}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>{ESTADOS.map((e) => <SelectItem key={e.value} value={e.value}>{e.label}</SelectItem>)}</SelectContent>
              </Select>
            </div>
            <div className="col-span-2"><Label>Origen</Label>
              <Select value={config.origen} onValueChange={(v) => setConfig({ ...config, origen: v })}>
                <SelectTrigger><SelectValue placeholder="Seleccionar" /></SelectTrigger>
                <SelectContent>{ORIGENES.map((o) => <SelectItem key={o} value={o} className="capitalize">{o}</SelectItem>)}</SelectContent>
              </Select>
            </div>
            <div className="col-span-2 text-xs text-muted-foreground p-3 bg-cream rounded-md">
              El consultor asignado será tu cuenta. La fecha de inicio se establece en hoy.
            </div>
          </div>
        )}

        <DialogFooter className="gap-2">
          {step > 1 && <Button variant="outline" onClick={() => setStep(step - 1)}>Anterior</Button>}
          {step < 3 && <Button onClick={next} className="bg-navy hover:bg-navy/90">Siguiente</Button>}
          {step === 3 && <Button onClick={submit} disabled={saving} className="bg-gold hover:bg-gold/90 text-navy">{saving ? "Guardando…" : "Crear cliente"}</Button>}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
