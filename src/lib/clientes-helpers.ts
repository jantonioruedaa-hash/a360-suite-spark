export const ESTADOS = [
  { value: "prospecto", label: "Prospecto", color: "bg-blue-100 text-blue-800 border-blue-200" },
  { value: "activo", label: "Activo", color: "bg-emerald-100 text-emerald-800 border-emerald-200" },
  { value: "en_pausa", label: "En pausa", color: "bg-amber-100 text-amber-800 border-amber-200" },
  { value: "completado", label: "Completado", color: "bg-purple-100 text-purple-800 border-purple-200" },
  { value: "inactivo", label: "Inactivo", color: "bg-gray-100 text-gray-700 border-gray-200" },
] as const;

export const PLANES_LICENCIA = ["esencial", "avanzado", "corporativo"] as const;

export const ORIGENES = ["referido", "prospección", "evento", "inbound", "alianza"] as const;

export const TAMANOS = [
  { value: "micro", label: "Micro (1-10)" },
  { value: "pequena", label: "Pequeña (11-50)" },
  { value: "mediana", label: "Mediana (51-250)" },
  { value: "grande", label: "Grande (250+)" },
] as const;

export const AREAS_CONTACTO = [
  "Gerencia", "Finanzas", "RRHH", "Comercial", "Operaciones",
  "Marketing", "TI", "Legal", "Otro",
] as const;

export const TIPOS_ACTIVIDAD = [
  { value: "llamada", label: "Llamada", icon: "Phone" },
  { value: "reunion", label: "Reunión", icon: "Users" },
  { value: "email", label: "Email", icon: "Mail" },
  { value: "propuesta", label: "Propuesta", icon: "FileText" },
  { value: "contrato", label: "Contrato", icon: "FileSignature" },
  { value: "pago", label: "Pago", icon: "DollarSign" },
  { value: "nota", label: "Nota", icon: "StickyNote" },
  { value: "seguimiento", label: "Seguimiento", icon: "Bell" },
  { value: "diagnostico", label: "Diagnóstico", icon: "Activity" },
  { value: "sesion_coaching", label: "Sesión coaching", icon: "Users2" },
  { value: "sesion_lee", label: "Sesión LEE", icon: "BookOpen" },
  { value: "entrega", label: "Entrega", icon: "Package" },
  { value: "otro", label: "Otro", icon: "Circle" },
] as const;

export const ESTADOS_COTIZACION = [
  { value: "borrador", label: "Borrador", color: "bg-gray-100 text-gray-700 border-gray-200" },
  { value: "enviada", label: "Enviada", color: "bg-blue-100 text-blue-800 border-blue-200" },
  { value: "en_negociacion", label: "En negociación", color: "bg-orange-100 text-orange-800 border-orange-200" },
  { value: "aprobada", label: "Aprobada", color: "bg-emerald-100 text-emerald-800 border-emerald-200" },
  { value: "rechazada", label: "Rechazada", color: "bg-red-100 text-red-800 border-red-200" },
  { value: "vencida", label: "Vencida", color: "bg-yellow-100 text-yellow-800 border-yellow-200" },
] as const;

export function getInitials(nombre?: string | null, apellido?: string | null) {
  const n = (nombre ?? "").trim();
  const a = (apellido ?? "").trim();
  return ((n[0] ?? "") + (a[0] ?? "")).toUpperCase() || "??";
}

export function imeColor(ime: number | null | undefined) {
  if (ime == null) return "text-muted-foreground";
  if (ime < 40) return "text-red-600";
  if (ime < 60) return "text-amber-600";
  if (ime < 80) return "text-blue-600";
  return "text-emerald-600";
}

export function imeLabel(ime: number | null | undefined) {
  if (ime == null) return "—";
  if (ime < 40) return "Crítico";
  if (ime < 60) return "Débil";
  if (ime < 80) return "En desarrollo";
  return "Sólido";
}
