// Utilidades de import/export para workbooks LEE.
// - exportJSON: descarga { schema, respuestas, meta } en .json
// - importJSON: lee un .json y valida que coincida con el schema
// - exportHTML: genera un HTML autocontenido editable offline,
//   con botón que descarga las respuestas como JSON para re-importar.

import type { WorkbookSchema } from "./lee-workbook-schemas";

export interface WorkbookExport {
  formato: "lee-workbook-v1";
  sesionKey: string;
  titulo: string;
  exportadoEn: string;
  respuestas: Record<string, unknown>;
}

function download(filename: string, content: string, mime: string) {
  const blob = new Blob([content], { type: mime });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

function slug(s: string) {
  return s.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "").slice(0, 60);
}

export function exportWorkbookJSON(schema: WorkbookSchema, respuestas: Record<string, unknown>) {
  const payload: WorkbookExport = {
    formato: "lee-workbook-v1",
    sesionKey: schema.sesionKey,
    titulo: schema.titulo,
    exportadoEn: new Date().toISOString(),
    respuestas,
  };
  download(`lee-${schema.sesionKey}-${slug(schema.titulo)}.json`, JSON.stringify(payload, null, 2), "application/json");
}

export async function importWorkbookJSON(file: File, schema: WorkbookSchema): Promise<Record<string, unknown>> {
  const text = await file.text();
  let parsed: unknown;
  try { parsed = JSON.parse(text); }
  catch { throw new Error("El archivo no es un JSON válido."); }

  const obj = parsed as Partial<WorkbookExport>;
  if (obj?.formato !== "lee-workbook-v1") throw new Error("Formato no reconocido (se esperaba lee-workbook-v1).");
  if (obj.sesionKey && obj.sesionKey !== schema.sesionKey) {
    throw new Error(`Este archivo es de la sesión ${obj.sesionKey}, no de ${schema.sesionKey}.`);
  }
  if (!obj.respuestas || typeof obj.respuestas !== "object") throw new Error("No se encontraron respuestas en el archivo.");
  return obj.respuestas as Record<string, unknown>;
}

// --------- Export HTML editable autocontenido ---------

export function exportWorkbookHTML(schema: WorkbookSchema, respuestas: Record<string, unknown>) {
  const html = renderHTML(schema, respuestas);
  download(`lee-${schema.sesionKey}-${slug(schema.titulo)}.html`, html, "text/html");
}

function escapeHTML(s: string) {
  return s.replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]!));
}

