# Checklist de validación de esquema

Proceso obligatorio antes de cualquier migración SQL en este proyecto.

**Por qué:** metodología establecida explícitamente para evitar regressions en producción. Aplica a toda migración, sin excepción.

Producción: `hmdwaubkuvkvtsvwtifh` en rama `main` — nunca tocar directamente.
Dev branch activo: `wvkoqhtjvneqfilaomut`.

---

## Antes de cualquier migración

- [ ] Confirmar que se está trabajando en una rama de desarrollo de Supabase, nunca en producción
- [ ] Confirmar que cada FK nueva referencia la tabla correcta (ej. `plan_id → planes.id`, no un texto libre)
- [ ] Confirmar que ninguna política RLS existente se duplica o entra en conflicto
- [ ] Si la migración incluye backfill: confirmar que es idempotente (se puede correr dos veces sin duplicar ni corromper datos)
- [ ] Reportar conteo de filas afectadas antes/después del backfill

## Antes de aprobar merge a producción

- [ ] Build del proyecto sin errores
- [ ] Typecheck sin errores
- [ ] Confirmar que ningún módulo existente que ya lea/escriba las tablas tocadas se rompió (especialmente Plan Estratégico, que depende de `cliente_cotizaciones` y de `plan_licencia`)

---

## Lecciones aprendidas — sesión 2026-08-12 (Decisión 1: plan_id en clientes)

- **Edit/Write puede generar contenido que no coincide con lo que describe en texto.** Verificar siempre con `diff` real antes de aprobar cualquier cambio en archivos TSX/JSX complejos. El preview de diff en la herramienta puede ser confuso; preferir generar un archivo en `/tmp`, correr `diff`, y solo después copiar al destino real.

- **Antes de escribir sobre un archivo de riesgo medio, escribir a `/tmp` primero.** Flujo: generar → verificar (`wc -l`, `head`, `tail`, `diff`) → copiar. Esto aplica especialmente a archivos generados (tipos de Supabase, assets compilados).

- **Nunca usar `2>&1` cuando stdout se redirige a un archivo que debe quedar con contenido limpio.** Ejemplo: `supabase gen types > types.ts 2>&1` contamina `types.ts` con mensajes de error si el comando falla. Mantener stderr separado para que los errores sean visibles en consola y no entren en el archivo de salida.

- **No hardcodear UUIDs de catálogo en backfills.** Aunque los valores se hayan verificado manualmente contra producción, usar un `JOIN` o subquery contra la tabla de catálogo (`planes`) hace el backfill más seguro y autodocumentado. Los UUIDs hardcodeados crean dependencia frágil que se rompe si el catálogo cambia de entorno.
