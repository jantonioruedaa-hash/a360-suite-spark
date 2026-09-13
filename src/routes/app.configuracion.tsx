import { createFileRoute } from "@tanstack/react-router";
import { useAuth } from "@/lib/auth-context";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";
import { toast } from "sonner";
import { Save, UserCog, UserPlus, Trash2, Upload, Palette, FileText, ShieldCheck } from "lucide-react";
import { Textarea } from "@/components/ui/textarea";
import { useAppSettings, EDITABLE_TEXTS } from "@/lib/app-settings";
import { LEE_CAPITULOS } from "@/lib/lee-catalogo";

export const Route = createFileRoute("/app/configuracion")({ component: Config });

function Config() {
  const { role } = useAuth();
  const isAdmin = role === "admin";
  const canBranding = role === "admin" || role === "consultor";
  return (
    <div className="max-w-5xl space-y-6">
      <h1 className="font-display text-3xl text-navy">Configuración</h1>
      <Tabs defaultValue="perfil">
        <TabsList>
          <TabsTrigger value="perfil"><UserCog className="w-4 h-4 mr-2" />Mi perfil</TabsTrigger>
          {isAdmin && <TabsTrigger value="permisos"><ShieldCheck className="w-4 h-4 mr-2" />Permisos</TabsTrigger>}
          {canBranding && <TabsTrigger value="branding"><Palette className="w-4 h-4 mr-2" />Branding</TabsTrigger>}
          {canBranding && <TabsTrigger value="contenido"><FileText className="w-4 h-4 mr-2" />Contenido</TabsTrigger>}
        </TabsList>
        <TabsContent value="perfil" className="mt-6"><PerfilForm /></TabsContent>
        {isAdmin && <TabsContent value="permisos" className="mt-6"><PermisosModuloAdmin /></TabsContent>}
        {canBranding && <TabsContent value="branding" className="mt-6"><BrandingForm /></TabsContent>}
        {canBranding && <TabsContent value="contenido" className="mt-6"><ContenidoEditor /></TabsContent>}
      </Tabs>
    </div>
  );
}