function renderHTML(schema: WorkbookSchema, respuestas: Record<string, unknown>) {
  const seccionesHTML = schema.secciones.map((sec) => {
    const camposHTML = sec.campos.map((c) => {
      const k = `${sec.id}.${c.id}`;
      const v = respuestas[k];
      const label = `<label class="lbl">${escapeHTML(c.label)}${c.requerido ? ' <span style="color:#dc2626">*</span>' : ""}</label>`;
      const help = c.ayuda ? `<p class="help">${escapeHTML(c.ayuda)}</p>` : "";
      let input = "";
      switch (c.type) {
        case "text":
          input = `<input type="text" data-k="${k}" value="${escapeHTML((v as string) ?? "")}" placeholder="${escapeHTML(c.placeholder ?? "")}" />`;
          break;
        case "textarea":
          input = `<div contenteditable="true" data-k="${k}" data-type="html" class="rt">${escapeHTML((v as string) ?? "")}</div>`;
          break;
        case "lista": {
          const items = ((v as string[]) ?? []).map((it) => `<li>${escapeHTML(it)}</li>`).join("");
          input = `<ul contenteditable="true" data-k="${k}" data-type="lista" class="rt">${items || "<li></li>"}</ul>`;
          break;
        }
        case "escala": {
          const items = c.items ?? [{ id: "_v", texto: "" }];
          const range = Array.from({ length: c.max - c.min + 1 }, (_, i) => c.min + i);
          const vv = (v as Record<string, number>) ?? {};
          input = `<div data-k="${k}" data-type="escala">` + items.map((it) => `
            <div class="row"><span>${escapeHTML(it.texto)}</span>
              ${range.map((n) => `<label class="rb"><input type="radio" name="${k}-${it.id}" value="${n}" ${vv[it.id] === n ? "checked" : ""} data-item="${it.id}"/>${n}</label>`).join("")}
            </div>`).join("") + `</div>`;
          break;
        }
        case "semaforo": {
          const vv = (v as { color?: string; nota?: string }) ?? {};
          input = `<div data-k="${k}" data-type="semaforo">
            <select name="${k}-color">
              <option value="">—</option>
              <option value="verde" ${vv.color === "verde" ? "selected" : ""}>🟢 Verde</option>
              <option value="ambar" ${vv.color === "ambar" ? "selected" : ""}>🟡 Ámbar</option>
              <option value="rojo" ${vv.color === "rojo" ? "selected" : ""}>🔴 Rojo</option>
            </select>
            <textarea name="${k}-nota" placeholder="Justificación…">${escapeHTML(vv.nota ?? "")}</textarea>
          </div>`;
          break;
        }
        case "tabla": {
          const filas = ((v as Record<string, string>[]) ?? []);
          const numFilas = Math.max(filas.length, c.minFilas ?? 1);
          const head = `<tr>${c.columnas.map((col) => `<th>${escapeHTML(col.label)}</th>`).join("")}</tr>`;
          const body = Array.from({ length: numFilas }, (_, i) =>
            `<tr>${c.columnas.map((col) => `<td><textarea data-col="${col.id}" placeholder="${escapeHTML(col.placeholder ?? "")}">${escapeHTML(filas[i]?.[col.id] ?? "")}</textarea></td>`).join("")}</tr>`).join("");
          input = `<table data-k="${k}" data-type="tabla" class="tbl"><thead>${head}</thead><tbody>${body}</tbody></table>
            <button type="button" class="addrow">+ Agregar fila</button>`;
          break;
        }
        case "opcion": {
          input = `<div data-k="${k}" data-type="opcion">` + c.opciones.map((o) =>
            `<label class="opt"><input type="radio" name="${k}" value="${escapeHTML(o.value)}" ${v === o.value ? "checked" : ""}/> <b>${escapeHTML(o.label)}</b>${o.descripcion ? ` — <span class="muted">${escapeHTML(o.descripcion)}</span>` : ""}</label>`).join("") + `</div>`;
          break;
        }
      }
      return `<div class="campo">${label}${help}${input}</div>`;
    }).join("");

    return `<section class="sec">
      <h2>${escapeHTML(sec.titulo)}${sec.moduloRef ? ` <small>(Mód. ${escapeHTML(sec.moduloRef)})</small>` : ""}</h2>
      ${sec.descripcion ? `<p class="desc">${escapeHTML(sec.descripcion)}</p>` : ""}
      ${sec.preguntaCoaching ? `<blockquote>${escapeHTML(sec.preguntaCoaching)}</blockquote>` : ""}
      ${camposHTML}
    </section>`;
  }).join("");

  return `<!doctype html>
<html lang="es"><head><meta charset="utf-8"/>
<title>LEE · ${escapeHTML(schema.titulo)}</title>
<style>
  body{font-family:system-ui,-apple-system,sans-serif;max-width:920px;margin:2rem auto;padding:0 1.5rem;color:#0f172a;line-height:1.5}
  h1{font-size:1.5rem;border-bottom:3px solid #c9a84c;padding-bottom:.5rem}
  h2{font-size:1.1rem;color:#0f1b3d;margin-top:1.5rem}
  small{font-weight:400;color:#64748b}
  .meta{background:#f8fafc;border-left:3px solid #c9a84c;padding:.75rem 1rem;font-size:.85rem;margin:1rem 0}
  .sec{border:1px solid #e2e8f0;border-radius:8px;padding:1rem 1.25rem;margin:1rem 0;background:#fff}
  .campo{margin:1rem 0}
  .lbl{display:block;font-weight:600;font-size:.85rem;margin-bottom:.25rem}
  .help{font-size:.75rem;color:#64748b;margin:.1rem 0 .35rem}
  .desc{font-size:.8rem;color:#475569}
  blockquote{background:#f1f5f9;border-left:3px solid #c9a84c;margin:.5rem 0;padding:.5rem .75rem;font-style:italic;font-size:.85rem}
  input[type=text],textarea,select{width:100%;border:1px solid #cbd5e1;border-radius:6px;padding:.5rem;font:inherit}
  textarea{min-height:60px;resize:vertical}
  .rt{border:1px solid #cbd5e1;border-radius:6px;padding:.5rem;min-height:80px;background:#fff}
  .rt:focus{outline:2px solid #c9a84c;outline-offset:1px}
  .row{display:flex;align-items:center;gap:.5rem;border:1px solid #e2e8f0;padding:.4rem;border-radius:6px;margin:.25rem 0;font-size:.85rem}
  .row span{flex:1}
  .rb{font-size:.8rem;display:flex;align-items:center;gap:.2rem}
  .tbl{width:100%;border-collapse:collapse;margin-top:.25rem}
  .tbl th,.tbl td{border:1px solid #e2e8f0;padding:.25rem;vertical-align:top}
  .tbl th{background:#f8fafc;font-size:.75rem;text-align:left}
  .tbl textarea{min-height:40px;border:none;padding:.25rem}
  .addrow{margin-top:.4rem;font-size:.75rem;padding:.3rem .6rem;border:1px solid #cbd5e1;background:#fff;border-radius:6px;cursor:pointer}
  .opt{display:block;border:1px solid #e2e8f0;padding:.5rem;margin:.25rem 0;border-radius:6px;font-size:.85rem;cursor:pointer}
  .muted{color:#64748b}
  .bar{position:sticky;top:0;background:#0f1b3d;color:#fff;padding:.75rem 1rem;border-radius:8px;display:flex;justify-content:space-between;align-items:center;margin-bottom:1rem;z-index:10}
  .btn{background:#c9a84c;color:#0f1b3d;border:none;padding:.5rem 1rem;border-radius:6px;font-weight:600;cursor:pointer}
  .btn:hover{background:#b89a40}
</style>
</head><body>
<div class="bar">
  <div><b>LEE Workbook</b> · ${escapeHTML(schema.titulo)}</div>
  <button class="btn" id="dl">⬇ Descargar respuestas (JSON)</button>
</div>
<div class="meta">
  <b>Propósito:</b> ${escapeHTML(schema.proposito)}<br/>
  <small>Sesión ${escapeHTML(schema.sesionKey)} · Llena este formulario offline y descarga el JSON para importarlo a la plataforma.</small>
</div>
${seccionesHTML}
<script>
const SESION_KEY = ${JSON.stringify(schema.sesionKey)};
const TITULO = ${JSON.stringify(schema.titulo)};

// Agregar filas dinámicas
document.querySelectorAll('.addrow').forEach(b => b.onclick = () => {
  const tbl = b.previousElementSibling;
  const cols = tbl.querySelectorAll('thead th').length;
  const tr = document.createElement('tr');
  const cIds = Array.from(tbl.querySelectorAll('tbody tr:first-child td textarea')).map(t => t.dataset.col);
  for (let i=0;i<cols;i++) {
    const td = document.createElement('td');
    const ta = document.createElement('textarea');
    ta.dataset.col = cIds[i] || '';
    td.appendChild(ta);
    tr.appendChild(td);
  }
  tbl.querySelector('tbody').appendChild(tr);
});

function recolectar() {
  const r = {};
  document.querySelectorAll('[data-k]').forEach(el => {
    const k = el.dataset.k;
    const t = el.dataset.type;
    if (!t) { r[k] = el.value; return; }
    if (t === 'html') { r[k] = el.innerHTML; return; }
    if (t === 'lista') {
      r[k] = Array.from(el.querySelectorAll('li')).map(li => li.textContent.trim()).filter(Boolean);
      return;
    }
    if (t === 'escala') {
      const obj = {};
      el.querySelectorAll('input[type=radio]:checked').forEach(i => { obj[i.dataset.item] = Number(i.value); });
      r[k] = obj; return;
    }
    if (t === 'semaforo') {
      r[k] = {
        color: el.querySelector('select').value || undefined,
        nota: el.querySelector('textarea').value || '',
      };
      return;
    }
    if (t === 'tabla') {
      const filas = [];
      el.querySelectorAll('tbody tr').forEach(tr => {
        const fila = {};
        tr.querySelectorAll('textarea').forEach(ta => { if (ta.value) fila[ta.dataset.col] = ta.value; });
        if (Object.keys(fila).length) filas.push(fila);
      });
      r[k] = filas; return;
    }
    if (t === 'opcion') {
      const sel = el.querySelector('input[type=radio]:checked');
      r[k] = sel ? sel.value : ''; return;
    }
  });
  return r;
}

document.getElementById('dl').onclick = () => {
  const payload = {
    formato: 'lee-workbook-v1',
    sesionKey: SESION_KEY,
    titulo: TITULO,
    exportadoEn: new Date().toISOString(),
    respuestas: recolectar(),
  };
  const blob = new Blob([JSON.stringify(payload, null, 2)], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url; a.download = 'lee-' + SESION_KEY + '-respuestas.json';
  a.click();
  URL.revokeObjectURL(url);
};
</script>
</body></html>`;
}
