# A360SGP — Roadmap de experiencia de cliente

*Documento vivo de seguimiento. Actualizar después de cada sesión de trabajo.*

---

## ✅ COMPLETADO

- **Aurora V2 (vista cliente) — Plan Estratégico**: hero, nav 2 tabs, stats, tabla de clientes. Commit `44db438` en producción.
- **Aurora V2 (vista cliente) — Coaching**: ya tenía hero completo, confirmado en capturas.
- **Aurora V2 (vista cliente) — Marketing Digital**: ya tenía tratamiento visual rico, confirmado en capturas.
- **Breadcrumb de navegación** (los 6 módulos de cliente): `Inicio › Empresa › Módulo › Sub-sección`, con color de acento por módulo. Commit `44db438` en producción. Confirmado funcionando en capturas reales (SIDE, Plan, Coaching, LEE).

---

## 🔴 PENDIENTE — Visual (Aurora V2 en vista cliente)

Confirmado con capturas reales que estos módulos NO tienen el tratamiento Aurora V2 en la vista de cliente, aunque el admin sí lo tiene:

1. **SIDE (cliente)** — fondo blanco plano, sin hero, sin color de marca. Prioridad alta: es el módulo de mayor uso.
2. **Programa LEE (cliente)** — fondo blanco plano, tarjetas de capítulo sin hero.
3. **Manual de Funciones (cliente)** — solo una barra azul delgada con el título, sin el hero rico que tiene el admin (con organigrama ilustrado).
4. **Resumen (cliente)** — no confirmado visualmente aún, pero el diagnóstico de código lo marcó como "Sistema viejo". Pendiente de verificar con captura.
5. **Onboarding (cliente)** — marcado como "Sistema viejo" en el diagnóstico. Menor prioridad (uso único).

---

## 🔴 PENDIENTE — Navegación / flujo (bugs reportados)

### SIDE — bug crítico reportado por Antonio (13/8/2026) — DIAGNOSTICADO, PENDIENTE DE FIX

**Causa raíz confirmada (3 síntomas, código revisado):**
1. Botón "Nuevo SIDE" en vista cliente (`app.clientes.$clienteId.side.tsx:77,128`) enlaza a `/app/side` (ruta de consultor). El sistema de permisos en `app.tsx` detecta que un rol cliente no puede estar ahí y lo redirige silenciosamente a `/resumen` — el botón "parece" no responder.
2. El "hero duplicado" no es un bug de renderizado: es la pantalla de consultor (`app.side.tsx`, componente `TabSide`) que muestra un hero + un formulario con el mismo título "Nueva sesión de diagnóstico" apilados, con el botón de submit deshabilitado hasta elegir cliente. Un cliente real nunca debería llegar ahí.
3. El sidebar vacío antes de seleccionar cliente es por 4 queries en cadena a Supabase (`empresa_usuarios → clientes → planes → plan_modulos`) en `AppSidebar.tsx:107-142` — no es un bug, es un estado de carga visible por la cantidad de roundtrips.

**Decisión de producto (13/8/2026, confirmada con Antonio):**
- Todos los niveles de licencia (esencial, profesional, corporativo, premium) pueden **iniciar y completar** su propio diagnóstico SIDE — sirve como gancho de enganche con la plataforma.
- Al completar, los resultados NO se muestran abiertos de inmediato. Estado: *"Diagnóstico completado — tu consultor lo está revisando"*.
- El consultor recibe notificación, revisa, y desbloquea la vista completa para el cliente — posiblemente con un campo de comentario/contexto que el consultor agrega antes de que el cliente vea los números.
- Razón: los acrónimos (IME, IVEE, IDF, COF) sin interpretación experta confunden y no aportan valor al cliente; la interpretación es parte del servicio de consultoría, no solo el dato crudo.

**Etapa 1 — COMPLETADA (14/8/2026):**
- Migración 1 (`20260814011155`): 4 campos nuevos en `side_sesiones` + trigger `BEFORE INSERT OR UPDATE` con validación de rol cliente.
- Migración 2 (`20260814012000`): backfill de datos históricos (`completada=true → estado_revision='revisado'`) — confirmado noop en producción (0 filas, las 9 sesiones existentes tienen `completada=false`).
- `ScaleButtons` extraído a `src/components/side/ScaleButtons.tsx` con prop `readOnly`, reutilizado en consultor y cliente sin duplicar código. Verificado píxel a píxel contra el original.
- `app.clientes.$clienteId.side.tsx` reescrito completo: flujo `iniciarNuevo → cuestionario editable (220 preguntas, autosave 30s) → enviar para revisión`. `abrirCuestionario` distingue correctamente: borrador editable (sesión propia sin completar) vs. borrador histórico pre-migración (readOnly) vs. pendiente_revision vs. revisado.
- Los 3 links rotos a `/app/side` fueron eliminados por completo — verificado explícitamente (cero instancias).
- Typecheck limpio, sin errores nuevos introducidos.

### SIDE — vista de consultor: rediseño del inicio de sesión (Síntoma 2, pendiente desde el diagnóstico original)

**Feedback de Antonio (14/8/2026):** al entrar a SIDE desde el sidebar (rol consultor), la pantalla principal debe mostrar la vista general del programa + menú superior de navegación (esto ya existe). El problema es el flujo de inicio de una nueva sesión:
- El botón actual "+ Nueva sesión de diagnóstico" debería renombrarse a algo más claro sobre su acción real (ej. "Ingresar cliente a SIDE").
- Al hacer clic, el bloque de selección de empresa + fecha debería activarse **dentro del hero mismo** (visible sin scroll) — no debajo, donde muchos consultores no van a desplazarse a buscarlo.
- El botón para confirmar e iniciar el diagnóstico (que lleva a la pestaña Dimensiones) debe ser visualmente prominente dentro de ese bloque.
- Causa raíz coincide con el Síntoma 2 ya diagnosticado: hero + formulario apilados con el mismo título, sin integración visual real.

**Estado:** pendiente de diseño e implementación.

**Pendiente para Etapa 2 (cliente):**
- Panel de consultor para revisar y desbloquear sesiones `pendiente_revision` (con campo de comentario).
- Estado B visual para el cliente (resultados bloqueados con candado + banner de espera) y Estado C (resultados + comentario del consultor visible).
- Alerta `side_pendiente_revision` en el sistema de notificaciones existente + ícono en `NotificacionesBell.tsx`.
- Reemplazar `confirm()` nativo en "Enviar para revisión" por `AlertDialog` de shadcn (conecta con Problema E del diagnóstico original).
- Verificar visualmente en producción (no solo typecheck) antes de dar la Etapa 1 por cerrada del todo.

### Plan Estratégico — pendientes del diagnóstico original (aún no atacados, breadcrumb ya resuelve parte de B)
- **Problema A**: sin camino claro de entrada al trabajo post-login (Resumen es una ficha de datos, no un panel de acción).
- **Problema C**: onboarding no es automático, sin ayuda contextual en los módulos.
- **Problema E**: autosave solo existe en Plan Estratégico; el resto de módulos (SIDE, Coaching, LEE) usa guardado manual sin confirmación visual persistente; sin función de deshacer; `confirm()` nativo del navegador como única salvaguarda en SIDE.
- **Problema F** (CRÍTICO — lenguaje técnico sin contexto): términos como IME, IVEE, IDF, COF, PESTEL, FODA+CAME, BSC aparecen sin explicación para un cliente sin background de consultoría.

---

## 🟡 EN DISCUSIÓN / por decidir

- Orden de ataque: ¿arreglar primero el botón roto de SIDE (bug funcional, bloquea uso) o continuar con Aurora V2 visual?
- Criterio de nomenclatura para Problema F (glosario inline vs. renombrar secciones) — pendiente de decidir con Antonio antes de pasar a código.

---

## 🔵 DECISIÓN ESTRATÉGICA MAYOR (14/8/2026) — Reemplaza el enfoque anterior de "rediseño módulo por módulo"

