import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";
import { DIMENSIONES_SIDE_12 } from "./onboarding-helpers";

const NAVY: [number, number, number] = [16, 32, 64];
const GOLD: [number, number, number] = [191, 156, 78];
const MUTED: [number, number, number] = [110, 110, 120];

export interface PerfilClienteData {
  empresa: { nombre: string; nombre_comercial?: string | null; sector?: string | null; ciudad?: string | null; pais?: string | null };
  paso1: Record<string, unknown>;
  paso2: Record<string, unknown>;
  paso3: { fortalezas?: string[]; debilidades?: string[]; oportunidades?: string[]; amenazas?: string[]; dimensiones_urgentes?: string[]; situacion_actual?: string; contexto_sector?: string; competencia?: string };
  paso4: { objetivos?: string[]; prioridades?: Record<string, number>; resultado_3m?: string; resultado_final?: string; indicador_exito?: string; programa_recomendado?: string; justificacion?: string };
  paso5: { fecha_inicio?: string; fecha_cierre?: string; frecuencia?: string; modalidad?: string; consultor_responsable?: string; inversion?: string; forma_pago?: string; compromisos_cliente?: string[]; compromisos_consultor?: string[]; condiciones?: string };
  analisis_ia?: string | null;
  consultor?: { nombre?: string | null; email?: string | null };
}

const head = (doc: jsPDF, titulo: string) => {
  const w = doc.internal.pageSize.getWidth();
  doc.setFillColor(...NAVY); doc.rect(0, 0, w, 80, "F");
  doc.setFillColor(...GOLD); doc.rect(0, 80, w, 3, "F");
  doc.setTextColor(255); doc.setFont("helvetica", "bold"); doc.setFontSize(20);
  doc.text("A360SGP", 40, 38);
  doc.setFont("helvetica", "normal"); doc.setFontSize(8); doc.setTextColor(...GOLD);
  doc.text("STRATEGIC GROWTH PARTNERS", 40, 52);
  doc.setTextColor(255); doc.setFont("helvetica", "bold"); doc.setFontSize(13);
  doc.text(titulo, w - 40, 38, { align: "right" });
};

