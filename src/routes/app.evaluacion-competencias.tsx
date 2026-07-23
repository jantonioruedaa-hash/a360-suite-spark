import { useMemo, useState, useEffect } from "react";
import { createFileRoute } from "@tanstack/react-router";
import {
  CARGO_MOCK, NIVELES_LABEL, MODALIDADES, nivelToNum, splitReqItems,
  type CargoMock,
} from "@/lib/evaluacion-mock";

export const Route = createFileRoute("/app/evaluacion-competencias")({
  head: () => ({
    meta: [
      { title: "Evaluación de Competencias & PDI — A360 Suite" },
      { name: "description", content: "Módulo aislado de Evaluación de Competencias con GAP Analysis y Plan de Desarrollo Individual." },
      { property: "og:title", content: "Evaluación de Competencias & PDI" },
      { property: "og:description", content: "GAP analysis, semáforo de cumplimiento, matriz visual y PDI." },
    ],
  }),
  component: EvaluacionCompetenciasPage,
});

// ─── Tipos internos ─────────────────────────────────────────────────────
type Cumplimiento = "" | "ok" | "parcial" | "no";
interface ReqRow { dim: string; req: string; act: string; cum: Cumplimiento; }
interface CompEval { t: "blanda" | "tecnica"; n: string; req: number; desc: string; act: number; obs: string; }
interface PlanItem {
  prio: 1 | 2 | 3;
  brecha: string; mod: string; det: string; prov: string; resp: string;
  ini: string; ven: string; av: number; evi: string;
  auto?: boolean;
}

// ─── Constantes visuales (paleta original del HTML) ─────────────────────
const C = {
  pri: "#0C4A6E", info: "#1E3A8A", ok: "#166534", okbg: "#dcfce7",
  danger: "#991b1b", dangerbg: "#fee2e2", warn: "#b45309", warnbg: "#fffbeb",
  infobg: "#dbeafe", muted: "#64748B", txt: "#1E293B",
  surf: "#F5F7FF", surf2: "#EEF2FF", bord: "#E0E7FF", acc: "#38BDF8",
  gold: "#C8973A",
};

// ─── Helpers ────────────────────────────────────────────────────────────
function buildCompsFromCargo(c: CargoMock): CompEval[] {
  const out: CompEval[] = [];
  c.competencias_blandas.forEach(b => out.push({ t: "blanda", n: b.nombre, req: nivelToNum(b.nivel) || 3, desc: b.desc, act: 0, obs: "" }));
  c.competencias_tecnicas.forEach(b => out.push({ t: "tecnica", n: b.nombre, req: nivelToNum(b.nivel) || 3, desc: b.desc, act: 0, obs: "" }));
  return out;
}
function buildInitialReqRows(c: CargoMock): ReqRow[] {
  const rows: ReqRow[] = [];
  const push = (dim: string, blk: string) =>
    splitReqItems(blk).forEach(req => rows.push({ dim, req, act: "", cum: "" }));
  push("Formación Académica", c.requisitos.educacion);
  push("Experiencia", c.requisitos.experiencia);
  push("Certificaciones / Idiomas", c.requisitos.otros);
  if (!rows.length) rows.push({ dim: "Requisito", req: "", act: "", cum: "" });
  return rows;
}
function gapPill(gap: number): { ic: string; bg: string; cl: string; lbl: string } {
  if (gap >= 3) return { ic: "🔴", bg: C.dangerbg, cl: C.danger, lbl: "Crítica" };
  if (gap === 2) return { ic: "🟡", bg: C.warnbg, cl: C.warn, lbl: "Media" };
  if (gap === 1) return { ic: "🔵", bg: C.infobg, cl: C.info, lbl: "Baja" };
  if (gap === 0) return { ic: "🟢", bg: C.okbg, cl: C.ok, lbl: "Cumple" };
  return { ic: "⭐", bg: "#fef3c7", cl: "#7a4f1a", lbl: "Supera" };
}
function planStatus(av: number, ven: string): { ic: string; lb: string } {
  const today = new Date(); today.setHours(0,0,0,0);
  if (av >= 100) return { ic: "🟢", lb: "Completado" };
  if (ven && new Date(ven) < today) return { ic: "🔴", lb: "Vencido" };
  if (ven) {
    const d = Math.floor((+new Date(ven) - +today) / 86400000);
    if (d <= 30 && av < 70) return { ic: "🟡", lb: "En riesgo" };
  }
  if (av > 0) return { ic: "🔵", lb: "Iniciado" };
  return { ic: "⚫", lb: "No iniciado" };
}