**Decisión de Antonio:** en vez de seguir construyendo vistas de cliente simplificadas y separadas (el enfoque usado hasta ahora en Plan Estratégico, Coaching, y la Etapa 1 de SIDE), el cliente debe tener acceso al **mismo contenido rico que usa el consultor** en todos los módulos — mismo nivel de detalle, metodología, y storytelling visual. Lo que se oculta NO es el contenido en general, sino específicamente: análisis de interpretación, semáforos, recomendaciones, y Análisis IA — el valor que se entrega en consultoría, no un producto de autoservicio completo.

**Aplica a TODOS los módulos**, incluyendo Plan Estratégico y Coaching (ya migrados hoy con un diseño de cliente propio) — Antonio considera que incluso esas versiones siguen siendo "muy básicas" comparadas con lo que ve el consultor.

**Riesgos identificados que deben resolverse ANTES de implementar (no opcionales):**
1. **Conflicto con el flujo de revisión de SIDE recién construido**: el gating de contenido (interpretación/IA) debe basarse en `estado_revision`, no solo en rol — el consultor necesita ver la interpretación mientras trabaja, antes de que el cliente la vea, incluso usando el mismo componente.
2. **Riesgo de seguridad de datos entre clientes**: los componentes de consultor (`/app/side`, `/app/plan`, etc.) fueron construidos para navegar libremente entre TODOS los clientes de la firma. Darle este mismo componente a un rol `cliente` exige garantizar — a nivel de RLS en base de datos, no solo ocultando UI — que nunca pueda ver ni seleccionar otra empresa que no sea la suya. Un error aquí sería fuga de datos entre clientes, mucho más grave que cualquier bug encontrado hoy.

**Refinamiento de la decisión (14/8/2026, tras aclaración de Antonio):** el diseño original del proyecto ya contemplaba esto — un solo contenido, con la única diferencia siendo las secciones de interpretación/guía que el consultor transmite en sesión. La implementación eficiente es: **extraer y reutilizar** los componentes ricos ya existentes en las vistas de consultor (no reconstruir desde cero), gateados por rol + estado (ej. `estado_revision` en SIDE) en vez de duplicar UI.

**SIDE — IMPLEMENTADO Y DESPLEGADO (14/8/2026, commit `98c335a`):**
- `SideCore` unificado: consultor y cliente navegan literalmente la misma página (`app.side.tsx`), mismo hero, mismas 7 pestañas (SIDE/Dimensiones/Índices/Financiero/Resultados/Análisis IA/Historial).
- Modo cliente: `clienteId` fijo desde su sesión, sin selector de empresa, sin acceso a otros clientes — verificado con RLS real en base de datos (`can_access_cliente`), no solo restricción de UI.
- Gate de interpretación premium: tarjetas de interpretación (`DimInterpretacionCard`, `IndiceInterpretacionCard`) y pestaña Análisis IA visibles para cliente solo si `estado_revision === 'revisado'` **O** `cliente.acceso_interpretacion === true`.
- **Nuevo modelo comercial:** campo `acceso_interpretacion` (boolean) en tabla `clientes` — add-on premium independiente del nivel de licencia, activable por consultor/admin únicamente (sin policy de UPDATE para rol cliente). Pantalla de bloqueo (`PremiumGateIA`, `PremiumGateInline`) incluye copy comercial explícito invitando a activar "Advisory Premium".
- `app.clientes.$clienteId.side.tsx` reducido a wrapper de 8 líneas.
- `SideResultadosCliente.tsx` (construido en la iteración anterior, ya obsoleto con este enfoque) eliminado — verificado sin uso antes de borrar.
- Typecheck limpio, sin errores nuevos.

**Patrón a replicar en el resto de módulos (Coaching, Plan Estratégico, LEE, Marketing Digital, Manual de Funciones):**
1. Unificar página consultor/cliente en un solo componente con `mode`/`fixedClienteId` (mismo patrón que `SideCore`).
2. Verificar RLS real en base de datos antes de exponer cualquier componente a rol cliente — nunca confiar solo en la UI.
3. Extraer secciones de interpretación/IA a componentes reutilizables, gateadas por estado + `acceso_interpretacion`.
4. Reutilizar el campo `acceso_interpretacion` ya creado (tabla `clientes`) — es transversal a todos los módulos, no exclusivo de SIDE.

**Compromiso de proceso:** para acelerar, las revisiones detalladas paso a paso se reservan para cambios de alto riesgo (esquema de BD, seguridad, triggers). Cambios de UI/contenido se aprueban en bloques más grandes.

---

## 🔴 URGENTE (14/8/2026) — Fuga de contenido de interpretación en módulos sin gate

Al unificar hoy la carcasa de navegación (AppSidebar compartido, eliminación del header duplicado de consultor), se destapó un problema crítico: **todos los módulos excepto SIDE muestran la interpretación/análisis de consultoría completa a CUALQUIER cliente**, sin el gate de `acceso_interpretacion` que diseñamos como add-on premium. Antes de seguir con cualquier otra mejora, hay que cerrar esto.

**Alcance de la fuga:** Plan Estratégico, Coaching, LEE, Marketing Digital, Manual de Funciones — ninguno tiene todavía el patrón `SideCore` (unificación + gate) que sí tiene SIDE.

---

## 🗺️ HOJA DE RUTA GENERAL (14/8/2026)

### Fase 1 — Cerrar la fuga de interpretación (prioridad máxima, antes que cualquier otra cosa)

**Progreso:**
- ✅ **SIDE** — completado (commit `98c335a`).
- ✅ **Plan Estratégico** — completado (commit `59ebeaf`).
- ✅ **Coaching** — completado (commit `05c794d`).
- ✅ **LEE** — completado (commit `e3a81f0`).
- ✅ **Marketing Digital** — completado (commit `f6e5d59`).
- ✅ **Manual de Funciones** — completado (14/8/2026, commit `da16410`): sin gate de interpretación (catálogo propio del cliente, sin juicio de consultor — `EvalDesempPanel` identificado como código muerto, no renderizado en ninguna ruta). RLS corregido en INSERT/DELETE de `manual_funciones_cargos` (dependían incorrectamente de `consultor_id`, ahora usan `can_access_cliente`); SELECT/UPDATE ya estaban correctos, verificados sin necesidad de cambio. Hero de cliente agregado (organigrama SVG + stats reales) reemplazando la barra azul pobre. Entitlement check por URL directa agregado (mismo patrón que Marketing Digital).

## 🎉 FASE 1 COMPLETA (14/8/2026)

Los 6 módulos de la plataforma (SIDE, Plan Estratégico, Coaching, LEE, Marketing Digital, Manual de Funciones) tienen ahora:
- Contenido de interpretación/consultoría gateado detrás de `acceso_interpretacion` donde corresponde (SIDE, Plan Estratégico, Coaching, LEE) — con criterio correcto de que Marketing Digital y Manual de Funciones NO necesitan gate porque no tienen capa de juicio del consultor mezclada con datos del cliente.
- RLS de escritura verificado y corregido en cada módulo — se encontraron y cerraron huecos reales en Coaching (política `ALL` sin distinguir rol), LEE (2 tablas), y Manual de Funciones (INSERT/DELETE con lógica incorrecta).
- Entitlement check por URL directa (protección contra acceso a módulos no incluidos en el plan) en Marketing Digital y Manual de Funciones.
- Carcasa de navegación unificada (`AppSidebar` compartido, sin header duplicado de consultor) desde el cambio de `app.clientes.$clienteId.tsx`.

**Siguiente paso sugerido:** Fase 3 del roadmap (auditoría visual completa en producción, módulo por módulo, con un usuario cliente real) antes de retomar Finanzas u otro desarrollo nuevo.

