import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/lib/auth-context";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { toast } from "sonner";
import { Copy, Mail, MessageCircle, Link2, Plus, X, Send } from "lucide-react";
import {
  crearCompartido, buildWhatsAppLink, buildMailtoLink,
  type TipoContenidoCompartido, type Canal,
} from "@/lib/share-helpers";

interface Props {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  clienteId: string;
  tipoContenido: TipoContenidoCompartido;
  contenidoId?: string | null;
  tituloDefault: string;
  pdfBlob?: Blob;
}

interface Contacto { id: string; nombre: string; apellido: string; email: string | null; celular: string | null }
interface Consultor { id: string; name: string | null; email: string }

export function ShareDialog({ open, onOpenChange, clienteId, tipoContenido, contenidoId, tituloDefault, pdfBlob }: Props) {
  const { user } = useAuth();
  const [contactos, setContactos] = useState<Contacto[]>([]);
  const [consultores, setConsultores] = useState<Consultor[]>([]);
  const [selContactos, setSelContactos] = useState<Set<string>>(new Set());
  const [selConsultores, setSelConsultores] = useState<Set<string>>(new Set());
  const [emailManual, setEmailManual] = useState("");
  const [telManual, setTelManual] = useState("");
  const [manuales, setManuales] = useState<{ nombre: string; email?: string; telefono?: string }[]>([]);

  const [canales, setCanales] = useState<Set<Canal>>(new Set(["enlace"]));
  const [incluirPdf, setIncluirPdf] = useState(!!pdfBlob);
  const [incluirCompromisos, setIncluirCompromisos] = useState(true);
  const [incluirKpis, setIncluirKpis] = useState(true);
  const [crearCompromisoLectura, setCrearCompromisoLectura] = useState(true);
  const [expiraDias, setExpiraDias] = useState("30");

  const [titulo, setTitulo] = useState(tituloDefault);
  const [mensaje, setMensaje] = useState("");
  const [resultado, setResultado] = useState<{ shareUrl: string; pdfUrl?: string } | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!open) return;
    setResultado(null);
    setTitulo(tituloDefault);
    (async () => {
      const [{ data: c }, { data: prof }] = await Promise.all([
        supabase.from("cliente_contactos").select("id,nombre,apellido,email,celular").eq("cliente_id", clienteId).eq("activo", true),
        supabase.from("profiles").select("id,name,email").neq("id", user?.id ?? ""),
      ]);
      setContactos((c ?? []) as Contacto[]);
      setConsultores((prof ?? []) as Consultor[]);
    })();
  }, [open, clienteId, tituloDefault, user?.id]);

  const toggle = <T,>(set: Set<T>, val: T): Set<T> => {
    const next = new Set(set);
    if (next.has(val)) next.delete(val); else next.add(val);
    return next;
  };

  const addManual = () => {
    if (!emailManual && !telManual) { toast.error("Indica email o teléfono"); return; }
    setManuales([...manuales, { nombre: emailManual || telManual, email: emailManual || undefined, telefono: telManual || undefined }]);
    setEmailManual(""); setTelManual("");
  };

  const enviar = async () => {
    if (canales.size === 0) { toast.error("Selecciona al menos un canal"); return; }
    const dest = [
      ...contactos.filter((c) => selContactos.has(c.id)).map((c) => ({
        nombre: `${c.nombre} ${c.apellido}`, email: c.email ?? undefined, telefono: c.celular ?? undefined, tipo: "contacto" as const,
      })),
      ...consultores.filter((c) => selConsultores.has(c.id)).map((c) => ({
        nombre: c.name ?? c.email, email: c.email, tipo: "consultor" as const,
      })),
      ...manuales.map((m) => ({ ...m, tipo: "manual" as const })),
    ];
    if (dest.length === 0) { toast.error("Agrega al menos un destinatario"); return; }

    setLoading(true);
    try {
      const r = await crearCompartido({
        cliente_id: clienteId,
        tipo_contenido: tipoContenido,
        contenido_id: contenidoId,
        titulo,
        mensaje,
        destinatarios: dest,
        canales: Array.from(canales),
        expira_dias: parseInt(expiraDias) || 0,
        incluir_pdf: incluirPdf,
        incluir_kpis: incluirKpis,
        incluir_compromisos: incluirCompromisos,
        pdf_blob: incluirPdf ? pdfBlob : undefined,
        crear_compromiso_lectura: crearCompromisoLectura,
        consultor_id: user?.id,
      });
      setResultado({ shareUrl: r.shareUrl, pdfUrl: r.pdfUrl });
      toast.success("Contenido compartido. Usa los canales para enviarlo.");
    } catch (e) {
      toast.error("Error al compartir: " + (e as Error).message);
    } finally {
      setLoading(false);
    }
  };

  const copy = (txt: string) => { navigator.clipboard.writeText(txt); toast.success("Copiado"); };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[92vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2"><Send className="w-5 h-5 text-gold" /> Compartir con cliente / equipo</DialogTitle>
        </DialogHeader>

        {!resultado ? (
          <Tabs defaultValue="dest">
            <TabsList className="grid grid-cols-4 w-full">
              <TabsTrigger value="dest">1. Destinatarios</TabsTrigger>
              <TabsTrigger value="cont">2. Contenido</TabsTrigger>
              <TabsTrigger value="canal">3. Canales</TabsTrigger>
              <TabsTrigger value="msg">4. Mensaje</TabsTrigger>
            </TabsList>

            <TabsContent value="dest" className="space-y-3 pt-3">
              <div>
                <Label className="text-xs uppercase text-gold">Contactos del cliente</Label>
                {contactos.length === 0 ? <p className="text-sm text-muted-foreground">Sin contactos registrados.</p> : (
                  <div className="space-y-1 mt-1">
                    {contactos.map((c) => (
                      <label key={c.id} className="flex items-center gap-2 p-2 hover:bg-cream rounded cursor-pointer">
                        <Checkbox checked={selContactos.has(c.id)} onCheckedChange={() => setSelContactos(toggle(selContactos, c.id))} />
                        <span className="text-sm">{c.nombre} {c.apellido}</span>
                        {c.email && <Badge variant="outline" className="text-[10px]">{c.email}</Badge>}
                        {c.celular && <Badge variant="outline" className="text-[10px]">{c.celular}</Badge>}
                      </label>
                    ))}
                  </div>
                )}
              </div>
              <div>
                <Label className="text-xs uppercase text-gold">Otros consultores</Label>
                {consultores.length === 0 ? <p className="text-sm text-muted-foreground">Sin más usuarios en la plataforma.</p> : (
                  <div className="space-y-1 mt-1 max-h-32 overflow-y-auto">
                    {consultores.map((c) => (
                      <label key={c.id} className="flex items-center gap-2 p-2 hover:bg-cream rounded cursor-pointer">
                        <Checkbox checked={selConsultores.has(c.id)} onCheckedChange={() => setSelConsultores(toggle(selConsultores, c.id))} />
                        <span className="text-sm">{c.name ?? c.email}</span>
                      </label>
                    ))}
                  </div>
                )}
              </div>
              <div>
                <Label className="text-xs uppercase text-gold">Agregar email/teléfono manual</Label>
                <div className="flex gap-2 mt-1">
                  <Input placeholder="email@ejemplo.com" value={emailManual} onChange={(e) => setEmailManual(e.target.value)} />
                  <Input placeholder="+57 300 123 4567" value={telManual} onChange={(e) => setTelManual(e.target.value)} />
                  <Button variant="outline" size="sm" onClick={addManual}><Plus className="w-3 h-3" /></Button>
                </div>
                {manuales.length > 0 && (
                  <div className="flex flex-wrap gap-1 mt-2">
                    {manuales.map((m, i) => (
                      <Badge key={i} variant="secondary" className="gap-1">
                        {m.email ?? m.telefono}
                        <button onClick={() => setManuales(manuales.filter((_, j) => j !== i))}><X className="w-3 h-3" /></button>
                      </Badge>
                    ))}
                  </div>
                )}
              </div>
            </TabsContent>

            <TabsContent value="cont" className="space-y-3 pt-3">
              <div><Label>Título</Label><Input value={titulo} onChange={(e) => setTitulo(e.target.value)} /></div>
              <div className="space-y-2">
                {pdfBlob && (
                  <label className="flex items-center gap-2"><Checkbox checked={incluirPdf} onCheckedChange={(v) => setIncluirPdf(!!v)} /> Adjuntar PDF profesional</label>
                )}
                <label className="flex items-center gap-2"><Checkbox checked={incluirKpis} onCheckedChange={(v) => setIncluirKpis(!!v)} /> Incluir KPIs en la vista</label>
                <label className="flex items-center gap-2"><Checkbox checked={incluirCompromisos} onCheckedChange={(v) => setIncluirCompromisos(!!v)} /> Incluir compromisos asociados</label>
              </div>
              <div>
                <Label>Validez del enlace</Label>
                <Select value={expiraDias} onValueChange={setExpiraDias}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="7">7 días</SelectItem>
                    <SelectItem value="30">30 días</SelectItem>
                    <SelectItem value="90">90 días</SelectItem>
                    <SelectItem value="0">Sin expiración</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <label className="flex items-center gap-2 p-2 bg-cream rounded">
                <Checkbox checked={crearCompromisoLectura} onCheckedChange={(v) => setCrearCompromisoLectura(!!v)} />
                <span className="text-sm">Crear compromiso "Confirmar lectura" (vence en 48h)</span>
              </label>
            </TabsContent>

            <TabsContent value="canal" className="space-y-3 pt-3">
              <p className="text-xs text-muted-foreground">Selecciona uno o varios canales. El enlace público funciona siempre; los demás abren la app correspondiente.</p>
              <div className="grid grid-cols-3 gap-2">
                {([
                  { c: "enlace", label: "Enlace", icon: Link2, desc: "Genera URL pública" },
                  { c: "email", label: "Email", icon: Mail, desc: "Abre cliente de correo" },
                  { c: "whatsapp", label: "WhatsApp", icon: MessageCircle, desc: "Abre wa.me con texto" },
                ] as const).map(({ c, label, icon: Icon, desc }) => (
                  <button key={c} onClick={() => setCanales(toggle(canales, c))}
                    className={`p-3 rounded border-2 text-left transition ${canales.has(c) ? "border-gold bg-cream" : "border-muted hover:border-gold/40"}`}>
                    <Icon className="w-5 h-5 text-navy mb-1" />
                    <div className="font-semibold text-sm text-navy">{label}</div>
                    <div className="text-xs text-muted-foreground">{desc}</div>
                  </button>
                ))}
              </div>
              {canales.has("email") && (
                <p className="text-xs text-amber-700 bg-amber-50 p-2 rounded">⚠️ Envío automático por correo requiere configurar dominio (próximamente). Por ahora abre tu cliente de correo con el mensaje pre-armado.</p>
              )}
            </TabsContent>

            <TabsContent value="msg" className="space-y-3 pt-3">
              <div><Label>Mensaje personal (opcional)</Label>
                <Textarea rows={6} value={mensaje} onChange={(e) => setMensaje(e.target.value)}
                  placeholder="Hola, te comparto el reporte de nuestra última sesión. Quedo atento a tus comentarios." />
              </div>
            </TabsContent>
          </Tabs>
        ) : (
          <div className="space-y-4 pt-3">
            <div className="bg-cream p-3 rounded">
              <Label className="text-xs uppercase text-gold">Enlace público</Label>
              <div className="flex gap-2 mt-1">
                <Input value={resultado.shareUrl} readOnly />
                <Button variant="outline" size="sm" onClick={() => copy(resultado.shareUrl)}><Copy className="w-3 h-3" /></Button>
              </div>
            </div>
            {resultado.pdfUrl && (
              <div className="bg-cream p-3 rounded">
                <Label className="text-xs uppercase text-gold">Link directo al PDF</Label>
                <div className="flex gap-2 mt-1">
                  <Input value={resultado.pdfUrl} readOnly />
                  <Button variant="outline" size="sm" onClick={() => copy(resultado.pdfUrl!)}><Copy className="w-3 h-3" /></Button>
                </div>
              </div>
            )}
            <div className="grid grid-cols-2 gap-2">
              {canales.has("email") && (() => {
                const emails = [
                  ...contactos.filter((c) => selContactos.has(c.id)).map((c) => c.email).filter(Boolean) as string[],
                  ...consultores.filter((c) => selConsultores.has(c.id)).map((c) => c.email),
                  ...manuales.map((m) => m.email).filter(Boolean) as string[],
                ];
                const cuerpo = `${mensaje || "Te comparto este contenido."}\n\nVer aquí: ${resultado.shareUrl}${resultado.pdfUrl ? `\nDescargar PDF: ${resultado.pdfUrl}` : ""}`;
                return <Button variant="outline" asChild><a href={buildMailtoLink(emails.join(","), titulo, cuerpo)}><Mail className="w-4 h-4 mr-2" /> Abrir email</a></Button>;
              })()}
              {canales.has("whatsapp") && (() => {
                const tels = [
                  ...contactos.filter((c) => selContactos.has(c.id)).map((c) => c.celular).filter(Boolean) as string[],
                  ...manuales.map((m) => m.telefono).filter(Boolean) as string[],
                ];
                const txt = `${mensaje || "Te comparto este contenido."} ${resultado.shareUrl}`;
                return <Button variant="outline" asChild><a href={tels[0] ? buildWhatsAppLink(tels[0], txt) : `https://wa.me/?text=${encodeURIComponent(txt)}`} target="_blank" rel="noreferrer"><MessageCircle className="w-4 h-4 mr-2" /> Abrir WhatsApp</a></Button>;
              })()}
            </div>
            <p className="text-xs text-muted-foreground text-center">Se registró una actividad en el timeline y {crearCompromisoLectura ? "un compromiso de lectura (48h)." : "no se creó compromiso."}</p>
          </div>
        )}

        <DialogFooter>
          {!resultado ? (
            <>
              <Button variant="outline" onClick={() => onOpenChange(false)}>Cancelar</Button>
              <Button onClick={enviar} disabled={loading} className="bg-gold text-navy hover:bg-gold/90">
                <Send className="w-4 h-4 mr-2" /> {loading ? "Generando…" : "Generar enlace y registrar"}
              </Button>
            </>
          ) : (
            <Button onClick={() => onOpenChange(false)} className="bg-navy text-white hover:bg-navy/90">Cerrar</Button>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
