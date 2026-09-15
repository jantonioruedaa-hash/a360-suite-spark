import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";

export interface CotizacionPDFData {
  numero: string;
  titulo: string;
  descripcion?: string | null;
  plan?: string | null;
  nivelAcompanamiento?: string | null;
  planPlataformaNombre?: string | null;
  fechaEmision?: string | null;
  fechaVencimiento?: string | null;
  validezDias?: number;
  moneda: string;
  servicios: Array<{ nombre: string; cantidad: number; precio: number }>;
  subtotal: number;
  descuentoPorcentaje: number;
  descuentoValor: number;
  total: number;
  notas?: string | null;
  condiciones?: string | null;
  imeEstimado?: string | null;
  justificacion?: string | null;
  cliente: {
    empresa: string;
    nombreComercial?: string | null;
    contacto?: string | null;
    email?: string | null;
    direccion?: string | null;
    ciudad?: string | null;
    pais?: string | null;
  };
  consultor?: { nombre?: string | null; email?: string | null };
}

const NAVY: [number, number, number] = [16, 32, 64];
const GOLD: [number, number, number] = [191, 156, 78];
const MUTED: [number, number, number] = [110, 110, 120];

export function generarCotizacionPDF(data: CotizacionPDFData): jsPDF {
  const doc = new jsPDF({ unit: "pt", format: "a4" });
  const pageW = doc.internal.pageSize.getWidth();

  // Header band
  doc.setFillColor(...NAVY);
  doc.rect(0, 0, pageW, 90, "F");
  doc.setFillColor(...GOLD);
  doc.rect(0, 90, pageW, 3, "F");

  doc.setTextColor(255);
  doc.setFont("helvetica", "bold");
  doc.setFontSize(22);
  doc.text("A360SGP", 40, 42);
  doc.setFont("helvetica", "normal");
  doc.setFontSize(9);
  doc.setTextColor(...GOLD);
  doc.text("STRATEGIC GROWTH PARTNERS", 40, 58);

  doc.setTextColor(255);
  doc.setFont("helvetica", "bold");
  doc.setFontSize(16);
  doc.text("COTIZACIÓN", pageW - 40, 42, { align: "right" });
  doc.setFont("helvetica", "normal");
  doc.setFontSize(11);
  doc.text(data.numero, pageW - 40, 60, { align: "right" });

  let y = 120;

  // Cliente / Cotización
  doc.setTextColor(...NAVY);
  doc.setFont("helvetica", "bold");
  doc.setFontSize(10);
  doc.text("CLIENTE", 40, y);
  doc.text("DETALLES", pageW / 2 + 20, y);

  doc.setFont("helvetica", "normal");
  doc.setFontSize(10);
  doc.setTextColor(40);
  let yi = y + 16;
  doc.setFont("helvetica", "bold");
  doc.text(data.cliente.empresa, 40, yi);
  doc.setFont("helvetica", "normal");
  yi += 14;
  if (data.cliente.contacto) { doc.text(data.cliente.contacto, 40, yi); yi += 12; }
  if (data.cliente.email) { doc.text(data.cliente.email, 40, yi); yi += 12; }
  const ubic = [data.cliente.direccion, data.cliente.ciudad, data.cliente.pais].filter(Boolean).join(", ");
  if (ubic) { doc.text(ubic, 40, yi); yi += 12; }

  let yd = y + 16;
  const detalles = [
    ["Fecha emisión", data.fechaEmision ?? "—"],
    ["Vencimiento", data.fechaVencimiento ?? "—"],
    ["Validez", `${data.validezDias ?? 30} días`],
    ["Plan", data.plan ?? "—"],
    ...(data.nivelAcompanamiento ? [["Nivel", data.nivelAcompanamiento]] : []),
    ...(data.planPlataformaNombre ? [["Plataforma", data.planPlataformaNombre]] : []),
  ];
  detalles.forEach(([k, v]) => {
    doc.setTextColor(...MUTED);
    doc.text(k, pageW / 2 + 20, yd);
    doc.setTextColor(40);
    doc.text(String(v), pageW - 40, yd, { align: "right" });
    yd += 14;
  });

  y = Math.max(yi, yd) + 16;

  // Título
  doc.setFillColor(248, 244, 232);
  doc.rect(40, y, pageW - 80, 28, "F");
  doc.setTextColor(...NAVY);
  doc.setFont("helvetica", "bold");
  doc.setFontSize(12);
  doc.text(data.titulo, 50, y + 18);
  y += 40;

  if (data.descripcion) {
    doc.setFont("helvetica", "normal");
    doc.setFontSize(10);
    doc.setTextColor(60);
    const lines = doc.splitTextToSize(data.descripcion, pageW - 80);
    doc.text(lines, 40, y);
    y += lines.length * 12 + 8;
  }

  // Tabla servicios
  autoTable(doc, {
    startY: y,
    head: [["#", "Servicio", "Cant.", `Precio (${data.moneda})`, `Total (${data.moneda})`]],
    body: data.servicios.map((s, i) => [
      String(i + 1),
      s.nombre,
      String(s.cantidad),
      s.precio.toFixed(2),
      (s.cantidad * s.precio).toFixed(2),
    ]),
    headStyles: { fillColor: NAVY, textColor: 255, fontSize: 10, fontStyle: "bold" },
    bodyStyles: { fontSize: 10, textColor: 40 },
    alternateRowStyles: { fillColor: [250, 248, 240] },
    columnStyles: {
      0: { cellWidth: 30, halign: "center" },
      2: { cellWidth: 50, halign: "center" },
      3: { cellWidth: 90, halign: "right" },
      4: { cellWidth: 90, halign: "right" },
    },
    margin: { left: 40, right: 40 },
  });

  y = (doc as unknown as { lastAutoTable: { finalY: number } }).lastAutoTable.finalY + 16;

  // Totales
  const totX = pageW - 220;
  const valX = pageW - 40;
  const fmt = (n: number) => `${data.moneda} ${n.toFixed(2)}`;
  const rows: Array<[string, string, boolean]> = [
    ["Subtotal", fmt(data.subtotal), false],
  ];
  if (data.descuentoPorcentaje > 0 || data.descuentoValor > 0) {
    rows.push([
      `Descuento${data.descuentoPorcentaje ? ` (${data.descuentoPorcentaje}%)` : ""}`,
      `- ${fmt(data.descuentoValor)}`,
      false,
    ]);
  }
  rows.push(["TOTAL", fmt(data.total), true]);

  rows.forEach(([k, v, bold]) => {
    if (bold) {
      doc.setFillColor(...NAVY);
      doc.rect(totX - 10, y - 12, 220, 22, "F");
      doc.setTextColor(255);
      doc.setFont("helvetica", "bold");
      doc.setFontSize(12);
    } else {
      doc.setTextColor(40);
      doc.setFont("helvetica", "normal");
      doc.setFontSize(10);
    }
    doc.text(k, totX, y);
    doc.text(v, valX, y, { align: "right" });
    y += bold ? 24 : 16;
  });

  y += 10;

  // IME — Impacto Monetario Esperado
  if (data.imeEstimado) {
    doc.setFillColor(248, 244, 232);
    doc.rect(40, y, pageW - 80, 50, "F");
    doc.setFillColor(...GOLD);
    doc.rect(40, y, 4, 50, "F");
    doc.setTextColor(...NAVY);
    doc.setFont("helvetica", "bold");
    doc.setFontSize(10);
    doc.text("IMPACTO MONETARIO ESPERADO (IME)", 54, y + 16);
    doc.setFont("helvetica", "normal");
    doc.setFontSize(10);
    doc.setTextColor(40);
    const lines = doc.splitTextToSize(data.imeEstimado, pageW - 110);
    doc.text(lines, 54, y + 32);
    y += 60;
  }

  // Justificación de la inversión
  if (data.justificacion) {
    doc.setTextColor(...NAVY);
    doc.setFont("helvetica", "bold");
    doc.setFontSize(10);
    doc.text("JUSTIFICACIÓN DE LA INVERSIÓN", 40, y);
    y += 14;
    doc.setFont("helvetica", "normal");
    doc.setTextColor(60);
    const lines = doc.splitTextToSize(data.justificacion, pageW - 80);
    doc.text(lines, 40, y);
    y += lines.length * 12 + 10;
  }

  // Condiciones / notas
  if (data.condiciones) {
    doc.setTextColor(...NAVY);
    doc.setFont("helvetica", "bold");
    doc.setFontSize(10);
    doc.text("CONDICIONES", 40, y);
    y += 14;
    doc.setFont("helvetica", "normal");
    doc.setTextColor(60);
    const lines = doc.splitTextToSize(data.condiciones, pageW - 80);
    doc.text(lines, 40, y);
    y += lines.length * 12 + 8;
  }
  if (data.notas) {
    doc.setTextColor(...NAVY);
    doc.setFont("helvetica", "bold");
    doc.setFontSize(10);
    doc.text("NOTAS", 40, y);
    y += 14;
    doc.setFont("helvetica", "normal");
    doc.setTextColor(60);
    const lines = doc.splitTextToSize(data.notas, pageW - 80);
    doc.text(lines, 40, y);
    y += lines.length * 12;
  }

  // Footer
  const footerY = doc.internal.pageSize.getHeight() - 40;
  doc.setFillColor(...GOLD);
  doc.rect(0, footerY - 4, pageW, 2, "F");
  doc.setTextColor(...MUTED);
  doc.setFontSize(8);
  doc.text("A360SGP · Strategic Growth Partners", 40, footerY + 8);
  if (data.consultor?.nombre) {
    doc.text(`Consultor: ${data.consultor.nombre}${data.consultor.email ? " · " + data.consultor.email : ""}`,
      pageW - 40, footerY + 8, { align: "right" });
  }

  return doc;
}