**Lección para los módulos restantes:** verificar SIEMPRE las políticas RLS de escritura (INSERT/UPDATE/DELETE) de cada tabla involucrada, no asumir que el bloqueo visual (botones ocultos, `pointerEvents: none`) es suficiente — ya van dos módulos (SIDE con el trigger, Coaching con la política `ALL`) donde el frontend bloqueaba pero la base de datos no.

Para cada módulo (Plan Estratégico, Coaching, LEE, Marketing Digital, Manual de Funciones), replicar exactamente el patrón que ya funciona en SIDE:
1. Identificar qué bloques son "contenido base" vs. "interpretación/valor de consultoría" (mismo criterio que usamos en SIDE: semáforos, recomendaciones, análisis, conclusiones).
2. Envolver esos bloques en la condición `!esCliente || cliente.acceso_interpretacion || <condición de estado del módulo si aplica>`.
3. Verificar que las queries subyacentes tengan RLS real (no solo restricción de UI) — mismo estándar que SIDE.

**Este es el paso más urgente — bloquea todo lo demás.**

### Fase 2 — Unificar navegación/portada de cada módulo (para que se sientan "nativos")
Antonio señaló que Plan Estratégico entra directo a la ficha de empresa, diferente al resto. Para cada módulo:
1. Verificar que la entrada desde el sidebar sea consistente entre todos los módulos (mismo patrón de "portada del módulo" antes de llegar al contenido específico de una empresa, o mismo patrón de entrada directa — decidir un estándar único y aplicarlo a todos).
2. Aplicar el mismo patrón `mode="consultor" | "cliente"` + `fixedClienteId` que ya tiene SIDE, para que consultor y cliente usen literalmente el mismo componente por módulo.
3. Confirmar que el breadcrumb (ya implementado para las 6 rutas de cliente) sigue funcionando correctamente después de cada unificación.

### Fase 3 — Auditoría visual completa post-unificación
Una vez que todos los módulos sigan el mismo patrón, hacer una pasada de verificación visual completa (como cliente y como consultor) en producción, módulo por módulo, para confirmar que la plataforma se siente como una sola — no seis versiones distintas cosidas entre sí.

### Fase 4 — Retomar desarrollo de nuevos módulos/funcionalidad
Solo después de que la Fase 1-3 estén cerradas: continuar con Finanzas, nuevas suites, u otras funcionalidades — sobre una base de navegación y seguridad ya consistente, en vez de seguir construyendo sobre una base fragmentada.

**Orden sugerido de módulos para las Fases 1-2:** Plan Estratégico primero (es el que Antonio identificó con navegación distinta hoy mismo), luego Coaching, LEE, Marketing Digital, Manual de Funciones.

---

## 🎨 FASE 5 — Retroalimentación UX post-verificación (14/8/2026)

Tras la verificación visual de la Fase 1, Antonio identificó problemas de funcionalidad y consistencia visual, no relacionados con seguridad. Organizados por módulo:

### Transversal (aplica a TODOS los módulos)
1. **Guardar y continuar en todos los módulos** — no solo SIDE (que ya lo tiene). Cada módulo debe: confirmar visualmente que la información se guardó, permitir retomar el trabajo exactamente donde se dejó, y almacenar sesiones terminadas para revisión futura. Conecta directo con el Problema E del diagnóstico original (riesgo real de pérdida de datos).
2. **Compartir/imprimir contenido** — todas las plantillas, workbooks y sesiones deben tener esta opción, en todos los módulos.
3. **Contenido guía/sugerido (plantillas, ejes, BSC sugerido, etc.) debe cargarse SIEMPRE que el cliente tenga `acceso_interpretacion` activo** — no debe requerir un clic extra tipo "cargar guía" cuando el add-on ya está pagado. Aplica en Plan Estratégico (inconsistente entre secciones), LEE y Manual de Funciones.
4. **Espaciado/aire en el contenido** — varias páginas muestran contenido cortado o con campos muy pequeños sin espacio (particularmente Plan Estratégico).

### SIDE — flujo de inicio de sesión (consultor) [COMPLETADO]
✅ Resuelto (14/8/2026, commit `49f922f`): causa raíz identificada — `showForm` iniciaba en `true` pero el formulario vivía fuera del viewport visible, debajo del hero. Fix: formulario movido dentro del `<Hero>` como tarjeta glass-morphism, visible de entrada sin scroll ni toggle, solo para consultor sin sesión activa (`!sesion && !esCliente`). Flujo de cliente (`esCliente`, toggle `showForm`) sin cambios — verificado explícitamente que no quedó huérfano tras el refactor.

### Coaching
✅ Resuelto (14/8/2026, commit `837eb5`): botón "Registrar nueva herramienta" renombrado a "Iniciar sesión →" (portada) e "Iniciar próxima sesión →" (CTA de resumen). Bug de fondo corregido: las tarjetas de herramientas en el tab "Herramientas" tenían efectos hover visuales (elevación, borde azul) sugiriendo interactividad, pero sin `onClick` — el clic en título/descripción/ícono no hacía nada, solo el botón pequeño al fondo funcionaba. Se agregó `onClick` al div completo de la tarjeta (con `e.stopPropagation()` en los botones interiores para evitar doble disparo), unificando el comportamiento: clic en la tarjeta abre el último registro si existe, o el formulario de nueva sesión si no.

**Pendiente separado (no bug, es propuesta de diseño):** destacar visualmente la "próxima herramienta recomendada" con badge y borde de color de etapa — mostrar como propuesta visual antes de construir, no es fix urgente.

### Plan Estratégico
✅ Resuelto (14/8/2026, commits `a749531` autosave + `4be07ec` consistencia de contenido). Decisión de producto: el contenido sugerido/plantilla de las 18 secciones es GRATIS para todos los clientes (no depende de `acceso_interpretacion`) — se auto-carga siempre, igual que ya funcionaba en PESTEL/FODA/EFI. Se corrigieron 18 botones "Cargar X" en 14 secciones (4 archivos), eliminando la necesidad de clic manual, junto con sus funciones asociadas (código muerto verificado antes de borrar). Bug adicional corregido: el patrón `??` no cubría arrays vacíos guardados (`[]`) — cambiado a `?.length ? valor : sugerido()` para que una sección vaciada vuelva a mostrar sugerencias. Bug real en Sec03: los 5 campos de texto usaban `?? ""` en vez de `?? guiaValor`, por lo que el contenido guía nunca se precargaba como valor editable, solo como placeholder fantasma — corregido.
- Espaciado insuficiente en varias secciones — pendiente, no abordado en este pase.

### Programa LEE — rediseño de layout completo
✅ Resuelto (14/8/2026, commit `c9288a1`): causa raíz identificada — `WorkbookOverlay` usaba `createPortal(..., document.body)` con `position: fixed; inset: 0; z-index: 9999`, cubriendo el sidebar completo cada vez que se abría un capítulo. Rediseño: portal eliminado, `ChapterDetailInline` renderiza dentro del flujo normal de `<main>` — sidebar siempre visible. El iframe de los workbooks HTML se mantiene inline (no en pestaña nueva, para preservar el bridge `postMessage` construido en la fase de "guardar y continuar"). Navegación por estado (`selectedChapter`) sincronizada con query param (`?capitulo=X`) para mantener capacidad de compartir/recargar enlaces directos. Nuevo hero tipo Coaching (progreso %, CTA "Continuar → Capítulo X") + tabs "Capítulos"/"Mi progreso". Gate `puedeVerInterpretacion` preservado sin cambios.

