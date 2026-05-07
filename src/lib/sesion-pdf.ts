import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";

const NAVY: [number, number, number] = [16, 32, 64];
const GOLD: [number, number, number] = [191, 156, 78];
const MUTED: [number, number, number] = [110, 110, 120];

export interface ReporteSesionData {
  empresa: { nombre: string; sector?: string | null };
  numero_sesion?: number | null;
  programa?: string | null;
  etapa?: string | null;
  fecha: string;
  duracion_minutos?: number | null;
  modalidad?: string | null;
  participantes: string[];
  objetivo?: string | null;
  temas: string[];
  logros: string[];
  herramientas: string[];
  semaforo?: string | null;
  justificacion_semaforo?: string | null;
  kpis: { categoria: string; nombre: string; valor_actual?: string; valor_meta?: string; unidad?: string; semaforo: string; observacion?: string }[];
  compromisos: { descripcion: string; responsable: string; fecha_limite?: string }[];
  proxima_fecha?: string | null;
  proxima_temas: string[];
  mensaje_cliente?: string | null;
  consultor?: { nombre?: string | null };
}

const head = (doc: jsPDF) => {
  const w = doc.internal.pageSize.getWidth();
  doc.setFillColor(...NAVY); doc.rect(0, 0, w, 80, "F");
  doc.setFillColor(...GOLD); doc.rect(0, 80, w, 3, "F");
  doc.setTextColor(255); doc.setFont("helvetica", "bold"); doc.setFontSize(20);
  doc.text("A360SGP", 40, 38);
  doc.setFont("helvetica", "normal"); doc.setFontSize(8); doc.setTextColor(...GOLD);
  doc.text("STRATEGIC GROWTH PARTNERS", 40, 52);
  doc.setTextColor(255); doc.setFont("helvetica", "bold"); doc.setFontSize(13);
  doc.text("REPORTE DE SESIÓN", w - 40, 38, { align: "right" });
};

const section = (doc: jsPDF, y: number, txt: string) => {
  const w = doc.internal.pageSize.getWidth();
  doc.setFillColor(248, 244, 232); doc.rect(40, y, w - 80, 22, "F");
  doc.setTextColor(...NAVY); doc.setFont("helvetica", "bold"); doc.setFontSize(11);
  doc.text(txt, 50, y + 15); return y + 32;
};

const field = (doc: jsPDF, y: number, label: string, value?: string | null) => {
  if (!value) return y;
  doc.setTextColor(...MUTED); doc.setFont("helvetica", "bold"); doc.setFontSize(9);
  doc.text(label.toUpperCase(), 40, y);
  doc.setTextColor(40); doc.setFont("helvetica", "normal"); doc.setFontSize(10);
  const lines = doc.splitTextToSize(String(value), doc.internal.pageSize.getWidth() - 80);
  doc.text(lines, 40, y + 12);
  return y + 14 + lines.length * 11;
};

const list = (doc: jsPDF, y: number, label: string, items?: string[]) => {
  if (!items?.length) return y;
  doc.setTextColor(...MUTED); doc.setFont("helvetica", "bold"); doc.setFontSize(9);
  doc.text(label.toUpperCase(), 40, y);
  doc.setTextColor(40); doc.setFont("helvetica", "normal"); doc.setFontSize(10);
  let yy = y + 14;
  items.forEach((it) => {
    const lines = doc.splitTextToSize(`• ${it}`, doc.internal.pageSize.getWidth() - 80);
    doc.text(lines, 40, yy); yy += lines.length * 11 + 2;
  });
  return yy + 4;
};

const checkPage = (doc: jsPDF, y: number) => {
  if (y > doc.internal.pageSize.getHeight() - 80) { doc.addPage(); head(doc); return 110; }
  return y;
};

const semColor = (s?: string): [number, number, number] => s === "verde" ? [34, 197, 94] : s === "amarillo" ? [234, 179, 8] : s === "rojo" ? [239, 68, 68] : [120, 120, 120];

