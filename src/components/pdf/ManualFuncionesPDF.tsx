import { Document, Page, View, Text, StyleSheet } from "@react-pdf/renderer";
import type { Cargo } from "@/types/manual-funciones";

// ── Palette ───────────────────────────────────────────────────────────────────
const C = {
  navy:    "#0C4A6E",
  blue:    "#1E3A8A",
  sky:     "#38BDF8",
  indigo:  "#6366F1",
  green:   "#059669",
  purple:  "#7F77DD",
  slate:   "#334155",
  muted:   "#64748B",
  border:  "#E0E7FF",
  bgLight: "#F5F7FF",
  white:   "#FFFFFF",
};

// ── Styles ────────────────────────────────────────────────────────────────────
const s = StyleSheet.create({
  page: {
    fontFamily: "Helvetica",
    fontSize: 10,
    color: C.slate,
    paddingTop: 30,
    paddingBottom: 40,
    paddingHorizontal: 36,
    backgroundColor: C.white,
  },

  // Section wrapper
  section: {
    marginBottom: 12,
    borderRadius: 6,
    border: `1 solid ${C.border}`,
    overflow: "hidden",
  },
  sectionHeader: {
    backgroundColor: "#F0F4FF",
    paddingVertical: 7,
    paddingHorizontal: 12,
    borderBottom: `1 solid ${C.border}`,
  },
  sectionTitle: {
    fontSize: 8,
    fontFamily: "Helvetica-Bold",
    color: C.navy,
    textTransform: "uppercase",
    letterSpacing: 1,
  },
  sectionBody: {
    padding: 12,
  },

  // Header block
  header: {
    backgroundColor: C.navy,
    borderRadius: 8,
    padding: 20,
    marginBottom: 14,
  },
  headerCompany: {
    fontSize: 8,
    color: "rgba(255,255,255,0.6)",
    textTransform: "uppercase",
    letterSpacing: 1.2,
    marginBottom: 6,
  },
  headerCargo: {
    fontSize: 22,
    fontFamily: "Helvetica-Bold",
    color: C.white,
    marginBottom: 5,
  },
  headerMeta: {
    fontSize: 10,
    color: "rgba(255,255,255,0.75)",
    marginBottom: 10,
  },
  badgesRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 6,
  },
  badge: {
    backgroundColor: "rgba(255,255,255,0.15)",
    borderRadius: 20,
    paddingHorizontal: 10,
    paddingVertical: 3,
    fontSize: 8,
    color: C.white,
    fontFamily: "Helvetica-Bold",
  },

  // Meta row (elaborado, aprobado, fechas)
  metaRow: {
    flexDirection: "row",
    gap: 8,
    marginBottom: 12,
  },
  metaCard: {
    flex: 1,
    backgroundColor: C.white,
    border: `1 solid ${C.border}`,
    borderRadius: 5,
    padding: 8,
  },
  metaLabel: {
    fontSize: 7,
    fontFamily: "Helvetica-Bold",
    color: C.muted,
    textTransform: "uppercase",
    letterSpacing: 0.8,
    marginBottom: 2,
  },
  metaValue: {
    fontSize: 9,
    fontFamily: "Helvetica-Bold",
    color: C.navy,
  },

  // Objetivo
  objetivoBox: {
    borderLeft: `4 solid ${C.sky}`,
    paddingLeft: 10,
    paddingVertical: 4,
  },
  objetivoText: {
    fontSize: 10,
    color: C.slate,
    lineHeight: 1.7,
    fontFamily: "Helvetica-Oblique",
  },

  // Funciones
  funcionRow: {
    flexDirection: "row",
    gap: 10,
    marginBottom: 8,
    alignItems: "flex-start",
  },
  funcionNum: {
    width: 22,
    height: 22,
    borderRadius: 11,
    backgroundColor: C.navy,
    alignItems: "center",
    justifyContent: "center",
    flexShrink: 0,
  },
  funcionNumText: {
    color: C.white,
    fontSize: 8,
    fontFamily: "Helvetica-Bold",
  },
  funcionDesc: {
    flex: 1,
    fontSize: 10,
    color: C.slate,
    lineHeight: 1.6,
    paddingTop: 4,
  },

  // Competencias
  compGrid: {
    flexDirection: "row",
    gap: 10,
  },
  compCol: {
    flex: 1,
    borderRadius: 6,
    padding: 10,
  },
  compColBlandas: {
    backgroundColor: "#F0FDF4",
    borderLeft: `3 solid #86EFAC`,
  },
  compColTecnicas: {
    backgroundColor: "#EFF6FF",
    borderLeft: `3 solid #BFDBFE`,
  },
  compColLabel: {
    fontSize: 7,
    fontFamily: "Helvetica-Bold",
    textTransform: "uppercase",
    letterSpacing: 0.8,
    marginBottom: 8,
  },
  compColLabelBlandas: { color: C.green },
  compColLabelTecnicas: { color: "#1D4ED8" },
  compItem: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingVertical: 5,
    borderBottom: `1 solid #E2E8F0`,
  },
  compItemLast: {
    borderBottom: 0,
  },
  compNombre: {
    fontSize: 9,
    color: C.slate,
    flex: 1,
  },
  nivelBadge: {
    fontSize: 7,
    fontFamily: "Helvetica-Bold",
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 10,
  },

  // KPIs table
  tableHeader: {
    flexDirection: "row",
    backgroundColor: C.navy,
    paddingVertical: 8,
    paddingHorizontal: 10,
  },
  tableHeaderCell: {
    fontSize: 8,
    fontFamily: "Helvetica-Bold",
    color: C.white,
    textTransform: "uppercase",
    letterSpacing: 0.5,
  },
  tableRow: {
    flexDirection: "row",
    paddingVertical: 7,
    paddingHorizontal: 10,
    borderBottom: `1 solid ${C.border}`,
  },
  tableRowEven: {
    backgroundColor: C.bgLight,
  },
  tableCell: {
    fontSize: 9,
    color: C.slate,
  },
  tableCellBold: {
    fontFamily: "Helvetica-Bold",
    color: C.navy,
  },
  colIndicador: { flex: 2 },
  colMeta:      { flex: 2 },
  colFreq:      { flex: 1 },

  // Relaciones
  relGrid: {
    flexDirection: "row",
    gap: 10,
  },
  relCol: {
    flex: 1,
    backgroundColor: C.bgLight,
    borderRadius: 6,
    padding: 10,
  },
  relInternas: { borderLeft: `3 solid ${C.navy}` },
  relExternas: { borderLeft: `3 solid ${C.blue}` },
  relLabel: {
    fontSize: 7,
    fontFamily: "Helvetica-Bold",
    textTransform: "uppercase",
    letterSpacing: 0.8,
    color: C.navy,
    marginBottom: 6,
  },
  relItem: {
    flexDirection: "row",
    gap: 5,
    marginBottom: 4,
  },
  relBullet: {
    fontSize: 8,
    color: C.sky,
    marginTop: 1,
  },
  relText: {
    fontSize: 9,
    color: C.slate,
    flex: 1,
    lineHeight: 1.5,
  },

  // Condiciones
  condGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
  },
  condCard: {
    width: "48%",
    backgroundColor: C.bgLight,
    border: `1 solid ${C.border}`,
    borderRadius: 6,
    padding: 10,
  },
  condLabel: {
    fontSize: 7,
    fontFamily: "Helvetica-Bold",
    color: C.purple,
    textTransform: "uppercase",
    letterSpacing: 0.8,
    marginBottom: 4,
  },
  condValor: {
    fontSize: 9,
    color: C.slate,
    lineHeight: 1.5,
  },

  // Plan carrera
  planBox: {
    backgroundColor: C.navy,
    borderRadius: 8,
    padding: 16,
  },
  planLabel: {
    fontSize: 8,
    color: "rgba(255,255,255,0.6)",
    textTransform: "uppercase",
    letterSpacing: 1,
    marginBottom: 6,
  },
  planText: {
    fontSize: 10,
    color: C.white,
    lineHeight: 1.7,
  },

  // Firmas
  firmasRow: {
    flexDirection: "row",
    gap: 20,
    marginTop: 28,
    paddingTop: 16,
    borderTop: `1 solid ${C.border}`,
  },
  firmaCol: {
    flex: 1,
    alignItems: "center",
  },
  firmaLinea: {
    borderTop: `1.5 solid ${C.navy}`,
    width: "100%",
    marginBottom: 6,
  },
  firmaNombre: {
    fontSize: 9,
    fontFamily: "Helvetica-Bold",
    color: C.navy,
    marginBottom: 3,
  },
  firmaTitulo: {
    fontSize: 7,
    color: C.muted,
    textTransform: "uppercase",
    letterSpacing: 0.8,
  },

  // Footer
  footer: {
    position: "absolute",
    bottom: 18,
    left: 36,
    right: 36,
    flexDirection: "row",
    justifyContent: "space-between",
    borderTop: `1 solid ${C.border}`,
    paddingTop: 6,
  },
  footerText: {
    fontSize: 7,
    color: C.muted,
  },
});