### Manual de Funciones — mismo problema que LEE
✅ Resuelto (14/8/2026, commit `209ba84`), dos fixes independientes:
- **Portal + hooks violation**: mismo patrón que LEE — `createPortal` a `document.body` tapaba el sidebar. Eliminado, iframe renderizado inline (`calc(100vh - 180px)`). Además se corrigió una violación real de Rules of Hooks (el `useEffect` del bridge vivía después de returns condicionales) — verificado con ESLint, no solo TypeScript (el typecheck no detecta esta clase de error).
- **Error intermitente al entrar al módulo** (reportado por Antonio): diagnosticado como dos causas combinadas — `Promise.all` sin `.catch()` dejaba `loading` colgado indefinidamente si la query fallaba, y una race condition real donde el `useEffect` de carga se disparaba antes de que el JWT terminara de refrescarse (explica el patrón de "falla, luego se recupera sola" — el refresco de token dispara un re-render que reintenta la query con un JWT ya válido). Corregido con gate `if (!user) return` (espera sesión lista antes de consultar) + `Promise.allSettled` + `finally` + estado de error visible en UI en vez de fallar silenciosamente a "sin clientes".

**Orden de ejecución sugerido:** 1) Guardar y continuar universal (mayor riesgo, pérdida de datos), 2) SIDE hero fix (rápido, ya escaneado), 3) Coaching flujo de inicio, 4) Plan Estratégico consistencia + espaciado, 5) LEE rediseño completo, 6) Manual de Funciones rediseño completo, 7) Compartir/imprimir transversal.

## ✅ FASE 5 COMPLETA (14/8/2026)

Todos los puntos resueltos:
- Guardar y continuar en los 5 módulos (SIDE, Plan Estratégico, Coaching, LEE, Manual de Funciones) — con 2 bugs reales de pérdida de datos encontrados y corregidos (Plan Estratégico, Coaching).
- SIDE: fix del hero de inicio de sesión (3 pasos → 1).
- Coaching: bloques clickeables corregidos + badge "Recomendada" (Coaching C) con borde de color de etapa. Commit `f2a09ba`.
- Plan Estratégico: consistencia de contenido guía (18 botones eliminados en 14 secciones, auto-carga para todos los clientes) + fix de arrays vacíos.
- LEE: rediseño completo de layout — portal que tapaba el sidebar eliminado, hero + tabs tipo Coaching, deep-linking por query param.
- Manual de Funciones: mismo rediseño de portal + 2 bugs de estabilidad corregidos (violación de Rules of Hooks, race condition de JWT causando errores intermitentes al entrar al módulo).

**Pendiente explícitamente NO resuelto en esta fase:** espaciado/aire insuficiente en Plan Estratégico, y compartir/imprimir transversal en todos los módulos. Quedan para una futura sesión.

---

## 🔴 FASE 6 — Regresión + estándar visual "tarjeta flotante" (14/8/2026)

### 🔴 URGENTE — Regresión en Manual de Funciones (introducida hoy)
Tras el fix de hoy (eliminar el portal, renderizar inline), el hero/cabecera de la vista de cliente ahora ocupa **más de la mitad del viewport** — peor que antes visualmente. Hay que corregir el tamaño/proporción del hero antes de cualquier otra cosa en este módulo.

### Sidebar — altura fija, no escala con el contenido
El sidebar es más corto que el cuerpo principal y no tiene scroll propio — debería desplegarse verticalmente con su propio scroll para que fluya independiente del contenido principal, sin importar cuán largo sea este último. Problema transversal (afecta todas las páginas, no solo un módulo).

### Estándar visual "tarjeta/ventana flotante" — aplicar en TODA la plataforma
Petición central de Antonio: cuando se abre cualquier herramienta, sección, cargo o página de detalle, debe desplegarse como una **tarjeta o ventana flotante más grande** (modal enriquecido), replicando exactamente cómo Panel Coaching despliega sus herramientas — no como contenido plano inline. Ejemplos concretos:
- Manual de Funciones: al abrir el detalle de un cargo, debe abrir como ventana flotante (no inline).
- Este patrón debe convertirse en el estándar para TODOS los módulos — "si toda la plataforma tuviera ese estándar visual sería espectacular" (cita textual).

### Heroes de portada inconsistentes en tamaño e impacto
- Plan Estratégico: hero de portada "chiquito", no guarda relación de escala con los heroes de SIDE/Coaching.
- Programa LEE: mismo problema — hero pequeño, sin contenido relevante/motivador que muestre resultados a los visitantes.
- Objetivo: unificar el tamaño e impacto visual de TODOS los heroes de portada al estándar de SIDE/Coaching.

**Verificación adicional (14/8/2026) — Evaluación de Desempeño confirma la gravedad real:**
Al hacer clic en "Evaluación de Desempeño" desde el editor de un cargo, **el sidebar de cargos desaparece por completo** — la vista se reemplaza por un formulario plano de pantalla completa (KPIs, tabla de inputs pequeños, sin contexto visual de en qué empresa/cargo estás más allá de un texto pequeño y un link "← Manual" para volver). No hay ventana flotante, no hay overlay, no hay indicación de progreso — es una página plana que reemplaza todo. Mismo patrón confirmado al expandir la lista de cargos por categoría: el contenedor de la lista (dentro del sidebar propio del iframe) es demasiado corto — "COMERCIAL (8)" solo muestra 1 cargo visible antes de cortarse, con el pie de botones ("+ Nuevo cargo", etc.) comprimiendo el espacio disponible.

**Conclusión revisada:** el problema NO es principalmente de tamaños/espaciado (eso ya se corrigió parcialmente en el hero de portada). El problema real es que **todo el editor de Manual de Funciones — sidebar de cargos, ficha de cargo, evaluaciones — es una aplicación HTML estática con su propia navegación plana de página completa**, sin ningún patrón de ventana flotante ni de sidebar persistente con scroll independiente. Corregir esto a fondo requiere trabajar directamente en el archivo HTML del editor (`/manual-funciones.html`), no solo en el wrapper de React — es un cambio de mayor alcance que un simple ajuste de estilos.

**Escala real del archivo (medida con JavaScript en vivo, 14/8/2026):** `/public/manual-funciones.html` tiene **~7,822 líneas, 710 KB, 183 botones, 82 campos editables**, 8 pestañas por cargo (Identificación/Objetivo/Funciones/Competencias/KPIs/Relaciones/Condiciones/Carrera) — varias veces más grande que el archivo más grande tocado hoy (`app.side.tsx`). Contiene datos reales de producción (Grupo ANS ya tiene 50 cargos documentados con evaluaciones y cálculos de GAP).

**Decisión (14/8/2026):** la migración completa a React (la solución definitiva — módulo nativo con sidebar compartido, ventanas flotantes tipo Coaching, autosave, gate de acceso_interpretacion) se pospone a una sesión dedicada, dado el riesgo real de pérdida de datos de producción en una migración de este tamaño mal ejecutada. **Para hoy:** mejora de bajo riesgo dentro del HTML existente — que "Evaluación de Desempeño" y "Evaluación & PDI" se abran como overlay superpuesto (manteniendo el sidebar de cargos visible detrás) en vez de reemplazar la pantalla completa. No resuelve el problema de fondo, pero mejora la orientación del usuario mientras se planea la migración.

**Próxima sesión — alcance de la migración completa a planificar:**
1. Diagnóstico completo del HTML: entender la lógica de datos (cómo habla con Supabase vía postMessage), qué funciones utilitarias hay que preservar (exportar PDF, ZIP, importar).
2. Plan por fases, verificando en cada paso que no se pierda ningún dato existente de clientes reales.
3. Construir: sidebar de cargos en React (reutilizando AppSidebar), ficha de cargo con sus 8 pestañas, evaluaciones como modal (patrón Coaching).

**Requerimiento final de Antonio (14/8/2026, fin de sesión) — objetivo claro y simple para retomar:**
> "Lo único que necesito es que el manual de funciones del colaborador, así como sus evaluaciones cuando se llenen, se desplieguen en una ventana flotante o tarjeta flotante — pero que se vea el contenido de interés."

**Arquitectura de navegación propuesta por Antonio (15/8/2026) — adoptada:**
Reemplazar el sidebar interno duplicado por el mismo patrón que ya usa Plan Estratégico: **Portada (bloques por área) → lista de cargos del área → ficha del cargo como ventana flotante** (evaluaciones dentro de la misma ventana, cambiando de vista, no como modal apilado). Elimina la competencia de espacio entre el sidebar de la plataforma y el sidebar interno del HTML.