export function generarReporteSesionPDF(data: ReporteSesionData): jsPDF {
  const doc = new jsPDF({ unit: "pt", format: "a4" });
  head(doc);
  let y = 110;

  // Encabezado
  doc.setTextColor(...NAVY); doc.setFont("helvetica", "bold"); doc.setFontSize(16);
  doc.text(data.empresa.nombre, 40, y); y += 18;
  doc.setFont("helvetica", "normal"); doc.setFontSize(10); doc.setTextColor(...MUTED);
  const meta = [
    data.numero_sesion ? `Sesión #${data.numero_sesion}` : null,
    data.programa, data.etapa,
    new Date(data.fecha).toLocaleString(),
    data.duracion_minutos ? `${data.duracion_minutos} min` : null,
    data.modalidad,
  ].filter(Boolean).join(" · ");
  doc.text(meta, 40, y); y += 24;

  // Semáforo
  if (data.semaforo) {
    const c = semColor(data.semaforo);
    doc.setFillColor(...c); doc.circle(50, y + 6, 6, "F");
    doc.setTextColor(...NAVY); doc.setFont("helvetica", "bold"); doc.setFontSize(11);
    doc.text(`Estado de la sesión: ${data.semaforo.toUpperCase()}`, 64, y + 9);
    y += 24;
    if (data.justificacion_semaforo) y = field(doc, y, "Justificación", data.justificacion_semaforo);
  }

  y = section(doc, y, "1. Contexto y objetivo");
  y = list(doc, y, "Participantes", data.participantes);
  y = field(doc, y, "Objetivo de la sesión", data.objetivo);

  y = checkPage(doc, y);
  y = section(doc, y, "2. Temas abordados y logros");
  y = list(doc, y, "Temas", data.temas);
  y = list(doc, y, "Logros / avances", data.logros);
  y = list(doc, y, "Herramientas aplicadas", data.herramientas);

  if (data.kpis.length) {
    y = checkPage(doc, y); y = section(doc, y, "3. KPIs medidos");
    autoTable(doc, {
      startY: y,
      head: [["Categoría", "KPI", "Actual", "Meta", "Estado", "Observación"]],
      body: data.kpis.map((k) => [
        k.categoria, k.nombre,
        [k.valor_actual, k.unidad].filter(Boolean).join(" "),
        [k.valor_meta, k.unidad].filter(Boolean).join(" "),
        k.semaforo.toUpperCase(),
        k.observacion ?? "",
      ]),
      headStyles: { fillColor: NAVY, textColor: 255, fontSize: 9 },
      bodyStyles: { fontSize: 9 },
      margin: { left: 40, right: 40 },
    });
    y = (doc as unknown as { lastAutoTable: { finalY: number } }).lastAutoTable.finalY + 10;
  }

  if (data.compromisos.length) {
    y = checkPage(doc, y); y = section(doc, y, "4. Compromisos");
    autoTable(doc, {
      startY: y,
      head: [["Compromiso", "Responsable", "Fecha límite"]],
      body: data.compromisos.map((c) => [c.descripcion, c.responsable, c.fecha_limite ?? "—"]),
      headStyles: { fillColor: NAVY, textColor: 255, fontSize: 9 },
      bodyStyles: { fontSize: 9 },
      margin: { left: 40, right: 40 },
    });
    y = (doc as unknown as { lastAutoTable: { finalY: number } }).lastAutoTable.finalY + 10;
  }

  y = checkPage(doc, y); y = section(doc, y, "5. Próxima sesión");
  y = field(doc, y, "Fecha próxima", data.proxima_fecha ? new Date(data.proxima_fecha).toLocaleString() : null);
  y = list(doc, y, "Temas planificados", data.proxima_temas);

  if (data.mensaje_cliente) {
    y = checkPage(doc, y); y = section(doc, y, "Mensaje para el cliente");
    doc.setFont("helvetica", "normal"); doc.setFontSize(10); doc.setTextColor(40);
    const lines = doc.splitTextToSize(data.mensaje_cliente, doc.internal.pageSize.getWidth() - 80);
    lines.forEach((l: string) => { y = checkPage(doc, y); doc.text(l, 40, y); y += 12; });
  }

  const pages = doc.getNumberOfPages();
  for (let i = 1; i <= pages; i++) {
    doc.setPage(i);
    const w = doc.internal.pageSize.getWidth(); const h = doc.internal.pageSize.getHeight();
    doc.setFillColor(...GOLD); doc.rect(0, h - 32, w, 2, "F");
    doc.setTextColor(...MUTED); doc.setFontSize(8);
    doc.text("A360SGP · Strategic Growth Partners", 40, h - 18);
    doc.text(`Página ${i} / ${pages}`, w - 40, h - 18, { align: "right" });
    if (data.consultor?.nombre && i === 1) {
      doc.text(`Consultor: ${data.consultor.nombre}`, w / 2, h - 18, { align: "center" });
    }
  }
  return doc;
}