function BrandingForm() {
  const { settings, update, refresh } = useAppSettings();
  const [form, setForm] = useState(settings);
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);

  useEffect(() => { setForm(settings); }, [settings]);

  const handleLogoUpload = async (file: File) => {
    setUploading(true);
    const ext = file.name.split(".").pop() || "png";
    const path = `logo-${Date.now()}.${ext}`;
    const { error: upErr } = await supabase.storage.from("branding").upload(path, file, { upsert: true, contentType: file.type });
    if (upErr) { toast.error(upErr.message); setUploading(false); return; }
    const { data } = supabase.storage.from("branding").getPublicUrl(path);
    setForm({ ...form, logo_url: data.publicUrl });
    setUploading(false);
    toast.success("Logo subido. No olvides guardar.");
  };

  const save = async () => {
    setSaving(true);
    const { error } = await update({
      company_name: form.company_name,
      app_name: form.app_name,
      logo_url: form.logo_url,
      primary_color: form.primary_color,
      accent_color: form.accent_color,
      font_family: form.font_family,
    });
    if (error) toast.error(error); else { toast.success("Branding actualizado"); await refresh(); }
    setSaving(false);
  };

  const FONTS = ["DM Sans", "Inter", "Roboto", "Poppins", "Montserrat", "Open Sans", "Lato", "Work Sans", "Nunito", "Source Sans 3"];

  return (
    <div className="a360-card a360-card-lg p-6 space-y-5">
      <div>
        <h2 className="font-display text-xl text-navy">Identidad visual</h2>
        <p className="text-sm text-muted-foreground">Estos cambios se aplican a todos los usuarios de la plataforma.</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <Label className="text-xs">Nombre de la empresa</Label>
          <Input value={form.company_name} onChange={(e) => setForm({ ...form, company_name: e.target.value })} />
        </div>
        <div>
          <Label className="text-xs">Nombre de la aplicación</Label>
          <Input value={form.app_name} onChange={(e) => setForm({ ...form, app_name: e.target.value })} />
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 items-end">
        <div className="md:col-span-2">
          <Label className="text-xs">Logotipo</Label>
          <div className="flex items-center gap-3 mt-1">
            <input
              id="logo-file"
              type="file"
              accept="image/*"
              className="hidden"
              onChange={(e) => { const f = e.target.files?.[0]; if (f) void handleLogoUpload(f); }}
            />
            <Button variant="outline" disabled={uploading} onClick={() => document.getElementById("logo-file")?.click()}>
              <Upload className="w-4 h-4 mr-1" />{uploading ? "Subiendo…" : "Subir logo"}
            </Button>
            <Input
              placeholder="o pega una URL pública"
              value={form.logo_url ?? ""}
              onChange={(e) => setForm({ ...form, logo_url: e.target.value || null })}
            />
          </div>
        </div>
        <div className="flex items-center justify-center bg-muted/30 rounded-lg p-4 min-h-[88px]">
          {form.logo_url
            ? <img src={form.logo_url} alt="preview" className="max-h-16 object-contain" />
            : <span className="text-xs text-muted-foreground">Sin logo</span>}
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div>
          <Label className="text-xs">Color primario</Label>
          <div className="flex gap-2 mt-1">
            <input type="color" value={form.primary_color} onChange={(e) => setForm({ ...form, primary_color: e.target.value })} className="h-10 w-14 rounded border border-input cursor-pointer" />
            <Input value={form.primary_color} onChange={(e) => setForm({ ...form, primary_color: e.target.value })} />
          </div>
        </div>
        <div>
          <Label className="text-xs">Color de acento</Label>
          <div className="flex gap-2 mt-1">
            <input type="color" value={form.accent_color} onChange={(e) => setForm({ ...form, accent_color: e.target.value })} className="h-10 w-14 rounded border border-input cursor-pointer" />
            <Input value={form.accent_color} onChange={(e) => setForm({ ...form, accent_color: e.target.value })} />
          </div>
        </div>
        <div>
          <Label className="text-xs">Tipografía</Label>
          <Select value={form.font_family} onValueChange={(v) => setForm({ ...form, font_family: v })}>
            <SelectTrigger><SelectValue /></SelectTrigger>
            <SelectContent>{FONTS.map((f) => <SelectItem key={f} value={f}>{f}</SelectItem>)}</SelectContent>
          </Select>
        </div>
      </div>

      <div className="flex justify-end">
        <Button onClick={save} disabled={saving} className="bg-gold hover:bg-gold/90 text-navy">
          <Save className="w-4 h-4 mr-1" />{saving ? "Guardando…" : "Guardar branding"}
        </Button>
      </div>
    </div>
  );
}

function ContenidoEditor() {
  const { settings, update, refresh } = useAppSettings();
  const [draft, setDraft] = useState<Record<string, string>>(settings.content_strings ?? {});
  const [saving, setSaving] = useState(false);

  useEffect(() => { setDraft(settings.content_strings ?? {}); }, [settings]);

  const save = async () => {
    setSaving(true);
    const { error } = await update({ content_strings: draft });
    if (error) toast.error(error); else { toast.success("Contenido actualizado"); await refresh(); }
    setSaving(false);
  };

  return (
    <div className="a360-card a360-card-lg p-6 space-y-5">
      <div>
        <h2 className="font-display text-xl text-navy">Textos editables</h2>
        <p className="text-sm text-muted-foreground">Modifica los textos clave que aparecen en la plataforma. Si dejas un campo vacío se usa el texto por defecto.</p>
      </div>
      <div className="space-y-4">
        {EDITABLE_TEXTS.map((t) => (
          <div key={t.key}>
            <Label className="text-xs">{t.label} <span className="text-muted-foreground">· {t.key}</span></Label>
            {t.multiline ? (
              <Textarea
                rows={3}
                value={draft[t.key] ?? ""}
                onChange={(e) => setDraft({ ...draft, [t.key]: e.target.value })}
                placeholder={t.defaultValue}
              />
            ) : (
              <Input
                value={draft[t.key] ?? ""}
                onChange={(e) => setDraft({ ...draft, [t.key]: e.target.value })}
                placeholder={t.defaultValue}
              />
            )}
          </div>
        ))}
      </div>
      <div className="flex justify-end">
        <Button onClick={save} disabled={saving} className="bg-gold hover:bg-gold/90 text-navy">
          <Save className="w-4 h-4 mr-1" />{saving ? "Guardando…" : "Guardar contenido"}
        </Button>
      </div>
    </div>
  );
}

