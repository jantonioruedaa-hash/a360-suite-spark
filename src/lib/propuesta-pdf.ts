import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";

const NAVY: [number, number, number] = [16, 32, 64];
const GOLD: [number, number, number] = [191, 156, 78];
const MUTED: [number, number, number] = [110, 110, 120];

export interface PropuestaPDFData {
  numero: string;
  titulo: string;
  fechaEmision?: string | null;
  fechaVencimiento?: string | null;
  validezDias?: number;
  moneda: string;
  plan?: string | null;
  planLabel?: string | null;
  nivelAcompanamiento?: string | null;
  planPlataformaNombre?: string | null;
  // Cliente
  cliente: {
    empresa: string;
    nombreComercial?: string | null;
    sector?: string | null;
    contacto?: string | null;
    email?: string | null;
    telefono?: string | null;
    direccion?: string | null;
    ciudad?: string | null;
    pais?: string | null;
  };
  // Diagnóstico (resumen + datos del SIDE / Onboarding si existen)
  diagnosticoResumen?: string | null;
  scoresSide?: { idf?: number | null; cof?: number | null; ivee?: number | null; ime?: number | null } | null;
  retosClave?: string[];
  // Programa
  objetivos?: string[];
  entregables?: Array<{ titulo: string; descripcion: string }>;
  justificacion?: string | null;
  // Inversión
  servicios: Array<{ nombre: string; cantidad: number; precio: number }>;
  subtotal: number;
  descuentoPorcentaje: number;
  descuentoValor: number;
  total: number;
  imeEstimado?: string | null;
  condiciones?: string | null;
  notas?: string | null;
  consultor?: { nombre?: string | null; email?: string | null };
}

const head = (doc: jsPDF, subtitulo: string) => {
  const w = doc.internal.pageSize.getWidth();
  doc.setFillColor(...NAVY); doc.rect(0, 0, w, 90, "F");
  doc.setFillColor(...GOLD); doc.rect(0, 90, w, 3, "F");
  doc.setTextColor(255); doc.setFont("helvetica", "bold"); doc.setFontSize(22);
  doc.text("A360SGP", 40, 42);
  doc.setFont("helvetica", "normal"); doc.setFontSize(9); doc.setTextColor(...GOLD);
  doc.text("STRATEGIC GROWTH PARTNERS", 40, 58);
  doc.setTextColor(255); doc.setFont("helvetica", "bold"); doc.setFontSize(14);
  doc.text("PROPUESTA COMERCIAL", w - 40, 42, { align: "right" });
  doc.setFont("helvetica", "normal"); doc.setFontSize(9);
  doc.text(subtitulo, w - 40, 58, { align: "right" });
};

const sectionTitle = (doc: jsPDF, y: number, txt: string) => {
  const w = doc.internal.pageSize.getWidth();
  doc.setFillColor(248, 244, 232); doc.rect(40, y, w - 80, 26, "F");
  doc.setFillColor(...GOLD); doc.rect(40, y, 4, 26, "F");
  doc.setTextColor(...NAVY); doc.setFont("helvetica", "bold"); doc.setFontSize(12);
  doc.text(txt, 54, y + 17);
  return y + 36;
};

const para = (doc: jsPDF, y: number, txt: string, size = 10, color: [number, number, number] = [40, 40, 40]) => {
  doc.setFont("helvetica", "normal"); doc.setFontSize(size); doc.setTextColor(...color);
  const lines = doc.splitTextToSize(txt, doc.internal.pageSize.getWidth() - 80);
  doc.text(lines, 40, y);
  return y + lines.length * (size + 2);
};

const checkPage = (doc: jsPDF, y: number, sub: string) => {
  if (y > doc.internal.pageSize.getHeight() - 90) { doc.addPage(); head(doc, sub); return 120; }
  return y;
};