**Permisos por área (15/8/2026) — se construye DESDE EL INICIO, junto con la navegación, no como fase separada:**
El módulo debe ser usado tanto por Jefes de RRHH (ven TODAS las áreas y cargos de la empresa) como por Jefes de Área (ven SOLO su propia área). Modelo propuesto: agregar `area_id` nullable a `empresa_usuarios` — nulo = ve todo (RRHH), con valor = solo esa área (Jefe de Área). Pendiente de verificar en investigación si `empresa_usuarios` ya soporta múltiples filas por `cliente_id` (probablemente sí, dado que ya vimos ese patrón en otros módulos) y si hace falta una UI nueva para que RRHH invite/asigne usuarios internos a áreas específicas.

**Requerimiento CRÍTICO adicional (15/8/2026) — el módulo debe ser una plataforma BASE reutilizable, no específica de un cliente:**
Antonio aclaró que la intención original (que "se diluyó con el tiempo") es que Manual de Funciones funcione como Plan Estratégico: existe un **contenido/estructura base estándar** (áreas y cargos genéricos) que CUALQUIER cliente nuevo puede usar como punto de partida, duplicar y personalizar (logo, nombre de empresa, mover/renombrar/duplicar cargos entre áreas) — sin que esa base pertenezca a ningún cliente específico. **Confirmado explícitamente: los datos reales de Alnusan/Grupo ANS (50 cargos) NO se tocan ni se eliminan** — la plantilla base vive en tablas completamente separadas (`manual_plantilla_areas`/`manual_plantilla_cargos`), sin relación con los datos reales del cliente. Idea a futuro (no urgente): una vez exista la plantilla genérica, comparar contra el manual real de Alnusan para identificar mejoras de contenido en ambas direcciones.

**Diseño de esquema aprobado (15/8/2026) — tabla separada de plantillas (no cliente_id nulo):**
- `manual_plantilla_areas` / `manual_plantilla_cargos`: nuevas tablas, sin `cliente_id`, RLS de solo-lectura para todos + escritura solo admin.
- `manual_funciones_config`: nueva tabla para `logo_url` a nivel cliente (antes incorrectamente repetido en cada fila de cargo).
- `area_id` (FK compuesta `cliente_id + area_id → manual_areas`) agregado tanto en `manual_funciones_cargos` (reemplaza el texto libre `area`) como en `empresa_usuarios` (para permisos de Jefe de Área).
- Función `clonar_plantilla_manual_funciones(cliente_id)`: idempotente, `SECURITY DEFINER`, usa CTE `MATERIALIZED` para generar UUIDs consistentes entre áreas clonadas y sus cargos. Se invoca desde el loader del servidor (Opción B, con `supabaseAdmin`/service role) — **sin GRANT a `authenticated`**, ya que el service role no requiere permisos explícitos.
- Nuevo valor de `rol_empresa`: `'jefe_area'` (además de `'dueño'`, más `'colaborador'` para el futuro) — con constraint que exige `area_id NOT NULL` si el rol es `jefe_area`.
- RLS corregido: `manual_areas` tenía un bug real de privacidad (`SELECT USING (true)`, cualquier usuario veía las áreas de todos los clientes) — corregido con `can_access_cliente()`. `manual_funciones_cargos` actualizado para filtrar por área cuando el usuario es `jefe_area`.
- **Decisión de contenido (15/8/2026)**: la plantilla base (Migración 9, pendiente de diseñar) debe ser **genérica/transversal**, no los cargos reales de Alnusan — útil como punto de partida para cualquier tipo de empresa. Se diseñará apoyándose en el skill `talento-humano` para calidad metodológica real (objetivos, funciones, competencias, KPIs bien redactados), no contenido genérico improvisado.

**Estado: Migraciones 1-9 COMPLETADAS Y VERIFICADAS (15/8/2026).**

**Decisión final sobre el contenido de la plantilla (cambio de rumbo durante la sesión):** se descartó generar contenido nuevo desde cero (que Claude había empezado a redactar con metodología Martha Alles) a favor de **copiar tal cual el contenido real de Alnusan/Grupo ANS** — 15 áreas, 50 cargos completos, con toda su profundidad metodológica ya construida. Razón del cambio: Antonio señaló, con base en experiencia previa negativa (pérdida de funcionalidad de evaluaciones en un rediseño anterior de este mismo módulo), que prefiere reutilizar contenido ya probado en vez de que la IA genere contenido nuevo desde cero — riesgo de terminar con algo de menor calidad que lo existente. Los cargos específicos de industria (ej. "Supervisor de Ventas · Motociclismo") se mantienen tal cual; cada cliente nuevo personaliza/elimina lo que no le aplique al clonar la plantilla — flujo ya contemplado en el diseño.

**Campos de instancia correctamente excluidos de la copia** (quedan NULL en la plantilla, cada cliente los define al personalizar): `codigo`, `elaborado_por`, `aprobado_por`, `fecha_elaboracion`, `fecha_revision`. Todo el contenido metodológico (objetivo, funciones, competencias, KPIs, requisitos, relaciones, plan de carrera) se copió íntegro.

**Resumen de las 9 migraciones completas:**
1-8: esquema (plantillas, config, area_id con FK compuesta, función de clonación, RLS corregido en 2 tablas — con 2 bugs de seguridad reales encontrados y corregidos en el camino).
9: población de contenido — 15 áreas + 50 cargos copiados desde Alnusan/Grupo ANS hacia las tablas de plantilla, verificado 100% de contenido copiado y 0 filas de origen modificadas.

**Confirmado explícitamente en cada paso: 0 filas de Alnusan/Grupo ANS modificadas o eliminadas** en las 9 migraciones.

**Pendiente para continuar — SOLO trabajo de TypeScript/UI (el esquema de datos está terminado):**
1. ✅ Loader de `/app/manual-funciones/$clienteId` — invoca `clonar_plantilla_manual_funciones(clienteId)` al inicio vía `supabaseAdmin` (commit `ffbc623`).
2. ✅ Tipos — `RolEmpresa` actualizado a `'dueño' | 'jefe_area' | 'colaborador'` (commit `ffbc623`).
3. ✅ `admin-users` — `area_id` y `rol_empresa` soportados en `adminInviteUser`/`adminUpdateProfile`, con validación Zod + defensa en profundidad en el código además del `CHECK` de base de datos (commit `ffbc623`).
4. ✅ **Componentes React Fase 1 completos y verificados en producción (15/8/2026, commits `3767ba3` + `cac0fc9`)**: `ManualFuncionesLanding` (portada con grid de 15 áreas), `AreaCargosView` (lista de cargos filtrada por `area_id`, con gate de permisos por `jefe_area`), `CargoFichaOverlay` (ventana flotante con 9 pestañas, autosave con debounce 800ms, flush seguro al cerrar). Bridge de evaluaciones (React → iframe oculto → HTML) funcionando de punta a punta, verificado manualmente en Chrome contra producción.
   - Bug encontrado y corregido en el camino: el `<iframe>` con `width:"auto", height:"auto"` no llenaba el espacio (elemento "reemplazado" en CSS, vuelve a su tamaño intrínseco 300×150px) — corregido a `width:"100%", height:"100%"` (commit `cac0fc9`).

🔴 **RESUELTO — hallazgos de la verificación en vivo (15/8/2026):**

**A. Problema de caché del navegador en `public/manual-funciones.html` — RESUELTO (commit `34e30c4`).** Causa raíz confirmada en el bundle compilado: el archivo tenía nombre fijo, sin `Cache-Control` explícito (caché heurística del navegador de días), a diferencia de los bundles JS de React que Vite versiona con hash. Fix aplicado: `Cache-Control: no-cache` vía `routeRules` de Nitro en `vite.config.railway.ts`, cubriendo también `marketing-digital*.html` y `lee-workbooks/**` (mismo patrón de riesgo). Verificado con `fetch(..., {cache:'no-store'})` mostrando el header correcto en producción.