function PerfilForm() {
  const { user, profile, refresh } = useAuth();
  const [form, setForm] = useState({ name: "", company: "", specialty: "", avatar_url: "" });
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (profile) setForm({
      name: profile.name ?? "",
      company: profile.company ?? "",
      specialty: profile.specialty ?? "",
      avatar_url: profile.avatar_url ?? "",
    });
  }, [profile]);

  const save = async () => {
    if (!user) return;
    setSaving(true);
    const { error } = await supabase.from("profiles").update({
      name: form.name || null,
      company: form.company || null,
      specialty: form.specialty || null,
      avatar_url: form.avatar_url || null,
    }).eq("id", user.id);
    if (error) toast.error(error.message);
    else { toast.success("Perfil actualizado"); await refresh(); }
    setSaving(false);
  };

  return (
    <div className="a360-card a360-card-lg p-6 space-y-4">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div><Label className="text-xs">Correo</Label><Input value={user?.email ?? ""} disabled /></div>
        <div><Label className="text-xs">Nombre</Label><Input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} /></div>
        <div><Label className="text-xs">Empresa</Label><Input value={form.company} onChange={(e) => setForm({ ...form, company: e.target.value })} /></div>
        <div><Label className="text-xs">Especialidad</Label><Input value={form.specialty} onChange={(e) => setForm({ ...form, specialty: e.target.value })} /></div>
        <div className="md:col-span-2"><Label className="text-xs">URL de avatar</Label><Input value={form.avatar_url} onChange={(e) => setForm({ ...form, avatar_url: e.target.value })} placeholder="https://..." /></div>
      </div>
      <div className="flex justify-end">
        <Button onClick={save} disabled={saving} className="bg-gold hover:bg-gold/90 text-navy">
          <Save className="w-4 h-4 mr-1" />{saving ? "Guardando…" : "Guardar"}
        </Button>
      </div>
    </div>
  );
}

type ClienteOpt = { id: string; nombre_empresa: string };
type AreaOpt = { id: string; nombre: string };
type PermisoRow = {
  id: string;
  user_id: string;
  user_email: string;
  user_name: string | null;
  modulo: string;
  seccion: string | null;
  alcance_tipo: "area" | "todas";
  alcance_area_id: string | null;
  alcance_area_nombre: string | null;
  puede_ver: boolean;
  puede_editar: boolean;
  puede_eliminar: boolean;
};

type EmpresaUsuarioOpt = {
  user_id: string;
  email: string;
  name: string | null;
  rol_empresa: string;
};

const MODULOS_PERMISO = [
  { modulo: "side", moduloLabel: "SIDE", secciones: [
    { value: "L",  label: "Liderazgo"    },
    { value: "E",  label: "Estrategia"   },
    { value: "G",  label: "Gobernanza"   },
    { value: "O",  label: "Organización" },
    { value: "GE", label: "Gestión"      },
    { value: "F",  label: "Finanzas"     },
    { value: "C",  label: "Comercial"    },
    { value: "M",  label: "Marketing"    },
    { value: "OP", label: "Operaciones"  },
    { value: "CU", label: "Cultura"      },
    { value: "T",  label: "Talento"      },
    { value: "ES", label: "Escalabilidad"},
  ]},
  { modulo: "plan_estrategico", moduloLabel: "Plan Estratégico", secciones: [
    { value: "01",            label: "Presentación ejecutiva"      },
    { value: "02",            label: "PESTEL"                      },
    { value: "03",            label: "Diagnóstico interno + EFI"   },
    { value: "04",            label: "FODA + CAME"                 },
    { value: "05",            label: "Declaración estratégica"     },
    { value: "06",            label: "Ejes estratégicos"           },
    { value: "07",            label: "Objetivos + BSC"             },
    { value: "08",            label: "Estrategias corporativas"    },
    { value: "09",            label: "Estructura y plan operativo" },
    { value: "10_esg",        label: "Sostenibilidad y ESG"        },
    { value: "11_alianzas",   label: "Alianzas estratégicas"       },
    { value: "12_innovacion", label: "Innovación e I+D+i"          },
    { value: "13",            label: "Marketing estratégico"       },
    { value: "14",            label: "Talento y cultura"           },
    { value: "15",            label: "TI y transformación digital" },
  ]},
  { modulo: "lee", moduloLabel: "LEE", secciones:
    LEE_CAPITULOS.map((c) => ({ value: String(c.numero), label: c.titulo })),
  },
  { modulo: "coaching", moduloLabel: "Panel Coaching", secciones: [
    { value: "metodologia",  label: "Metodología"        },
    { value: "etapas",       label: "Las 4 etapas"       },
    { value: "herramientas", label: "Herramientas"       },
    { value: "radar",        label: "Radar 6 dimensiones"},
    { value: "plan90",       label: "Plan 90 días"       },
    { value: "preguntas",    label: "Preguntas poderosas"},
  ]},
  { modulo: "manual_funciones", moduloLabel: "Manual de Funciones", secciones: [
    { value: "cargos",       label: "Cargos y Áreas" },
    { value: "evaluaciones", label: "Evaluaciones"   },
  ]},
  { modulo: "cotizador", moduloLabel: "Cotizador", secciones: [] },
];