const sectionTitle = (doc: jsPDF, y: number, txt: string) => {
  const w = doc.internal.pageSize.getWidth();
  doc.setFillColor(248, 244, 232); doc.rect(40, y, w - 80, 22, "F");
  doc.setTextColor(...NAVY); doc.setFont("helvetica", "bold"); doc.setFontSize(11);
  doc.text(txt, 50, y + 15);
  return y + 32;
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
  if (!items || !items.length) return y;
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

const checkPage = (doc: jsPDF, y: number, titulo: string) => {
  if (y > doc.internal.pageSize.getHeight() - 80) { doc.addPage(); head(doc, titulo); return 110; }
  return y;
};

export function generarPerfilClientePDF(data: PerfilClienteData): jsPDF {
  const doc = new jsPDF({ unit: "pt", format: "a4" });
  const titulo = "PERFIL DEL CLIENTE";
  head(doc, titulo);
  let y = 110;

  // Empresa
  doc.setTextColor(...NAVY); doc.setFont("helvetica", "bold"); doc.setFontSize(16);
  doc.text(data.empresa.nombre, 40, y); y += 18;
  doc.setFont("helvetica", "normal"); doc.setFontSize(10); doc.setTextColor(...MUTED);
  doc.text([data.empresa.nombre_comercial, data.empresa.sector, [data.empresa.ciudad, data.empresa.pais].filter(Boolean).join(", ")].filter(Boolean).join(" · "), 40, y);
  y += 24;

  // Paso 1
  y = sectionTitle(doc, y, "1. Perfil de la empresa");
  const p1 = data.paso1 as Record<string, string>;
  y = field(doc, y, "Año de fundación", p1.anio_fundacion);
  y = field(doc, y, "Tipo de empresa", p1.tipo_empresa);
  y = field(doc, y, "Mercado objetivo", p1.mercado_objetivo);
  y = field(doc, y, "Cobertura", p1.cobertura);
  y = field(doc, y, "Historia", p1.historia);
  y = field(doc, y, "Productos / Servicios", p1.productos);
  y = field(doc, y, "Propuesta de valor", p1.propuesta_valor);
  y = field(doc, y, "Organigrama", p1.organigrama);
  y = field(doc, y, "Procesos documentados", p1.procesos);
  y = field(doc, y, "Herramientas digitales", p1.herramientas_digitales);

  y = checkPage(doc, y, titulo);
  y = sectionTitle(doc, y, "2. Perfil del líder");
  const p2 = data.paso2 as Record<string, string>;
  y = field(doc, y, "Nombre", p2.nombre);
  y = field(doc, y, "Cargo", p2.cargo);
  y = field(doc, y, "Contacto", [p2.email, p2.telefono].filter(Boolean).join(" · "));
  y = field(doc, y, "Formación / Experiencia", [p2.formacion, p2.experiencia ? `${p2.experiencia} años` : ""].filter(Boolean).join(" — "));
  y = field(doc, y, "Estilo / Rol", [p2.estilo, p2.rol].filter(Boolean).join(" / "));
  y = field(doc, y, "Fortaleza principal", p2.fortaleza);
  y = field(doc, y, "Área de desarrollo", p2.area_desarrollo);
  y = field(doc, y, "Visión a 5 años", p2.vision_5_anios);
  y = field(doc, y, "Motivación", p2.motivacion);
  y = field(doc, y, "Temor / Resistencia", p2.temor);
  y = field(doc, y, "Disponibilidad", p2.disponibilidad);
  y = field(doc, y, "Experiencia previa consultores", p2.experiencia_consultores);
  y = field(doc, y, "Actitud al cambio", p2.actitud_cambio);
  y = field(doc, y, "Notas", p2.notas);

  y = checkPage(doc, y, titulo);
  y = sectionTitle(doc, y, "3. Contexto estratégico");
  y = field(doc, y, "Situación actual", data.paso3.situacion_actual);
  y = list(doc, y, "Fortalezas", data.paso3.fortalezas);
  y = list(doc, y, "Debilidades", data.paso3.debilidades);
  y = list(doc, y, "Oportunidades", data.paso3.oportunidades);
  y = list(doc, y, "Amenazas", data.paso3.amenazas);
  if (data.paso3.dimensiones_urgentes?.length) {
    const labels = data.paso3.dimensiones_urgentes.map((k) => DIMENSIONES_SIDE_12.find((d) => d.key === k)?.nombre ?? k);
    y = field(doc, y, "Dimensiones de mayor urgencia", labels.join(", "));
  }
  y = field(doc, y, "Contexto del sector", data.paso3.contexto_sector);
  y = field(doc, y, "Competencia principal", data.paso3.competencia);

  y = checkPage(doc, y, titulo);
  y = sectionTitle(doc, y, "4. Expectativas y objetivos");
  y = list(doc, y, "Objetivos del cliente", data.paso4.objetivos);
  if (data.paso4.prioridades && Object.keys(data.paso4.prioridades).length) {
    autoTable(doc, {
      startY: y,
      head: [["Dimensión", "Prioridad (1-5)"]],
      body: DIMENSIONES_SIDE_12.map((d) => [d.nombre, String(data.paso4.prioridades?.[d.key] ?? "—")]),
      headStyles: { fillColor: NAVY, textColor: 255, fontSize: 9 },
      bodyStyles: { fontSize: 9 },
      margin: { left: 40, right: 40 },
    });
    y = (doc as unknown as { lastAutoTable: { finalY: number } }).lastAutoTable.finalY + 10;
  }
  y = field(doc, y, "Resultado a 3 meses", data.paso4.resultado_3m);
  y = field(doc, y, "Resultado al cierre del programa", data.paso4.resultado_final);
  y = field(doc, y, "Indicador de éxito principal", data.paso4.indicador_exito);
  y = field(doc, y, "Programa recomendado", data.paso4.programa_recomendado);
  y = field(doc, y, "Justificación", data.paso4.justificacion);

  y = checkPage(doc, y, titulo);
  y = sectionTitle(doc, y, "5. Acuerdo de trabajo");
  y = field(doc, y, "Período", [data.paso5.fecha_inicio, data.paso5.fecha_cierre].filter(Boolean).join(" → "));
  y = field(doc, y, "Frecuencia", data.paso5.frecuencia);
  y = field(doc, y, "Modalidad", data.paso5.modalidad);
  y = field(doc, y, "Consultor responsable", data.paso5.consultor_responsable);
  y = field(doc, y, "Inversión", data.paso5.inversion);
  y = field(doc, y, "Forma de pago", data.paso5.forma_pago);
  y = list(doc, y, "Compromisos del cliente", data.paso5.compromisos_cliente);
  y = list(doc, y, "Compromisos del consultor", data.paso5.compromisos_consultor);
  y = field(doc, y, "Condiciones", data.paso5.condiciones);

  if (data.analisis_ia) {
    y = checkPage(doc, y, titulo);
    y = sectionTitle(doc, y, "Análisis IA — Recomendaciones iniciales");
    doc.setFont("helvetica", "normal"); doc.setFontSize(10); doc.setTextColor(40);
    const lines = doc.splitTextToSize(data.analisis_ia.replace(/\*\*/g, "").replace(/##\s*/g, ""), doc.internal.pageSize.getWidth() - 80);
    lines.forEach((line: string) => {
      y = checkPage(doc, y, titulo);
      doc.text(line, 40, y); y += 12;
    });
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
    if (data.consultor?.nombre && i === 1) {
      doc.text(`Consultor: ${data.consultor.nombre}`, w / 2, h - 18, { align: "center" });
    }
  }

  return doc;
}
