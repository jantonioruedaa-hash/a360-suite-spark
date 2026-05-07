import { supabase } from "@/integrations/supabase/client";

export type TipoContenidoCompartido =
  | "actividad" | "reporte_sesion" | "cotizacion" | "compromisos" | "onboarding" | "side" | "plan";

export type Canal = "enlace" | "email" | "whatsapp";

export interface CompartirInput {
  cliente_id: string;
  tipo_contenido: TipoContenidoCompartido;
  contenido_id?: string | null;
  contenido_ids?: string[];
  titulo: string;
  mensaje?: string;
  destinatarios: { nombre: string; email?: string; telefono?: string; tipo: "contacto" | "consultor" | "manual" }[];
  canales: Canal[];
  expira_dias?: number; // null/0 = sin expiración
  incluir_pdf?: boolean;
  incluir_kpis?: boolean;
  incluir_compromisos?: boolean;
  pdf_blob?: Blob;
  crear_compromiso_lectura?: boolean;
  consultor_id?: string | null;
}

const generateToken = () =>
  `${crypto.randomUUID().replace(/-/g, "")}${Date.now().toString(36)}`;

export async function crearCompartido(input: CompartirInput): Promise<{ id: string; token: string; pdfUrl?: string; shareUrl: string }> {
  const token = generateToken();
  const expira_en = input.expira_dias && input.expira_dias > 0
    ? new Date(Date.now() + input.expira_dias * 86400 * 1000).toISOString()
    : null;

  // 1) subir PDF si viene
  let pdf_url: string | null = null;
  if (input.pdf_blob) {
    const path = `${input.cliente_id}/${token}.pdf`;
    const { error: upErr } = await supabase.storage
      .from("reportes-compartidos")
      .upload(path, input.pdf_blob, { contentType: "application/pdf", upsert: true });
    if (upErr) throw upErr;
    // URL firmada larga (mismo plazo que el token o 30 días por defecto)
    const seconds = input.expira_dias && input.expira_dias > 0 ? input.expira_dias * 86400 : 60 * 60 * 24 * 30;
    const { data: signed } = await supabase.storage
      .from("reportes-compartidos")
      .createSignedUrl(path, Math.min(seconds, 60 * 60 * 24 * 365));
    pdf_url = signed?.signedUrl ?? null;
  }

  // 2) registrar
  const { data, error } = await supabase
    .from("cliente_compartidos")
    .insert({
      cliente_id: input.cliente_id,
      consultor_id: input.consultor_id ?? null,
      tipo_contenido: input.tipo_contenido,
      contenido_id: input.contenido_id ?? null,
      contenido_ids: input.contenido_ids ?? [],
      titulo: input.titulo,
      mensaje: input.mensaje ?? null,
      destinatarios: input.destinatarios,
      canales: input.canales,
      incluir_pdf: input.incluir_pdf ?? !!input.pdf_blob,
      incluir_kpis: input.incluir_kpis ?? false,
      incluir_compromisos: input.incluir_compromisos ?? false,
      pdf_url,
      share_token: token,
      expira_en,
      estado: "enviado",
      crear_compromiso_lectura: input.crear_compromiso_lectura ?? false,
    })
    .select("id")
    .single();
  if (error) throw error;

  // 3) compromiso de lectura (48h)
  if (input.crear_compromiso_lectura) {
    const fechaLim = new Date(Date.now() + 48 * 3600 * 1000).toISOString().slice(0, 10);
    const nombres = input.destinatarios.map((d) => d.nombre).join(", ") || "destinatarios";
    const { data: comp } = await supabase
      .from("cliente_compromisos")
      .insert({
        cliente_id: input.cliente_id,
        descripcion: `Confirmar lectura de "${input.titulo}" — enviado a ${nombres}`,
        responsable: nombres,
        fecha_limite: fechaLim,
        origen: "compartido",
        estado: "pendiente",
      })
      .select("id")
      .single();
    if (comp?.id) {
      await supabase.from("cliente_compartidos").update({ compromiso_id: comp.id }).eq("id", data!.id);
    }
  }

  // 4) actividad de timeline
  await supabase.from("cliente_actividades").insert({
    cliente_id: input.cliente_id,
    consultor_id: input.consultor_id ?? null,
    tipo: "compartido",
    titulo: `📤 Compartido: ${input.titulo}`,
    descripcion: `Canales: ${input.canales.join(", ")} · Destinatarios: ${input.destinatarios.map((d) => d.nombre).join(", ")}`,
    fecha: new Date().toISOString(),
  });

  const shareUrl = `${window.location.origin}/share/${token}`;
  return { id: data!.id, token, pdfUrl: pdf_url ?? undefined, shareUrl };
}

export function buildWhatsAppLink(telefono: string, mensaje: string): string {
  const tel = telefono.replace(/[^\d]/g, "");
  return `https://wa.me/${tel}?text=${encodeURIComponent(mensaje)}`;
}

export function buildMailtoLink(email: string, asunto: string, cuerpo: string): string {
  return `mailto:${email}?subject=${encodeURIComponent(asunto)}&body=${encodeURIComponent(cuerpo)}`;
}