**B. Bug de datos al abrir evaluaciones desde React — RESUELTO (commit `4abdc5b`).** Causa raíz: `CargoFichaOverlay.handleOpenEval` enviaba el objeto `Cargo` crudo (formato Supabase) al iframe sin la conversión que existía en el flujo legado (`supabaseToHtml`), causando un `TypeError` real en `esc()` al intentar renderizar `funciones` (array de objetos en vez de strings) — y 5 bugs silenciosos adicionales encontrados en la misma investigación (jefe/elaborado/aprobado/KPI-frecuencia en blanco, fechas en formato ISO crudo). Fix: mapeo explícito de formato dentro de `handleOpenEval`, sin tocar `esc()` (usada en 50+ lugares) ni duplicar lógica de conversión en el HTML.

**C. Bug de cierre del iframe de evaluación — RESUELTO (commit `9fc1505`).** Causa raíz: el guard `if (msg.clienteId !== clienteId) return;` en el listener de mensajes rechazaba `MF_EVAL_CLOSED` porque ese mensaje específico nunca incluye `clienteId` (a diferencia de `MF_READY`/`MF_SAVE`) — `undefined !== clienteId` siempre era `true`, cortando el flujo antes de llegar al handler real. Fix: lista explícita de tipos de mensaje exentos del guard (`MSGS_SIN_CLIENTE_ID`), documentando la excepción en el código en vez de depender del orden de aparición.

**Verificación final en producción (15/8/2026) — Pruebas 1-3 del checklist completo, confirmadas en vivo con Chrome:**
- ✅ Evaluación Competencias/PDI: abre correctamente, cierra correctamente, ficha React reaparece con datos intactos.
- ✅ Evaluación Desempeño: mismo comportamiento correcto.
- ✅ Escape bloqueado mientras el iframe está activo; vuelve a funcionar normalmente tras cerrar.

**FASE 1 DE MANUAL DE FUNCIONES (React: Landing + AreaCargosView + CargoFichaOverlay + bridge de evaluaciones) — COMPLETA Y VERIFICADA DE PUNTA A PUNTA.**

🔴 **NUEVOS HALLAZGOS (15/8/2026) — verificación manual de Antonio en producción, con capturas reales:**

Antonio probó personalmente el flujo (no solo verificación automatizada) y encontró 3 problemas que la verificación por JavaScript/DOM no había detectado — confirma la importancia de revisión visual humana, no solo checks programáticos:

**1. 🔴 URGENTE — Navegación rota: regresar desde Manual de Funciones o desde cualquiera de las evaluaciones saca al usuario del módulo hacia la portada de Programa LEE.** Nota: durante las pruebas automatizadas de hoy, Claude ya había visto indicios de este mismo patrón (URLs inesperadas como `/coaching-resultados`, `/lee`, `/side` apareciendo tras clics) pero lo atribuyó incorrectamente a imprecisión de clics automatizados por cambios de viewport — en retrospectiva, es probable que fuera este mismo bug real, no un artefacto de la automatización. Pendiente de diagnóstico.

**2. Doble sidebar + contenido cortado en los paneles de evaluación.** El iframe de evaluación sigue mostrando su "shell" completo (con su sidebar interno de navegación: Buscar cargo, Logística, etc.) junto al formulario de evaluación, no solo el formulario — consumiendo espacio horizontal y truncando el contenido por la derecha. Nota de proceso: esto ya era visible en la propia captura de verificación de Claude tras el fix del bridge, pero no se marcó como problema en ese momento — foco puesto solo en verificar campos de datos, no en el layout visual completo.

**3. Inconsistencia de menú entre tipos de evaluación.** "Evaluación de Competencias" muestra menú de exportación (HTML/PDF Completo/Plan). "Evaluación de Desempeño" no lo muestra — solo Calificación/Guardar. Por confirmar si es diseño original intencional o inconsistencia a corregir.

**Estado: diagnóstico solicitado para los 3 problemas, priorizando el Problema 1 (navegación rota) — pendiente de respuesta antes de aplicar cualquier fix.**

**Problema 1 — RESUELTO Y VERIFICADO EN PRODUCCIÓN (15/8/2026).** Los 3 escenarios de prueba pasaron sin ningún fallo, verificados en vivo con Chrome:
- Landing → Área → Ficha → atrás × 3: cada paso retrocede exactamente un nivel, termina en el hero del propio módulo, sin saltar a LEE.
- Evaluación abierta → atrás del navegador: iframe se oculta correctamente, ficha reaparece sin quedar atascado (caso borde confirmado resuelto).
- Escape desde Ficha y desde Área: cada uno retrocede un solo nivel, sin doble disparo. Causa raíz confirmada: `selectedArea`/`selectedCargo`/`editorAbierto` eran `useState` puro, sin integración con el historial del navegador — el state machine de navegación (Landing→Área→Ficha) era invisible para el botón "atrás" del navegador, que saltaba directo a la página anterior real en el historial de sesión (confirmado por Antonio: el trigger exacto es el botón "atrás"/gesto del trackpad, no Escape ni ningún botón interno). Fix aplicado: navegación migrada a `search params` en la URL (mismo patrón ya validado en LEE con `?capitulo=X`) — cada nivel (`?v=open`, `&area=X&areaName=Y&colorIdx=Z`, `&cargo=W`) crea una entrada real en el historial del navegador. De paso, se corrigieron los Bugs A/B de `Escape` encontrados en el diagnóstico (doble listener disparando simultáneamente + handler no consciente del nivel del state machine) con un guard `!cargo` mutuamente excluyente entre el padre y `CargoFichaOverlay`. Caso borde detectado y resuelto proactivamente: `iframeActive` quedándose atascado en `true` si el usuario navega "atrás" mientras una evaluación está abierta.

**Decisión de arquitectura (15/8/2026) — anotada para el futuro, no aplicada hoy:** Antonio preguntó si hubiera sido más simple usar páginas/rutas separadas reales (ej. rutas anidadas `/manual-funciones/$clienteId/$areaId/$cargoId`) en vez de un state machine con search params hecho a mano. Respuesta honesta: SÍ — las rutas anidadas habrían evitado el bug del botón "atrás" desde el diseño original, sin necesitar el trabajo de hoy. Pero NO habría evitado los otros problemas (crash de datos, guard de cierre roto, doble sidebar, inconsistencia de menús) — esos son inherentes al HTML legado y su puente de mensajes, no a cómo se organizan las rutas de React. Decisión: no rehacer hoy (el fix actual ya está construido y probado), pero migrar a rutas anidadas reales queda anotado como mejora arquitectónica recomendada para cuando se aborde la migración completa de evaluaciones a React.

**Problema 2 — RESUELTO Y VERIFICADO EN PRODUCCIÓN (15/8/2026, commits `6747267` + `1327862`).** Causa raíz: los eval panes tenían `left:284px` hardcodeado como estilo inline. Fix: query param `&embed=1` en el iframe cliente → clase `mf-embed` en el body vía JS → regla CSS `left:0 !important` (reutilizando el patrón exacto de `print-eval` ya existente en el archivo). Primer intento sin `!important` no funcionó (estilo inline gana sobre cualquier regla de stylesheet sin `!important`) — corregido y verificado: `getComputedStyle().left` confirmado en `0px`, sidebar interno ya no visible, tabla de requisitos usa las 4 columnas completas sin recortarse.

**Los 3 problemas encontrados por Antonio en su verificación manual quedan CERRADOS:**
1. ✅ Navegación rota (botón atrás → LEE) — resuelto con search params + fix de Escape.
2. ✅ Doble sidebar + contenido cortado — resuelto con modo embed + CSS `!important`.
3. ✅ Inconsistencia de menú entre evaluaciones — confirmado no ser regresión, diseño original.