// ─── Permisos por módulo ──────────────────────────────────────────────────────
function PermisosModuloAdmin() {
  const [selectedClienteId, setSelectedClienteId] = useState("");
  const [clientes, setClientes]     = useState<ClienteOpt[]>([]);
  const [permisos, setPermisos]     = useState<PermisoRow[]>([]);
  const [euOpts, setEuOpts]         = useState<EmpresaUsuarioOpt[]>([]);
  const [areas, setAreas]           = useState<AreaOpt[]>([]);
  const [loading, setLoading]       = useState(false);
  const [addOpen, setAddOpen]       = useState(false);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  useEffect(() => {
    supabase.from("clientes").select("id,nombre_empresa").order("nombre_empresa")
      .then(({ data }) => setClientes(data ?? []));
  }, []);

  useEffect(() => {
    if (!selectedClienteId) { setPermisos([]); setEuOpts([]); setAreas([]); return; }
    setLoading(true);
    void (async () => {
      const { data: eu } = await (supabase as any)
        .from("empresa_usuarios").select("user_id,rol_empresa")
        .eq("cliente_id", selectedClienteId);

      const { data: permsData } = await (supabase as any)
        .from("permisos_usuario_modulo")
        .select("id,user_id,modulo,seccion,alcance_tipo,alcance_area_id,puede_ver,puede_editar,puede_eliminar")
        .eq("cliente_id", selectedClienteId);

      const { data: areasData } = await supabase
        .from("manual_areas").select("id,nombre")
        .eq("cliente_id", selectedClienteId).order("orden");

      const allIds = [...new Set([
        ...(eu ?? []).map((e: any) => e.user_id as string),
        ...(permsData ?? []).map((p: any) => p.user_id as string),
      ])];
      const { data: profs } = allIds.length
        ? await supabase.from("profiles").select("id,email,name").in("id", allIds)
        : { data: [] as { id: string; email: string; name: string | null }[] };

      const profMap = new Map((profs ?? []).map((p) => [p.id, p]));
      const areaMap = new Map((areasData ?? []).map((a) => [a.id, a.nombre]));

      setEuOpts((eu ?? []).map((e: any) => {
        const prof = profMap.get(e.user_id);
        return { user_id: e.user_id, email: prof?.email ?? "", name: prof?.name ?? null, rol_empresa: e.rol_empresa };
      }));

      setPermisos((permsData ?? []).map((p: any) => {
        const prof = profMap.get(p.user_id);
        return {
          ...p,
          user_email: prof?.email ?? "—",
          user_name:  prof?.name  ?? null,
          alcance_area_nombre: p.alcance_area_id ? (areaMap.get(p.alcance_area_id) ?? "—") : null,
        };
      }));

      setAreas(areasData ?? []);
      setLoading(false);
    })();
  }, [selectedClienteId]);

  const eliminar = async () => {
    if (!deletingId) return;
    const { error } = await (supabase as any)
      .from("permisos_usuario_modulo").delete().eq("id", deletingId);
    if (error) { toast.error("Error al eliminar"); return; }
    setPermisos((prev) => prev.filter((p) => p.id !== deletingId));
    setDeletingId(null);
    toast.success("Permiso eliminado");
  };

  const moduloLabel = (val: string) =>
    MODULOS_PERMISO.find((m) => m.modulo === val)?.moduloLabel ?? val;

  const seccionLabel = (modulo: string, seccion: string | null) => {
    if (!seccion) return "—";
    const entry = MODULOS_PERMISO.find((m) => m.modulo === modulo);
    return entry?.secciones.find((s) => s.value === seccion)?.label ?? seccion;
  };

  return (
    <div className="a360-card a360-card-lg p-6 space-y-5">
      <div>
        <h2 className="font-display text-xl text-navy">Permisos por módulo</h2>
        <p className="text-sm text-muted-foreground">
          Accesos horizontales (cross-área) limitados a funcionalidades específicas.
          Los permisos de jefe de área se gestionan en la pestaña Usuarios.
        </p>
      </div>

      <div className="max-w-xs">
        <Label className="text-xs">Empresa</Label>
        <Select value={selectedClienteId} onValueChange={setSelectedClienteId}>
          <SelectTrigger><SelectValue placeholder="Selecciona una empresa…" /></SelectTrigger>
          <SelectContent>
            {clientes.map((c) => <SelectItem key={c.id} value={c.id}>{c.nombre_empresa}</SelectItem>)}
          </SelectContent>
        </Select>
      </div>

      {selectedClienteId && (
        <>
          <div className="flex items-center justify-between">
            <span className="text-xs text-muted-foreground">{permisos.length} permiso(s) asignado(s)</span>
            <Button size="sm" className="bg-navy hover:bg-navy/90 text-primary-foreground" onClick={() => setAddOpen(true)}>
              <UserPlus className="w-4 h-4 mr-1" />Agregar permiso
            </Button>
          </div>

          {loading ? (
            <div className="text-sm text-muted-foreground py-8 text-center">Cargando…</div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="text-xs uppercase text-muted-foreground border-b">
                  <tr>
                    <th className="text-left py-2 px-2">Usuario</th>
                    <th className="text-left py-2 px-2">Módulo</th>
                    <th className="text-left py-2 px-2">Sección</th>
                    <th className="text-left py-2 px-2">Alcance</th>
                    <th className="text-center py-2 px-2 w-24">Puede ver</th>
                    <th className="text-center py-2 px-2 w-28">Puede editar</th>
                    <th className="text-center py-2 px-2 w-32">Puede eliminar</th>
                    <th className="text-right py-2 px-2 w-16"></th>
                  </tr>
                </thead>
                <tbody>
                  {permisos.map((p) => (
                    <tr key={p.id} className="border-b hover:bg-muted/30">
                      <td className="py-2 px-2">
                        <div className="font-medium text-navy">{p.user_name ?? "—"}</div>
                        <div className="text-xs text-muted-foreground">{p.user_email}</div>
                      </td>
                      <td className="py-2 px-2 text-muted-foreground">{moduloLabel(p.modulo)}</td>
                      <td className="py-2 px-2 text-xs text-muted-foreground">{seccionLabel(p.modulo, p.seccion)}</td>
                      <td className="py-2 px-2">
                        {p.alcance_tipo === "todas"
                          ? <Badge variant="outline" className="text-[10px]">Todas las áreas</Badge>
                          : <span className="text-xs">{p.alcance_area_nombre}</span>}
                      </td>
                      <td className="py-2 px-2 text-center">
                        {p.puede_ver
                          ? <Badge variant="outline" className="text-[10px] border-emerald-300 text-emerald-700">Sí</Badge>
                          : <span className="text-xs text-muted-foreground">—</span>}
                      </td>
                      <td className="py-2 px-2 text-center">
                        {p.puede_editar
                          ? <Badge variant="outline" className="text-[10px] border-amber-300 text-amber-700">Sí</Badge>
                          : <span className="text-xs text-muted-foreground">—</span>}
                      </td>
                      <td className="py-2 px-2 text-center">
                        {p.puede_eliminar
                          ? <Badge variant="outline" className="text-[10px] border-red-300 text-red-700">Sí</Badge>
                          : <span className="text-xs text-muted-foreground">—</span>}
                      </td>
                      <td className="py-2 px-2 text-right">
                        <Button
                          size="icon" variant="ghost" className="h-8 w-8 text-destructive hover:text-destructive"
                          title="Eliminar permiso" onClick={() => setDeletingId(p.id)}
                        >
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      </td>
                    </tr>
                  ))}
                  {permisos.length === 0 && (
                    <tr>
                      <td colSpan={8} className="py-8 text-center text-muted-foreground text-sm">
                        Sin permisos asignados para esta empresa.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          )}
        </>
      )}

      <AgregarPermisoDialog
        open={addOpen}
        euOpts={euOpts}
        areas={areas}
        onOpenChange={setAddOpen}
        onSubmit={async (row) => {
          const { data, error } = await (supabase as any)
            .from("permisos_usuario_modulo")
            .insert({ ...row, cliente_id: selectedClienteId })
            .select().single();
          if (error) {
            toast.error(error.code === "23505" ? "Este permiso ya existe para ese usuario y módulo" : "Error al guardar");
            return;
          }
          const eu = euOpts.find((e) => e.user_id === row.user_id);
          const an = row.alcance_area_id ? (areas.find((a) => a.id === row.alcance_area_id)?.nombre ?? "—") : null;
          setPermisos((prev) => [...prev, {
            ...data,
            user_email: eu?.email ?? "—",
            user_name:  eu?.name ?? null,
            alcance_area_nombre: an,
          }]);
          setAddOpen(false);
          toast.success("Permiso agregado");
        }}
      />

      <AlertDialog open={!!deletingId} onOpenChange={(o) => !o && setDeletingId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Eliminar permiso</AlertDialogTitle>
            <AlertDialogDescription>
              Esta acción revoca el acceso al módulo inmediatamente. ¿Confirmar?
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              onClick={eliminar}
            >
              Eliminar
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}

function AgregarPermisoDialog({ open, euOpts, areas, onOpenChange, onSubmit }: {
  open: boolean;
  euOpts: EmpresaUsuarioOpt[];
  areas: AreaOpt[];
  onOpenChange: (v: boolean) => void;
  onSubmit: (row: {
    user_id: string; modulo: string; seccion: string | null;
    alcance_tipo: "area" | "todas"; alcance_area_id: string | null;
    puede_ver: boolean; puede_editar: boolean; puede_eliminar: boolean;
  }) => Promise<void>;
}) {
  const [form, setForm] = useState({
    user_id: "", modulo: "manual_funciones", seccion: "cargos",
    alcance_tipo: "todas" as "area" | "todas", alcance_area_id: "",
    puede_ver: true, puede_editar: false, puede_eliminar: false,
  });
  const [saving, setSaving] = useState(false);

  const moduloEntry = MODULOS_PERMISO.find((m) => m.modulo === form.modulo);
  const tieneSecciones = (moduloEntry?.secciones.length ?? 0) > 0;

  useEffect(() => {
    if (open) setForm({
      user_id: "", modulo: "manual_funciones", seccion: "cargos",
      alcance_tipo: "todas", alcance_area_id: "",
      puede_ver: true, puede_editar: false, puede_eliminar: false,
    });
  }, [open]);

  const setPuedeVer      = (v: boolean) => setForm((f) => ({ ...f, puede_ver: v,       puede_editar: v ? f.puede_editar : false,    puede_eliminar: v ? f.puede_eliminar : false }));
  const setPuedeEditar   = (v: boolean) => setForm((f) => ({ ...f, puede_editar: v,    puede_ver: v ? true : f.puede_ver,            puede_eliminar: v ? f.puede_eliminar : false }));
  const setPuedeEliminar = (v: boolean) => setForm((f) => ({ ...f, puede_eliminar: v,  puede_editar: v ? true : f.puede_editar,      puede_ver: v ? true : f.puede_ver }));

  const canSubmit = !!form.user_id
    && (form.alcance_tipo === "todas" || !!form.alcance_area_id)
    && (!tieneSecciones || !!form.seccion);

  const submit = async () => {
    if (!canSubmit) return;
    setSaving(true);
    await onSubmit({
      user_id: form.user_id, modulo: form.modulo,
      seccion: tieneSecciones ? (form.seccion || null) : null,
      alcance_tipo: form.alcance_tipo,
      alcance_area_id: form.alcance_tipo === "area" ? form.alcance_area_id || null : null,
      puede_ver: form.puede_ver, puede_editar: form.puede_editar, puede_eliminar: form.puede_eliminar,
    });
    setSaving(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader><DialogTitle>Agregar permiso de módulo</DialogTitle></DialogHeader>
        <div className="space-y-4">
          <div>
            <Label className="text-xs">Usuario *</Label>
            <Select value={form.user_id} onValueChange={(v) => setForm((f) => ({ ...f, user_id: v }))}>
              <SelectTrigger><SelectValue placeholder="Selecciona un usuario…" /></SelectTrigger>
              <SelectContent>
                {euOpts.map((eu) => (
                  <SelectItem key={eu.user_id} value={eu.user_id}>
                    {eu.name ? `${eu.name} · ${eu.rol_empresa} (${eu.email})` : `${eu.email} · ${eu.rol_empresa}`}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div>
            <Label className="text-xs">Módulo *</Label>
            <Select
              value={form.modulo}
              onValueChange={(v) => {
                const entry = MODULOS_PERMISO.find((m) => m.modulo === v);
                setForm((f) => ({ ...f, modulo: v, seccion: entry?.secciones[0]?.value ?? "" }));
              }}
            >
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                {MODULOS_PERMISO.map((m) => <SelectItem key={m.modulo} value={m.modulo}>{m.moduloLabel}</SelectItem>)}
              </SelectContent>
            </Select>
          </div>

          {tieneSecciones && (
            <div>
              <Label className="text-xs">Sección *</Label>
              <Select value={form.seccion} onValueChange={(v) => setForm((f) => ({ ...f, seccion: v }))}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  {(moduloEntry?.secciones ?? []).map((s) => (
                    <SelectItem key={s.value} value={s.value}>{s.label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          )}

          <div className="space-y-2">
            <Label className="text-xs">Alcance *</Label>
            <div className="flex gap-4">
              {(["todas", "area"] as const).map((tipo) => (
                <label key={tipo} className="flex items-center gap-2 cursor-pointer text-sm">
                  <input
                    type="radio" checked={form.alcance_tipo === tipo}
                    onChange={() => setForm((f) => ({ ...f, alcance_tipo: tipo, alcance_area_id: "" }))}
                    className="accent-navy"
                  />
                  {tipo === "todas" ? "Todas las áreas" : "Área específica"}
                </label>
              ))}
            </div>
            {form.alcance_tipo === "area" && (
              <Select
                value={form.alcance_area_id || "__none__"}
                onValueChange={(v) => setForm((f) => ({ ...f, alcance_area_id: v === "__none__" ? "" : v }))}
              >
                <SelectTrigger><SelectValue placeholder="Selecciona un área…" /></SelectTrigger>
                <SelectContent>
                  {areas.length === 0
                    ? <SelectItem value="__none__" disabled>Sin áreas disponibles</SelectItem>
                    : areas.map((a) => <SelectItem key={a.id} value={a.id}>{a.nombre}</SelectItem>)}
                </SelectContent>
              </Select>
            )}
          </div>

          <div className="space-y-1">
            <Label className="text-xs">Capacidades</Label>
            <div className="rounded-lg border divide-y">
              {([
                { key: "puede_ver",      label: "Puede ver",      desc: "Lectura (implica ver)",                              val: form.puede_ver,      set: setPuedeVer      },
                { key: "puede_editar",   label: "Puede editar",   desc: "Crear y modificar (implica puede ver)",              val: form.puede_editar,   set: setPuedeEditar   },
                { key: "puede_eliminar", label: "Puede eliminar", desc: "Borrar registros (implica puede editar y puede ver)", val: form.puede_eliminar, set: setPuedeEliminar },
              ] as const).map((cap) => (
                <label key={cap.key} className="flex items-center justify-between px-3 py-2.5 cursor-pointer hover:bg-muted/30">
                  <div>
                    <div className="text-sm font-medium">{cap.label}</div>
                    <div className="text-xs text-muted-foreground">{cap.desc}</div>
                  </div>
                  <input
                    type="checkbox" checked={cap.val}
                    onChange={(e) => cap.set(e.target.checked)}
                    className="w-4 h-4 accent-navy"
                  />
                </label>
              ))}
            </div>
          </div>
        </div>
        <DialogFooter>
          <Button variant="ghost" onClick={() => onOpenChange(false)}>Cancelar</Button>
          <Button className="bg-gold hover:bg-gold/90 text-navy" disabled={saving || !canSubmit} onClick={submit}>
            {saving ? "Guardando…" : "Agregar permiso"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