// ── Helpers ───────────────────────────────────────────────────────────────────
function fmtDate(iso: string | null): string {
  if (!iso) return "—";
  try {
    return new Date(iso).toLocaleDateString("es-CO", {
      day: "2-digit", month: "long", year: "numeric",
    });
  } catch { return iso; }
}

function nivelStyle(nivel: string) {
  const map: Record<string, { backgroundColor: string; color: string }> = {
    Experto:     { backgroundColor: "#FEF3C7", color: "#92400E" },
    Avanzado:    { backgroundColor: "#DBEAFE", color: "#1E40AF" },
    Intermedio:  { backgroundColor: "#D1FAE5", color: "#065F46" },
    Básico:      { backgroundColor: "#F3F4F6", color: "#374151" },
  };
  return map[nivel] ?? map["Básico"];
}

// ── Section wrapper ───────────────────────────────────────────────────────────
function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <View style={s.section}>
      <View style={s.sectionHeader}>
        <Text style={s.sectionTitle}>{title}</Text>
      </View>
      <View style={s.sectionBody}>{children}</View>
    </View>
  );
}

// ── Main PDF component ────────────────────────────────────────────────────────
export function ManualFuncionesPDF({
  cargo,
  clienteNombre,
}: {
  cargo: Cargo;
  clienteNombre: string;
}) {
  const hasContent = (arr: unknown[]) => arr.length > 0;
  const today = new Date().toLocaleDateString("es-CO");

  const metas = [
    { lbl: "Elaborado por",     val: cargo.elaborado_por },
    { lbl: "Aprobado por",      val: cargo.aprobado_por },
    { lbl: "Fecha elaboración", val: fmtDate(cargo.fecha_elaboracion) },
    { lbl: "Fecha revisión",    val: fmtDate(cargo.fecha_revision) },
  ].filter((r) => r.val && r.val !== "—");

  const condEntries = cargo.condiciones
    ? Object.entries(cargo.condiciones).filter(([, v]) => v)
    : [];

  return (
    <Document>
      <Page size="A4" style={s.page}>

        {/* ── Cabecera ── */}
        <View style={s.header}>
          <Text style={s.headerCompany}>
            {clienteNombre} · Manual de Funciones
          </Text>
          <Text style={s.headerCargo}>{cargo.cargo}</Text>
          <Text style={s.headerMeta}>
            {cargo.area}
            {cargo.jefe_inmediato ? `  ·  Reporta a: ${cargo.jefe_inmediato}` : ""}
          </Text>
          <View style={s.badgesRow}>
            {cargo.estado && (
              <View style={s.badge}>
                <Text>{cargo.estado.replace("_", " ")}</Text>
              </View>
            )}
            {cargo.vacante && (
              <View style={s.badge}>
                <Text>Vacante</Text>
              </View>
            )}
            {cargo.codigo && (
              <View style={s.badge}>
                <Text>{cargo.codigo}</Text>
              </View>
            )}
            {cargo.version && (
              <View style={s.badge}>
                <Text>v{cargo.version}</Text>
              </View>
            )}
          </View>
        </View>

        {/* ── Meta fila ── */}
        {metas.length > 0 && (
          <View style={s.metaRow}>
            {metas.map((r) => (
              <View key={r.lbl} style={s.metaCard}>
                <Text style={s.metaLabel}>{r.lbl}</Text>
                <Text style={s.metaValue}>{r.val}</Text>
              </View>
            ))}
          </View>
        )}

        {/* ── Objetivo ── */}
        {cargo.objetivo && (
          <Section title="Objetivo del Cargo">
            <View style={s.objetivoBox}>
              <Text style={s.objetivoText}>{cargo.objetivo}</Text>
            </View>
          </Section>
        )}

        {/* ── Funciones ── */}
        {hasContent(cargo.funciones) && (
          <Section title="Funciones Principales">
            {cargo.funciones.map((fn, i) => (
              <View key={i} style={s.funcionRow}>
                <View style={s.funcionNum}>
                  <Text style={s.funcionNumText}>{i + 1}</Text>
                </View>
                <Text style={s.funcionDesc}>{fn.descripcion}</Text>
              </View>
            ))}
          </Section>
        )}

        {/* ── Competencias ── */}
        {(hasContent(cargo.competencias_blandas) || hasContent(cargo.competencias_tecnicas)) && (
          <Section title="Competencias">
            <View style={s.compGrid}>
              {hasContent(cargo.competencias_blandas) && (
                <View style={[s.compCol, s.compColBlandas]}>
                  <Text style={[s.compColLabel, s.compColLabelBlandas]}>Blandas</Text>
                  {cargo.competencias_blandas.map((c, i) => (
                    <View
                      key={i}
                      style={[
                        s.compItem,
                        i === cargo.competencias_blandas.length - 1 ? s.compItemLast : {},
                      ]}
                    >
                      <Text style={s.compNombre}>{c.nombre}</Text>
                      <View style={[s.nivelBadge, nivelStyle(c.nivel)]}>
                        <Text>{c.nivel}</Text>
                      </View>
                    </View>
                  ))}
                </View>
              )}
              {hasContent(cargo.competencias_tecnicas) && (
                <View style={[s.compCol, s.compColTecnicas]}>
                  <Text style={[s.compColLabel, s.compColLabelTecnicas]}>Técnicas</Text>
                  {cargo.competencias_tecnicas.map((c, i) => (
                    <View
                      key={i}
                      style={[
                        s.compItem,
                        i === cargo.competencias_tecnicas.length - 1 ? s.compItemLast : {},
                      ]}
                    >
                      <Text style={s.compNombre}>{c.nombre}</Text>
                      <View style={[s.nivelBadge, nivelStyle(c.nivel)]}>
                        <Text>{c.nivel}</Text>
                      </View>
                    </View>
                  ))}
                </View>
              )}
            </View>
          </Section>
        )}

        {/* ── KPIs ── */}
        {hasContent(cargo.kpis) && (
          <Section title="KPIs">
            <View style={s.tableHeader}>
              <Text style={[s.tableHeaderCell, s.colIndicador]}>Indicador</Text>
              <Text style={[s.tableHeaderCell, s.colMeta]}>Meta</Text>
              <Text style={[s.tableHeaderCell, s.colFreq]}>Frecuencia</Text>
            </View>
            {cargo.kpis.map((k, i) => (
              <View key={i} style={[s.tableRow, i % 2 !== 0 ? s.tableRowEven : {}]}>
                <Text style={[s.tableCell, s.tableCellBold, s.colIndicador]}>{k.nombre}</Text>
                <Text style={[s.tableCell, s.colMeta]}>{k.meta}</Text>
                <Text style={[s.tableCell, s.colFreq]}>{k.frecuencia}</Text>
              </View>
            ))}
          </Section>
        )}

        {/* ── Relaciones ── */}
        {(hasContent(cargo.relaciones_internas) || hasContent(cargo.relaciones_externas)) && (
          <Section title="Relaciones de Trabajo">
            <View style={s.relGrid}>
              {hasContent(cargo.relaciones_internas) && (
                <View style={[s.relCol, s.relInternas]}>
                  <Text style={s.relLabel}>Relaciones Internas</Text>
                  {cargo.relaciones_internas.map((r, i) => (
                    <View key={i} style={s.relItem}>
                      <Text style={s.relBullet}>◆</Text>
                      <Text style={s.relText}>{r}</Text>
                    </View>
                  ))}
                </View>
              )}
              {hasContent(cargo.relaciones_externas) && (
                <View style={[s.relCol, s.relExternas]}>
                  <Text style={s.relLabel}>Relaciones Externas</Text>
                  {cargo.relaciones_externas.map((r, i) => (
                    <View key={i} style={s.relItem}>
                      <Text style={s.relBullet}>◆</Text>
                      <Text style={s.relText}>{r}</Text>
                    </View>
                  ))}
                </View>
              )}
            </View>
          </Section>
        )}

        {/* ── Condiciones ── */}
        {condEntries.length > 0 && (
          <Section title="Condiciones de Trabajo">
            <View style={s.condGrid}>
              {condEntries.map(([key, val]) => (
                <View key={key} style={s.condCard}>
                  <Text style={s.condLabel}>
                    {key.charAt(0).toUpperCase() + key.slice(1).replace(/_/g, " ")}
                  </Text>
                  <Text style={s.condValor}>{val}</Text>
                </View>
              ))}
            </View>
          </Section>
        )}

        {/* ── Plan de carrera ── */}
        {cargo.plan_carrera && (
          <Section title="Plan de Carrera">
            <View style={s.planBox}>
              <Text style={s.planLabel}>Trayectoria de crecimiento</Text>
              <Text style={s.planText}>{cargo.plan_carrera}</Text>
            </View>
          </Section>
        )}

        {/* ── Firmas ── */}
        <View style={s.firmasRow}>
          {[
            { titulo: "Elaborado por", nombre: cargo.elaborado_por },
            { titulo: "Revisado por",  nombre: null },
            { titulo: "Aprobado por",  nombre: cargo.aprobado_por },
          ].map((f) => (
            <View key={f.titulo} style={s.firmaCol}>
              <View style={s.firmaLinea} />
              <Text style={s.firmaNombre}>
                {f.nombre || "________________________"}
              </Text>
              <Text style={s.firmaTitulo}>{f.titulo}</Text>
            </View>
          ))}
        </View>

        {/* ── Footer fijo ── */}
        <View style={s.footer} fixed>
          <Text style={s.footerText}>A360 Suite · Manual de Funciones · {clienteNombre}</Text>
          <Text style={s.footerText}>{today}</Text>
        </View>

      </Page>
    </Document>
  );
}