🔴 **NUEVOS HALLAZGOS (15/8/2026, segunda ronda de verificación manual de Antonio):**

**1. RESUELTO Y VERIFICADO (15/8/2026, commit `f921849`).** Causa raíz exacta: los divs de contenido dentro de `#evalPane`/`#evalDesempPane` tenían `max-width:1100px; margin:0 auto` — invisible antes del fix anterior porque el pane medía menos de 1100px (el centrado no producía margen visible), pero al expandirse a ancho completo con `left:0`, el `margin:0 auto` empezó a generar un espacio real. Fix: clase `eval-content` en los 3 divs afectados + regla `body.mf-embed .eval-content { max-width:none !important; margin-left:0 !important; margin-right:0 !important }`, confirmada sin afectar las reglas de impresión (`print-eval`/`print-evd` usan clases distintas, mutuamente excluyentes) ni el editor de consultor (scopeado a `body.mf-embed`, que solo se activa con `&embed=1`). Verificado con `getComputedStyle`: `marginLeft: 0px`, `maxWidth: none`, y confirmado visualmente — contenido alineado a la izquierda, sin hueco.

**2. Nueva funcionalidad solicitada (no es bug) — agregar menú de exportación completo a Evaluación de Desempeño.** Antonio confirmó explícitamente que quiere paridad de funcionalidad: el mismo menú de exportación (HTML/PDF Completo/Plan) que ya tiene Evaluación de Competencias debe agregarse también a Evaluación de Desempeño. Esto es una ampliación de alcance, no una corrección de regresión.

**3. Reafirmado — documento consolidado imprimible/compartible por cargo.** Mismo requerimiento ya trackeado (botón "Imprimir/Descargar Manual" en `CargoFichaOverlay`, vista de las 9 secciones sin pestañas + `window.print()`). Antonio reafirma la prioridad: "no me parece muy funcional tenerlo en varias páginas... necesitamos un documento unificado... impreso o compartido".

**Estado: diagnóstico solicitado para el Problema 1 (espacio en blanco) — pendiente antes de aplicar fix. Problemas 2 y 3 quedan en el backlog de nueva funcionalidad, a abordar después del Problema 1.**

---

## 🔴 DECISIÓN DE ARQUITECTURA MAYOR (15/8/2026, fin de sesión) — Rediseño completo de Manual de Funciones aprobado en principio, NO ejecutado hoy

**Contexto de la decisión:** después de 3 rondas de parches CSS sucesivos en el iframe legado (left:284px → margin:0 auto → overflow horizontal cortando contenido), Antonio identificó correctamente que el patrón de "parchar propiedad por propiedad" en un archivo HTML de 700KB no diseñado para vivir embebido en un espacio angosto tiene rendimientos decrecientes — cada fix expone la siguiente suposición de ancho fijo escondida en el archivo. Cita textual: *"llevamos varios días inmersos en un problema sin solución... prefiero rehacer todo de nuevo de manera práctica."*

**Las dos conclusiones de diseño de Antonio, ambas validadas como correctas:**

1. **La ficha de cargo NO debe ser de 9 pestañas separadas.** Un manual de funciones es un documento que se necesita leer/imprimir/entregar como un todo — dividirlo en pestañas rompe esa experiencia. El HTML original tenía razón: formato vertical scrolleable de 2-3 páginas, exportable a PDF. El rediseño de hoy (9 tabs) fue una decisión de diseño equivocada de esta sesión, no una limitación técnica.

2. **Las evaluaciones deben ser ventanas flotantes de React nativas — mismo patrón que Coaching**, no HTML legado embebido en iframe. Ya demostramos hoy que el patrón de modal de Coaching (Dialog centrado, contenido rico, sin problemas de CSS) funciona perfectamente. Seguir parchando el iframe tiene techo bajo.

**Decisión: NO se ejecuta el rediseño hoy.** Se pospone explícitamente a una sesión futura con energía fresca, para evitar exactamente el tipo de error de apuro que causó la pérdida de funcionalidad en el intento anterior de reconstruir este módulo (el antecedente que motivó las salvaguardas de proceso de toda esta fase). Lo que existe hoy (imperfecto pero funcional, con los 3 fixes de CSS ya aplicados) queda como está, sin más parches, hasta que el rediseño real lo reemplace.

**Alcance del rediseño a ejecutar en la próxima sesión:**

1. **`CargoFichaOverlay` rediseñado como documento único vertical scrolleable** (no tabs) — más cercano a la estructura práctica del HTML original. Las 9 secciones actuales (Identificación, Objetivo, Funciones, Competencias, KPIs, Relaciones, Condiciones, Plan de Carrera, Firmas) se mantienen como contenido, pero fluyen verticalmente en una sola vista, no como pestañas independientes.

2. **Evaluación de Competencias/PDI y Evaluación de Desempeño reconstruidas como componentes React nativos** (Dialog/ventana flotante, mismo patrón que las herramientas de Coaching) — reemplazando por completo el enfoque de iframe + puente de mensajes. Esto elimina de raíz toda la clase de bugs de CSS que aparecieron hoy (no hay forma de que reaparezcan si el contenido es React real, no HTML embebido).

3. **Dado el tamaño de la lógica de evaluación** (~4,000 líneas originales: cálculos de GAP, radares SVG, semáforos, historial, múltiples formatos de exportación — ya inventariado en detalle en una sesión anterior), aplicar la misma disciplina usada toda la sesión de hoy: inventario completo ya existe (ver más arriba en este documento), aprobación explícita de qué debe preservarse exactamente igual o mejor, construcción y verificación incremental en producción, nunca eliminar la funcionalidad legada hasta confirmar que la nueva versión funciona igual o mejor.

**Estado al cierre de esta sesión:** el iframe legado (con los fixes de hoy: sin doble sidebar, sin espacio en blanco) sigue siendo la implementación en producción. Los problemas de contenido cortado a la derecha (tablas y toolbars con overflow horizontal) NO se corrigieron con un parche más — quedan como están, pendientes de resolverse de raíz con el rediseño completo, no con otro ajuste de CSS.

**Problema 3 — CERRADO, no es regresión.** Confirmado: el HTML de Evaluación de Desempeño siempre tuvo menos opciones de exportación que Competencias (diseño original, no un descuido de hoy).

🔴 **PENDIENTE — no resuelto, no se pierda de vista:** Falta un botón de "Imprimir / Descargar Manual" (vista consolidada) en `CargoFichaOverlay` — regresión no intencional descubierta en la sesión. El HTML original tenía funciones de exportación (PDF/HTML individual) pensadas para imprimir, archivar o entregar el manual de un cargo a un colaborador. El nuevo camino de cliente (Landing → Área → Ficha) ya no pasa por el editor completo donde vivían esos botones — hoy el cliente no tiene ninguna forma de generar un documento consolidado de las 9 secciones. Plan acordado: agregar un botón que renderice las 9 secciones ya construidas todas juntas (no por pestañas) y dispare `window.print()` con estilos de impresión, reutilizando los componentes de sección existentes — alcance acotado, no confundir con la exportación ZIP/PDF de toda la empresa (esa sigue diferida a Fase 2).

**Salvaguarda de proceso acordada para la Fase de UI (crítica, dado antecedente negativo con este mismo módulo):** antes de reemplazar cualquier funcionalidad interactiva existente (especialmente Evaluación & PDI / Evaluación de Desempeño, ~4,000 líneas), se requiere: (a) inventario completo de cada función/interacción actual, (b) aprobación explícita de Antonio de esa lista como "debe seguir funcionando igual o mejor", (c) verificación función por función en vivo (no solo "el código compila") antes de considerar reemplazado el original. Nunca borrar funcionalidad existente hasta confirmar en producción que lo nuevo funciona igual o mejor.