export function generarPropuestaComercialPDF(d: PropuestaPDFData): jsPDF {
  const doc = new jsPDF({ unit: "pt", format: "a4" });
  const sub = `${d.numero} · ${d.cliente.empresa}`;
  head(doc, sub);
  let y = 120;

  // Portada
  doc.setTextColor(...NAVY); doc.setFont("helvetica", "bold"); doc.setFontSize(20);
  const tituloLines = doc.splitTextToSize(d.titulo, doc.internal.pageSize.getWidth() - 80);
  doc.text(tituloLines, 40, y); y += tituloLines.length * 22 + 6;
  if (d.planLabel) {
    doc.setFont("helvetica", "normal"); doc.setFontSize(11); doc.setTextColor(...GOLD);
    doc.text(d.planLabel.toUpperCase(), 40, y); y += 18;
  }
  if (d.nivelAcompanamiento || d.planPlataformaNombre) {
    const extras = [d.nivelAcompanamiento, d.planPlataformaNombre].filter(Boolean).join(" · ");
    doc.setFont("helvetica", "normal"); doc.setFontSize(10); doc.setTextColor(...MUTED);
    doc.text(extras, 40, y); y += 14;
  }
  doc.setTextColor(...MUTED); doc.setFontSize(10);
  const meta = [
    d.fechaEmision ? `Emisión: ${d.fechaEmision}` : null,
    d.fechaVencimiento ? `Validez: ${d.fechaVencimiento}` : null,
  ].filter(Boolean).join("  ·  ");
  if (meta) { doc.text(meta, 40, y); y += 16; }
  y += 8;

  // Cliente
  y = sectionTitle(doc, y, "1. PRESENTADO A");
  doc.setTextColor(...NAVY); doc.setFont("helvetica", "bold"); doc.setFontSize(13);
  doc.text(d.cliente.empresa, 40, y); y += 16;
  doc.setFont("helvetica", "normal"); doc.setFontSize(10); doc.setTextColor(60);
  const sub2 = [d.cliente.nombreComercial, d.cliente.sector].filter(Boolean).join(" · ");
  if (sub2) { doc.text(sub2, 40, y); y += 13; }
  if (d.cliente.contacto) { doc.text(`Contacto: ${d.cliente.contacto}${d.cliente.email ? " · " + d.cliente.email : ""}`, 40, y); y += 13; }
  const ubic = [d.cliente.direccion, d.cliente.ciudad, d.cliente.pais].filter(Boolean).join(", ");
  if (ubic) { doc.text(ubic, 40, y); y += 13; }
  y += 10;

  // Diagnóstico
  y = checkPage(doc, y, sub);
  y = sectionTitle(doc, y, "2. DIAGNÓSTICO");
  if (d.diagnosticoResumen) y = para(doc, y, d.diagnosticoResumen) + 6;
  if (d.scoresSide && (d.scoresSide.idf || d.scoresSide.cof || d.scoresSide.ivee || d.scoresSide.ime)) {
    autoTable(doc, {
      startY: y,
      head: [["Dimensión", "Score"]],
      body: [
        ["IDF · Identidad y Dirección Fundamental", d.scoresSide.idf?.toFixed(1) ?? "—"],
        ["COF · Capacidades Operativas y Funcionales", d.scoresSide.cof?.toFixed(1) ?? "—"],
        ["IVEE · Innovación, Visión y Excelencia Estratégica", d.scoresSide.ivee?.toFixed(1) ?? "—"],
        ["IME · Impacto, Mercado y Escalabilidad", d.scoresSide.ime?.toFixed(1) ?? "—"],
      ],
      headStyles: { fillColor: NAVY, textColor: 255, fontSize: 10 },
      bodyStyles: { fontSize: 10 },
      margin: { left: 40, right: 40 },
    });
    y = (doc as unknown as { lastAutoTable: { finalY: number } }).lastAutoTable.finalY + 12;
  }
  if (d.retosClave?.length) {
    y = checkPage(doc, y, sub);
    doc.setTextColor(...NAVY); doc.setFont("helvetica", "bold"); doc.setFontSize(10);
    doc.text("Retos clave identificados:", 40, y); y += 14;
    doc.setFont("helvetica", "normal"); doc.setFontSize(10); doc.setTextColor(40);
    d.retosClave.forEach((r) => {
      y = checkPage(doc, y, sub);
      const lines = doc.splitTextToSize(`• ${r}`, doc.internal.pageSize.getWidth() - 80);
      doc.text(lines, 40, y); y += lines.length * 12 + 2;
    });
    y += 6;
  }

  // Programa
  y = checkPage(doc, y, sub);
  y = sectionTitle(doc, y, "3. PROGRAMA PROPUESTO");
  if (d.objetivos?.length) {
    doc.setTextColor(...NAVY); doc.setFont("helvetica", "bold"); doc.setFontSize(10);
    doc.text("Objetivos del programa", 40, y); y += 14;
    doc.setFont("helvetica", "normal"); doc.setFontSize(10); doc.setTextColor(40);
    d.objetivos.forEach((o) => {
      y = checkPage(doc, y, sub);
      const lines = doc.splitTextToSize(`✓ ${o}`, doc.internal.pageSize.getWidth() - 80);
      doc.text(lines, 40, y); y += lines.length * 12 + 2;
    });
    y += 6;
  }
  if (d.justificacion) {
    y = checkPage(doc, y, sub);
    doc.setTextColor(...NAVY); doc.setFont("helvetica", "bold"); doc.setFontSize(10);
    doc.text("Justificación", 40, y); y += 14;
    y = para(doc, y, d.justificacion) + 6;
  }

  // Entregables
  if (d.entregables?.length) {
    y = checkPage(doc, y, sub);
    y = sectionTitle(doc, y, "4. ENTREGABLES");
    autoTable(doc, {
      startY: y,
      head: [["#", "Entregable", "Descripción"]],
      body: d.entregables.map((e, i) => [String(i + 1), e.titulo, e.descripcion]),
      headStyles: { fillColor: NAVY, textColor: 255, fontSize: 10 },
      bodyStyles: { fontSize: 9, textColor: 40 },
      alternateRowStyles: { fillColor: [250, 248, 240] },
      columnStyles: { 0: { cellWidth: 24, halign: "center" }, 1: { cellWidth: 160, fontStyle: "bold" } },
      margin: { left: 40, right: 40 },
    });
    y = (doc as unknown as { lastAutoTable: { finalY: number } }).lastAutoTable.finalY + 12;
  }

  // Inversión
  y = checkPage(doc, y, sub);
  y = sectionTitle(doc, y, "5. INVERSIÓN");
  autoTable(doc, {
    startY: y,
    head: [["Concepto", "Cant.", `Precio (${d.moneda})`, `Total (${d.moneda})`]],
    body: d.servicios.map((s) => [s.nombre, String(s.cantidad), s.precio.toFixed(2), (s.cantidad * s.precio).toFixed(2)]),
    headStyles: { fillColor: NAVY, textColor: 255, fontSize: 10 },
    bodyStyles: { fontSize: 10 },
    columnStyles: { 1: { cellWidth: 50, halign: "center" }, 2: { cellWidth: 90, halign: "right" }, 3: { cellWidth: 90, halign: "right" } },
    margin: { left: 40, right: 40 },
  });
  y = (doc as unknown as { lastAutoTable: { finalY: number } }).lastAutoTable.finalY + 10;

  const pageW = doc.internal.pageSize.getWidth();
  const fmt = (n: number) => `${d.moneda} ${n.toFixed(2)}`;
  const totRows: Array<[string, string, boolean]> = [["Subtotal", fmt(d.subtotal), false]];
  if (d.descuentoPorcentaje > 0 || d.descuentoValor > 0)
    totRows.push([`Descuento${d.descuentoPorcentaje ? ` (${d.descuentoPorcentaje}%)` : ""}`, `- ${fmt(d.descuentoValor)}`, false]);
  totRows.push(["INVERSIÓN TOTAL", fmt(d.total), true]);
  totRows.forEach(([k, v, bold]) => {
    if (bold) {
      doc.setFillColor(...NAVY); doc.rect(pageW - 230, y - 12, 190, 24, "F");
      doc.setTextColor(255); doc.setFont("helvetica", "bold"); doc.setFontSize(12);
    } else {
      doc.setTextColor(40); doc.setFont("helvetica", "normal"); doc.setFontSize(10);
    }
    doc.text(k, pageW - 220, y);
    doc.text(v, pageW - 50, y, { align: "right" });
    y += bold ? 26 : 16;
  });
  y += 6;

  // IME
  if (d.imeEstimado) {
    y = checkPage(doc, y, sub);
    doc.setFillColor(248, 244, 232); doc.rect(40, y, pageW - 80, 56, "F");
    doc.setFillColor(...GOLD); doc.rect(40, y, 4, 56, "F");
    doc.setTextColor(...NAVY); doc.setFont("helvetica", "bold"); doc.setFontSize(10);
    doc.text("IMPACTO MONETARIO ESPERADO (IME)", 54, y + 16);
    doc.setFont("helvetica", "normal"); doc.setFontSize(10); doc.setTextColor(40);
    const lines = doc.splitTextToSize(d.imeEstimado, pageW - 110);
    doc.text(lines, 54, y + 32);
    y += 66;
  }

  // Condiciones / notas
  if (d.condiciones) {
    y = checkPage(doc, y, sub);
    y = sectionTitle(doc, y, "6. CONDICIONES");
    y = para(doc, y, d.condiciones);
  }
  if (d.notas) {
    y = checkPage(doc, y, sub) + 6;
    doc.setTextColor(...NAVY); doc.setFont("helvetica", "bold"); doc.setFontSize(10);
    doc.text("NOTAS", 40, y); y += 14;
    y = para(doc, y, d.notas);
  }

  // Footer en cada página
  const pages = doc.getNumberOfPages();
  for (let i = 1; i <= pages; i++) {
    doc.setPage(i);
    const w = doc.internal.pageSize.getWidth();
    const h = doc.internal.pageSize.getHeight();
    doc.setFillColor(...GOLD); doc.rect(0, h - 32, w, 2, "F");
    doc.setTextColor(...MUTED); doc.setFontSize(8);
    doc.text("A360SGP · Strategic Growth Partners", 40, h - 18);
    doc.text(`Página ${i} / ${pages}`, w - 40, h - 18, { align: "right" });
    if (d.consultor?.nombre && i === 1)
      doc.text(`Consultor: ${d.consultor.nombre}`, w / 2, h - 18, { align: "center" });
  }

  return doc;
}