// ─── Componente principal ──────────────────────────────────────────────
function EvaluacionCompetenciasPage() {
  const cargo = CARGO_MOCK;

  const [colab, setColab] = useState("");
  const [evalBy, setEvalBy] = useState("");
  const [fecha, setFecha] = useState(new Date().toISOString().split("T")[0]);

  const [reqRows, setReqRows] = useState<ReqRow[]>(() => buildInitialReqRows(cargo));
  const [comps, setComps] = useState<CompEval[]>(() => buildCompsFromCargo(cargo));
  const [plan, setPlan] = useState<PlanItem[]>([]);

  // ── 8A · Semáforo agregado ───────────────────────────────────────────
  const semPerfil = useMemo(() => {
    const stats = reqRows.map(r => r.cum).filter(Boolean);
    if (!stats.length) return { color: C.surf2, txt: "Completa los indicadores de cumplimiento para ver el resultado" };
    const nos = stats.filter(s => s === "no").length;
    const pars = stats.filter(s => s === "parcial").length;
    if (nos >= 2) return { color: C.dangerbg, txt: "🔴 No cumple el perfil mínimo — 2 o más requisitos sin cumplir" };
    if (nos === 1 || pars >= 2) return { color: C.warnbg, txt: "🟡 Cumple parcialmente — 1 requisito crítico sin cumplir" };
    return { color: C.okbg, txt: "🟢 Cumple el perfil requerido para el cargo" };
  }, [reqRows]);

  // ── 8B · Índice global de cobertura ──────────────────────────────────
  const idx = useMemo(() => {
    let score = 0, total = 0, cnt = 0;
    comps.forEach(c => { if (c.act > 0) { score += Math.min(c.act, c.req); total += c.req; cnt++; } });
    return cnt ? Math.round((score / total) * 100) : null;
  }, [comps]);

  // ── Actualizar celdas ────────────────────────────────────────────────
  const updReq = (i: number, p: Partial<ReqRow>) => setReqRows(rs => rs.map((r, ix) => ix === i ? { ...r, ...p } : r));
  const addReq = () => setReqRows(rs => [...rs, { dim: "", req: "", act: "", cum: "" }]);
  const delReq = (i: number) => setReqRows(rs => rs.filter((_, ix) => ix !== i));

  const updComp = (i: number, p: Partial<CompEval>) => setComps(cs => cs.map((c, ix) => ix === i ? { ...c, ...p } : c));

  // ── Regenerar PDI ─────────────────────────────────────────────────────
  const regenPlan = () => {
    const auto: PlanItem[] = [];
    comps.forEach(c => {
      if (!c.act) return;
      const g = c.req - c.act;
      if (g <= 0) return;
      const prio: 1|2|3 = g >= 3 ? 3 : g === 2 ? 2 : 1;
      const mod = c.t === "blanda" ? (g >= 2 ? "Coaching ejecutivo" : "Mentoría interna") : "Capacitación técnica (curso, taller, seminario)";
      auto.push({
        prio, auto: true,
        brecha: `[Competencia ${c.t === "blanda" ? "Blanda" : "Técnica"}] ${c.n}: nivel actual ${c.act} (${NIVELES_LABEL[c.act]}) — requerido ${c.req} (${NIVELES_LABEL[c.req]})`,
        mod, det: "", prov: "", resp: "", ini: "", ven: "", av: 0, evi: "",
      });
    });
    reqRows.forEach(r => {
      if (r.cum !== "no" && r.cum !== "parcial") return;
      const prio: 1|2|3 = r.cum === "no" ? 3 : 2;
      auto.push({
        prio, auto: true,
        brecha: `[Requisito] ${r.dim || "Requisito"}: ${r.req}${r.cum === "no" ? " — ❌ No cumple" : " — 🟡 Cumplimiento parcial"}`,
        mod: "Formación académica", det: "", prov: "", resp: "", ini: "", ven: "", av: 0, evi: "",
      });
    });
    auto.sort((a, b) => b.prio - a.prio);
    // conserva ítems manuales existentes (los que no son auto)
    setPlan(prev => [...auto, ...prev.filter(p => !p.auto)]);
  };

  // auto-generar la primera vez que aparezca una brecha real
  useEffect(() => {
    if (plan.length === 0) {
      const hasGap = comps.some(c => c.act > 0 && c.req - c.act > 0) || reqRows.some(r => r.cum === "no" || r.cum === "parcial");
      if (hasGap) regenPlan();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [comps, reqRows]);

  const updPlan = (i: number, p: Partial<PlanItem>) => setPlan(ps => ps.map((it, ix) => ix === i ? { ...it, ...p } : it));
  const delPlan = (i: number) => setPlan(ps => ps.filter((_, ix) => ix !== i));
  const addPlan = () => setPlan(ps => [...ps, { prio: 1, brecha: "", mod: "", det: "", prov: "", resp: "", ini: "", ven: "", av: 0, evi: "" }]);

  const planSum = useMemo(() => {
    const s = { comp: 0, ini: 0, risk: 0, ven: 0, none: 0, tot: 0, avSum: 0 };
    plan.forEach(p => {
      const st = planStatus(p.av, p.ven);
      if (st.lb === "Completado") s.comp++;
      else if (st.lb === "Iniciado") s.ini++;
      else if (st.lb === "En riesgo") s.risk++;
      else if (st.lb === "Vencido") s.ven++;
      else s.none++;
      s.avSum += p.av; s.tot++;
    });
    return { ...s, gpct: s.tot ? Math.round(s.avSum / s.tot) : 0 };
  }, [plan]);

  // ═══════════════ RENDER ═══════════════════════════════════════════════
  return (
    <div style={{ maxWidth: 1200, margin: "0 auto", padding: "24px 20px", fontFamily: "system-ui, -apple-system, sans-serif", color: C.txt }}>
      {/* Hero */}
      <div style={{ background: `linear-gradient(135deg, ${C.pri} 0%, ${C.info} 60%, #312E81 100%)`, borderRadius: 16, padding: "28px 32px", color: "white", marginBottom: 24, position: "relative", overflow: "hidden" }}>
        <div style={{ display: "inline-flex", alignItems: "center", gap: 8, background: "rgba(255,255,255,.1)", border: "1px solid rgba(255,255,255,.15)", borderRadius: 20, padding: "6px 14px", fontSize: 11, fontWeight: 700, color: C.acc, textTransform: "uppercase", letterSpacing: ".1em", marginBottom: 12 }}>
          <span style={{ width: 6, height: 6, borderRadius: "50%", background: C.acc }} /> Módulo aislado · Preview
        </div>
        <h1 style={{ fontSize: 28, fontWeight: 900, margin: 0, letterSpacing: "-.02em" }}>Evaluación de Competencias &amp; PDI</h1>
        <p style={{ fontSize: 14, color: "rgba(255,255,255,.75)", marginTop: 6, marginBottom: 0 }}>
          Cargo demo: <b>{cargo.cargo}</b> · Área: {cargo.area} — datos <b>mock</b>, no conectados a la base real.
        </p>
      </div>

      {/* Identidad */}
      <div style={{ background: "white", border: `1px solid ${C.bord}`, borderRadius: 14, padding: 20, marginBottom: 20, display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 14 }}>
        <div><label style={LB}>Colaborador evaluado</label><input style={IN} value={colab} onChange={e => setColab(e.target.value)} placeholder="Nombre completo" /></div>
        <div><label style={LB}>Evaluador</label><input style={IN} value={evalBy} onChange={e => setEvalBy(e.target.value)} placeholder="Nombre del evaluador" /></div>
        <div><label style={LB}>Fecha</label><input style={IN} type="date" value={fecha} onChange={e => setFecha(e.target.value)} /></div>
      </div>

      {/* ─── SECCIÓN 8A ─── */}
      <Sec num="8A" title="Perfil de Requisitos del Cargo">
        <div style={{ overflowX: "auto" }}>
          <table style={TBL}>
            <thead>
              <tr>
                <Th style={{ width: 200 }}>Dimensión</Th>
                <Th>Requisito del cargo</Th>
                <Th>Perfil del colaborador</Th>
                <Th style={{ width: 170, textAlign: "center" }}>Cumplimiento</Th>
                <Th style={{ width: 40 }}></Th>
              </tr>
            </thead>
            <tbody>
              {reqRows.map((r, i) => {
                const sem = r.cum === "ok" ? "✅" : r.cum === "parcial" ? "🟡" : r.cum === "no" ? "❌" : "⬜";
                return (
                  <tr key={i} style={i % 2 ? { background: C.surf } : undefined}>
                    <Td><input style={{ ...IN, fontWeight: 700, color: C.pri }} value={r.dim} onChange={e => updReq(i, { dim: e.target.value })} placeholder="Dimensión" /></Td>
                    <Td><textarea style={{ ...IN, minHeight: 46, resize: "vertical" }} value={r.req} onChange={e => updReq(i, { req: e.target.value })} placeholder="Requisito del cargo" /></Td>
                    <Td><textarea style={{ ...IN, minHeight: 46, resize: "vertical" }} value={r.act} onChange={e => updReq(i, { act: e.target.value })} placeholder="Perfil real del colaborador" /></Td>
                    <Td style={{ textAlign: "center" }}>
                      <select style={{ ...IN, textAlign: "center" }} value={r.cum} onChange={e => updReq(i, { cum: e.target.value as Cumplimiento })}>
                        <option value="">— Seleccionar —</option>
                        <option value="ok">Cumple</option>
                        <option value="parcial">Parcial</option>
                        <option value="no">No cumple</option>
                      </select>
                      <div style={{ fontSize: 18, marginTop: 4 }}>{sem}</div>
                    </Td>
                    <Td style={{ textAlign: "center" }}>
                      <button onClick={() => delReq(i)} style={DEL_BTN} title="Eliminar">✕</button>
                    </Td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
        <div style={{ display: "flex", gap: 10, marginTop: 12, alignItems: "center" }}>
          <button onClick={addReq} style={{ ...BTN, background: C.pri, color: "white" }}>+ Añadir requisito</button>
        </div>
        <div style={{ marginTop: 16, background: semPerfil.color, borderRadius: 12, padding: "14px 18px", fontWeight: 700, color: C.txt, border: `1px solid ${C.bord}` }}>
          {semPerfil.txt}
        </div>
      </Sec>

      {/* ─── SECCIÓN 8B ─── */}
      <Sec num="8B" title="Competencias y GAP Analysis">
        <div style={{ overflowX: "auto" }}>
          <table style={TBL}>
            <thead>
              <tr>
                <Th>Competencia</Th>
                <Th style={{ width: 70 }}>Tipo</Th>
                <Th style={{ width: 70, textAlign: "center" }}>Req.</Th>
                <Th style={{ width: 150 }}>Actual</Th>
                <Th style={{ width: 60, textAlign: "center" }}>GAP</Th>
                <Th style={{ width: 180 }}>Cobertura visual</Th>
                <Th style={{ width: 110 }}>Prioridad</Th>
              </tr>
            </thead>
            <tbody>
              {comps.map((c, i) => {
                const isB = c.t === "blanda";
                const gap = c.act > 0 ? c.req - c.act : null;
                const pill = gap !== null ? gapPill(gap) : null;
                const barColor = gap === null ? C.bord : gap >= 3 ? C.danger : gap === 2 ? "#f59e0b" : gap === 1 ? C.info : gap === 0 ? C.ok : C.acc;
                return (
                  <tr key={i}>
                    <Td>
                      <div style={{ fontWeight: 700, color: isB ? C.ok : C.info }}>{c.n}</div>
                      <div style={{ fontSize: 11, color: C.muted, marginTop: 3 }}>{c.desc}</div>
                    </Td>
                    <Td>
                      <span style={{ ...PILL, background: isB ? "#f0fdf4" : "#eff6ff", color: isB ? C.ok : C.info }}>{isB ? "Blanda" : "Técnica"}</span>
                    </Td>
                    <Td style={{ textAlign: "center", fontWeight: 900 }}>
                      {c.req}
                      <div style={{ fontSize: 9, color: C.muted, fontWeight: 400 }}>{NIVELES_LABEL[c.req]}</div>
                    </Td>
                    <Td>
                      <select style={IN} value={c.act} onChange={e => updComp(i, { act: parseInt(e.target.value) || 0 })}>
                        <option value={0}>— sin eval —</option>
                        {[1,2,3,4,5].map(n => <option key={n} value={n}>{n} · {NIVELES_LABEL[n]}</option>)}
                      </select>
                    </Td>
                    <Td style={{ textAlign: "center", fontWeight: 900, color: gap === null ? C.muted : gap > 0 ? C.warn : gap < 0 ? C.ok : C.info }}>
                      {gap === null ? "—" : gap > 0 ? `+${gap}` : String(gap)}
                    </Td>
                    <Td>
                      <div style={{ position: "relative", width: "100%", background: C.surf2, borderRadius: 20, height: 10, overflow: "hidden" }}>
                        <div style={{ position: "absolute", inset: 0, width: `${c.req * 20}%`, background: "rgba(200,151,58,.3)", borderRadius: 20 }} />
                        <div style={{ position: "absolute", top: 0, left: 0, height: "100%", width: `${c.act * 20}%`, background: barColor, borderRadius: 20, transition: ".3s" }} />
                      </div>
                    </Td>
                    <Td>{pill ? <span style={{ ...PILL, background: pill.bg, color: pill.cl }}>{pill.ic} {pill.lbl}</span> : "—"}</Td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
        {/* Índice global */}
        <div style={{ marginTop: 16, background: C.surf, border: `1px solid ${C.bord}`, borderRadius: 12, padding: "14px 18px", display: "flex", alignItems: "center", gap: 14 }}>
          <div style={{ fontSize: 13, fontWeight: 700, color: C.pri }}>Índice global de cobertura:</div>
          <div style={{ flex: 1, background: C.surf2, height: 12, borderRadius: 20, overflow: "hidden" }}>
            <div style={{ width: idx !== null ? `${idx}%` : "0%", height: "100%", background: idx === null ? C.bord : idx >= 80 ? C.ok : idx >= 60 ? "#f59e0b" : C.danger, transition: ".3s" }} />
          </div>
          <div style={{ fontSize: 20, fontWeight: 900, color: idx === null ? C.muted : idx >= 80 ? C.ok : idx >= 60 ? "#f59e0b" : C.danger, minWidth: 70, textAlign: "right" }}>
            {idx !== null ? `${idx}%` : "—"}
          </div>
        </div>
      </Sec>

      {/* ─── SECCIÓN 9 · PDI ─── */}
      <Sec num="9" title="Plan de Desarrollo Individual (PDI)">
        <div style={{ display: "flex", gap: 10, marginBottom: 14, flexWrap: "wrap" }}>
          <button onClick={regenPlan} style={{ ...BTN, background: C.gold, color: "white" }}>🔄 Regenerar plan desde brechas</button>
          <button onClick={addPlan} style={{ ...BTN, background: C.pri, color: "white" }}>+ Añadir acción manual</button>
        </div>

        {plan.length === 0 ? (
          <div style={{ textAlign: "center", padding: 30, color: C.muted, background: C.surf, borderRadius: 12, border: `1px dashed ${C.bord}` }}>
            Evalúa competencias y requisitos para generar automáticamente el plan de desarrollo.
          </div>
        ) : (
          <div style={{ overflowX: "auto" }}>
            <table style={{ ...TBL, fontSize: 12 }}>
              <thead>
                <tr>
                  <Th style={{ width: 42 }}></Th>
                  <Th style={{ width: 110 }}>Prio.</Th>
                  <Th>Brecha</Th>
                  <Th style={{ width: 170 }}>Modalidad</Th>
                  <Th>Detalle acción</Th>
                  <Th style={{ width: 130 }}>Responsable</Th>
                  <Th style={{ width: 130 }}>Inicio</Th>
                  <Th style={{ width: 130 }}>Vence</Th>
                  <Th style={{ width: 150 }}>Avance</Th>
                  <Th style={{ width: 130 }}>Evidencia</Th>
                  <Th style={{ width: 40 }}></Th>
                </tr>
              </thead>
              <tbody>
                {plan.map((p, i) => {
                  const st = planStatus(p.av, p.ven);
                  const prioCol = p.prio === 3 ? { bg: C.dangerbg, cl: C.danger, lb: "🔴 Crítico" }
                    : p.prio === 2 ? { bg: C.warnbg, cl: C.warn, lb: "🟡 Medio" }
                    : { bg: C.infobg, cl: C.info, lb: "🔵 Bajo" };
                  return (
                    <tr key={i}>
                      <Td style={{ fontSize: 18, textAlign: "center" }}>{st.ic}</Td>
                      <Td>
                        <select style={IN} value={p.prio} onChange={e => updPlan(i, { prio: parseInt(e.target.value) as 1|2|3 })}>
                          <option value={3}>🔴 Crítico</option>
                          <option value={2}>🟡 Medio</option>
                          <option value={1}>🔵 Bajo</option>
                        </select>
                        <div style={{ ...PILL, background: prioCol.bg, color: prioCol.cl, marginTop: 4, display: "inline-block" }}>{prioCol.lb}</div>
                      </Td>
                      <Td><textarea style={{ ...IN, minHeight: 60, resize: "vertical" }} value={p.brecha} onChange={e => updPlan(i, { brecha: e.target.value })} placeholder="Descripción de la brecha" /></Td>
                      <Td>
                        <select style={IN} value={p.mod} onChange={e => updPlan(i, { mod: e.target.value })}>
                          <option value="">—</option>
                          {MODALIDADES.map(m => <option key={m} value={m}>{m}</option>)}
                        </select>
                      </Td>
                      <Td><textarea style={{ ...IN, minHeight: 60, resize: "vertical" }} value={p.det} onChange={e => updPlan(i, { det: e.target.value })} placeholder="Detalle de acción" /></Td>
                      <Td><input style={IN} value={p.resp} onChange={e => updPlan(i, { resp: e.target.value })} placeholder="Responsable" /></Td>
                      <Td><input type="date" style={IN} value={p.ini} onChange={e => updPlan(i, { ini: e.target.value })} /></Td>
                      <Td><input type="date" style={IN} value={p.ven} onChange={e => updPlan(i, { ven: e.target.value })} /></Td>
                      <Td>
                        <input type="range" min={0} max={100} value={p.av} onChange={e => updPlan(i, { av: parseInt(e.target.value) })} style={{ width: "100%" }} />
                        <div style={{ textAlign: "center", fontSize: 11, fontWeight: 700, color: C.pri }}>{p.av}% · {st.lb}</div>
                      </Td>
                      <Td><input style={IN} value={p.evi} onChange={e => updPlan(i, { evi: e.target.value })} placeholder="Evidencia" /></Td>
                      <Td style={{ textAlign: "center" }}><button onClick={() => delPlan(i)} style={DEL_BTN}>✕</button></Td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}

        {plan.length > 0 && (
          <div style={{ marginTop: 16, background: C.surf, border: `1px solid ${C.bord}`, borderRadius: 12, padding: "12px 16px", display: "flex", gap: 14, flexWrap: "wrap", alignItems: "center", fontSize: 12 }}>
            <div>🟢 Completados: <b>{planSum.comp}</b></div>
            <div>🔵 Iniciados: <b>{planSum.ini}</b></div>
            <div>🟡 En riesgo: <b>{planSum.risk}</b></div>
            <div>🔴 Vencidos: <b>{planSum.ven}</b></div>
            <div>⚫ Sin iniciar: <b>{planSum.none}</b></div>
            <div style={{ display: "flex", alignItems: "center", gap: 8, flex: 1, minWidth: 220, color: C.pri, fontWeight: 700 }}>
              Avance global:
              <div style={{ flex: 1, background: C.surf2, height: 10, borderRadius: 20, overflow: "hidden" }}>
                <div style={{ width: `${planSum.gpct}%`, height: "100%", background: planSum.gpct >= 80 ? C.ok : planSum.gpct >= 50 ? "#f59e0b" : C.info }} />
              </div>
              <b>{planSum.gpct}%</b>
            </div>
          </div>
        )}
      </Sec>

      <div style={{ textAlign: "center", fontSize: 11, color: C.muted, marginTop: 30 }}>
        Módulo aislado · Datos mock · No persiste en base de datos · v0.1
      </div>
    </div>
  );
}

// ─── Sub-componentes de layout ─────────────────────────────────────────
function Sec({ num, title, children }: { num: string; title: string; children: React.ReactNode }) {
  return (
    <section style={{ background: "white", border: `1px solid ${C.bord}`, borderRadius: 16, padding: "20px 24px", marginBottom: 20, boxShadow: "0 2px 8px rgba(15,23,42,.03)" }}>
      <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 18 }}>
        <div style={{ width: 44, height: 44, borderRadius: 10, background: `linear-gradient(135deg, ${C.pri}, ${C.info})`, color: "white", display: "grid", placeItems: "center", fontWeight: 900, fontSize: 15 }}>{num}</div>
        <h2 style={{ margin: 0, fontSize: 18, fontWeight: 800, color: C.pri, letterSpacing: "-.01em" }}>{title}</h2>
      </div>
      {children}
    </section>
  );
}

// ─── Estilos inline reusables ──────────────────────────────────────────
const TBL: React.CSSProperties = { width: "100%", borderCollapse: "collapse", fontSize: 13 };
const Th = (p: React.ThHTMLAttributes<HTMLTableCellElement>) => (
  <th {...p} style={{ background: C.pri, color: "white", padding: "8px 10px", textAlign: "left", fontSize: 10, fontWeight: 800, textTransform: "uppercase", letterSpacing: ".5px", ...p.style }} />
);
const Td = (p: React.TdHTMLAttributes<HTMLTableCellElement>) => (
  <td {...p} style={{ padding: "10px", borderBottom: `1px solid ${C.bord}`, verticalAlign: "top", ...p.style }} />
);
const IN: React.CSSProperties = { width: "100%", padding: "7px 10px", border: `1px solid ${C.bord}`, borderRadius: 8, fontSize: 12, fontFamily: "inherit", color: C.txt, background: "white", outline: "none" };
const LB: React.CSSProperties = { fontSize: 11, fontWeight: 700, color: C.muted, marginBottom: 6, display: "block", textTransform: "uppercase", letterSpacing: ".05em" };
const BTN: React.CSSProperties = { padding: "10px 16px", borderRadius: 10, border: "none", cursor: "pointer", fontSize: 13, fontWeight: 700 };
const DEL_BTN: React.CSSProperties = { background: "none", border: "none", cursor: "pointer", color: "#ef4444", fontSize: 15 };
const PILL: React.CSSProperties = { display: "inline-block", padding: "3px 10px", borderRadius: 20, fontSize: 10, fontWeight: 800 };