**Estado al cierre de la sesión anterior (verificado en vivo con Chrome):**
- ✅ Overlay de evaluaciones con backdrop implementado y confirmado funcionando (commit `3a11cb6`) — el sidebar de cargos queda visible detrás al abrir una evaluación. (Nota: este fix queda potencialmente obsoleto/reemplazado si se elimina el sidebar interno en la migración a React — evaluar si conservarlo o descartarlo al construir la nueva navegación.)
- 🔴 Problema confirmado sin resolver: encabezado de la ficha de cargo se envuelve en 6-10 líneas por falta de espacio (dos sidebars compitiendo) — se resuelve de raíz con la nueva arquitectura de navegación, no necesita parche aparte.
- Nota de proceso: hubo un episodio de confusión por caché del iframe (el fix del overlay parecía no funcionar, pero sí estaba desplegado — solo el iframe cacheado no lo reflejaba). Si esto se repite, forzar recarga tanto de la página padre como navegar directo a la URL del iframe en una pestaña nueva para descartar caché.

**Siguiente paso inmediato:** investigación de esquema (empresa_usuarios, manual_funciones_cargos, existencia o no de un mecanismo de plantilla/clonación) antes de diseñar el plan final de migración.

**Reporte de alcance completado (14/8/2026) — hallazgos clave para la próxima sesión:**
- Archivo real: 7,385 líneas (no 7,822 como estimado inicial vía JS), altamente acoplado — 153 usos de manipulación directa del DOM (`innerHTML`/`createElement`/etc.), sin separación datos/presentación, sin estado centralizado (`cargos[]` como array global mutable).
- **Estimación: 5-6× el esfuerzo de SideCore** (que tiene ~1,100 líneas).
- **Recomendación de la investigación, adoptada como plan**: NO migrar todo de una vez. Migrar primero solo las vistas de lectura (sidebar de cargos + ficha de 8 pestañas: Identificación/Objetivo/Funciones/Competencias/KPIs/Relaciones/Condiciones/Carrera) conectadas directamente a Supabase — esto resuelve el problema principal de navegación/sidebar que motivó todo este hallazgo. Los overlays de Evaluación & PDI / Evaluación de Desempeño (~4,000 líneas combinadas) y la maquinaria de exportación (ZIP/PDF/JSON) se quedan en el HTML embebido por ahora, como Fase 2 separada — son los de mayor riesgo (el export ZIP genera HTMLs standalone que deben seguir funcionando offline, un "segundo runtime" independiente de la app React).
- Los 50 cargos de datos demo (3,027 líneas hardcodeadas en el archivo) se migrarían a Supabase como parte del trabajo — cambio de arquitectura de datos, no solo de UI.

**Verificación visual en producción (14/8/2026, vía Claude en Chrome, sesión cliente real):**
- **Manual de Funciones**: confirmado — el hero + header ocupan ~54-60% del viewport antes de contenido real. Además, al abrir el editor aparecen DOS sidebars simultáneos (el AppSidebar de la plataforma + un segundo menú propio del iframe de Manual de Funciones) más un tercer hero interno ("Grupo ANS") — tres capas de navegación/hero apiladas. Causa raíz: **todo el editor de Manual de Funciones es un iframe apuntando a un archivo HTML estático** (`/manual-funciones.html`), no componentes React de la plataforma — es efectivamente una mini-aplicación aparte incrustada, con su propia UI de navegación. Al abrir un cargo individual, el contenido reemplaza el panel derecho de forma plana/inline (confirmado el punto 3 de Antonio) — no hay ningún modal o ventana flotante.
- **Coaching (el estándar deseado)**: confirmado el patrón — al hacer clic en una herramienta (ej. "Radar del líder"), se abre un **modal centrado con overlay oscuro**, contenido rico (hero de contexto + tarjetas de datos + visualización), 100% componentes React (Dialog de shadcn). Este es el patrón exacto a replicar.
- **Plan Estratégico**: hero de portada confirmado pequeño (~110px de alto) vs. el hero de Coaching (~500px+). Campos de texto largo (ej. factores PESTEL, columna "Descripción") confirmados cortados visualmente — el input es demasiado angosto para el contenido, sin ajuste de ancho ni expansión.
- Nota técnica clave para el plan de corrección: como Manual de Funciones vive en un HTML estático fuera del árbol de React, aplicar el patrón de "ventana flotante" ahí requiere una estrategia distinta a los demás módulos (ya sea reescribir esa pieza en React, o envolver el iframe en un Dialog de la plataforma en vez de dejarlo manejar su propia navegación interna).

**Progreso — Guardar y continuar universal: COMPLETADO (14/8/2026)**
- ✅ **Plan Estratégico** (commit `a749531`): bug real de pérdida de datos corregido — race condition en los 18 tabs/Prev-Next. Debounce 5s→2s, `saveAndGo()` intercepta navegación, botón "Guardar y volver al resumen".
- ✅ **Coaching** (commit `a988eb4`): bug real corregido — cierre de modal (Cancelar/Esc/clic fuera) descartaba debounce pendiente. `handleClose` fuerza guardado en los 3 caminos antes de desmontar.
- ✅ **LEE** (commit `8863cc5`): dos componentes — `WorkbookOverlay` (iframe, ya autosave 700ms, solo faltaba badge persistente) y `WorkbookDialog` (facilitador, mismo patrón completo de Coaching con `handleClose`).
- ✅ **Manual de Funciones** (commit `8208131`): iframe con autosave 800ms event-driven, solo faltaba badge persistente (sin Dialog React que interceptar, arquitectura más simple).
- ✅ **SIDE**: ya lo tenía desde el trabajo original de la sesión.

**Nota técnica recurrente:** varios de estos commits tuvieron conflictos de merge en `main` porque el archivo ya había sido tocado por trabajo previo de la sesión (Fase 1). Se resolvieron verificando explícitamente ambas versiones antes de combinar — ninguno se resolvió a ciegas.

---

## Fase 6 — Progreso adicional (14/8/2026, continuación)

**Hero de portada de Manual de Funciones — reducido (commit `7eb1d96`):** ajuste de padding/tamaños en `ClienteManualHero`. Verificado visualmente: el hero + tarjetas de contenido ahora caben en una sola pantalla sin scroll (antes ocupaba ~54-60% del viewport solo el hero).

**Overlay de Evaluación de Desempeño / Evaluación & PDI — mejora aplicada (commit `3a11cb6`):** dentro de `public/manual-funciones.html`, se cambió `inset:0` por `left:284px` + nuevo `#evalBackdrop` semitransparente en ambos paneles de evaluación, manteniendo el sidebar de cargos visible detrás. Cambio quirúrgico (~8 líneas), sin tocar ninguna función de datos (`populateEvalPane`, `saveEvdData`, etc.), compatible con las reglas de impresión existentes.

**Falso positivo de "el fix no funciona" — resuelto:** tras el deploy, tanto Antonio como Claude (verificando vía Chrome) vieron el comportamiento viejo. Diagnóstico exhaustivo (comparación de commit vs. archivo en disco vs. archivo servido) confirmó que el deploy fue exitoso en todos los niveles — verificado con `fetch()` directo sin caché (con y sin el query param `clienteId`) y con una pestaña nueva de Chrome navegando el flujo completo: en ambos casos, `evalBackdrop` está presente y el patrón viejo ya no existe. La causa real era **caché de navegador en la pestaña específica de prueba** — `Cmd+Shift+R` no siempre fuerza la recarga de recursos dentro de un iframe. Lección para futuras verificaciones: usar ventana de incógnito o pestaña nueva para confirmar cambios en `public/manual-funciones.html`, no confiar en hard-refresh de una pestaña que ya tenía el iframe cargado.

---

## Convenciones de este documento
- ✅ = verificado en producción con capturas o revisión de código
- 🔴 = confirmado pendiente, con evidencia
- 🟡 = necesita decisión antes de convertirse en tarea