export const PLANES_PRESET: Record<string, { label: string; servicios: Array<{ nombre: string; cantidad: number; precio: number }> }> = {
  diagnostico: {
    label: "Diagnóstico",
    servicios: [
      { nombre: "Diagnóstico SIDE completo (4 dimensiones)", cantidad: 1, precio: 1500 },
      { nombre: "Sesión de devolución de resultados (2h)", cantidad: 1, precio: 500 },
    ],
  },
  estrategico: {
    label: "Plan Estratégico",
    servicios: [
      { nombre: "Diagnóstico SIDE", cantidad: 1, precio: 1500 },
      { nombre: "Plan Estratégico (18 secciones)", cantidad: 1, precio: 4500 },
      { nombre: "Implementación inicial (3 meses)", cantidad: 1, precio: 2000 },
    ],
  },
  transformacion: {
    label: "Programa de Transformación",
    servicios: [
      { nombre: "Diagnóstico SIDE", cantidad: 1, precio: 1500 },
      { nombre: "Plan Estratégico completo", cantidad: 1, precio: 4500 },
      { nombre: "Coaching ejecutivo (12 herramientas)", cantidad: 1, precio: 6000 },
      { nombre: "Acompañamiento 12 meses", cantidad: 1, precio: 3500 },
    ],
  },
  coaching_ejecutivo: {
    label: "Coaching Ejecutivo",
    servicios: [
      { nombre: "Programa de coaching (12 herramientas)", cantidad: 1, precio: 6000 },
      { nombre: "Sesiones individuales (12)", cantidad: 12, precio: 250 },
    ],
  },
  programa_integral: {
    label: "Programa Integral",
    servicios: [
      { nombre: "Diagnóstico SIDE", cantidad: 1, precio: 1500 },
      { nombre: "Plan Estratégico", cantidad: 1, precio: 4500 },
      { nombre: "Coaching Ejecutivo", cantidad: 1, precio: 6000 },
      { nombre: "Programa LEE (10 capítulos)", cantidad: 1, precio: 4000 },
    ],
  },
  corporativo: {
    label: "Corporativo",
    servicios: [
      { nombre: "Programa Integral A360", cantidad: 1, precio: 16000 },
      { nombre: "Customización corporativa", cantidad: 1, precio: 5000 },
      { nombre: "Acompañamiento ejecutivo 24 meses", cantidad: 1, precio: 8000 },
    ],
  },
};
