-- Fix clonar_plantilla_manual_funciones: incluir columnas "area" (NOT NULL) y "resultados_esperados"
-- que faltaban en el INSERT original, causando error al clonar en clientes nuevos.
CREATE OR REPLACE FUNCTION public.clonar_plantilla_manual_funciones(p_cliente_id uuid)
 RETURNS void
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
BEGIN
  IF EXISTS (SELECT 1 FROM manual_areas WHERE cliente_id = p_cliente_id LIMIT 1) THEN
    RETURN;
  END IF;

  WITH area_mapping AS MATERIALIZED (
    SELECT
      id                AS plantilla_area_id,
      gen_random_uuid() AS nuevo_area_id,
      nombre,
      orden
    FROM manual_plantilla_areas
  ),
  insert_areas AS (
    INSERT INTO manual_areas (id, cliente_id, nombre, orden)
    SELECT nuevo_area_id, p_cliente_id, nombre, orden
    FROM area_mapping
    RETURNING id
  )
  INSERT INTO manual_funciones_cargos (
    id, cliente_id, area_id,
    area, cargo, jefe_inmediato, codigo, version,
    fecha_elaboracion, fecha_revision, elaborado_por, aprobado_por,
    vacante, estado, objetivo,
    supervisa_a, requisitos, funciones,
    competencias_blandas, competencias_tecnicas, kpis,
    relaciones_internas, relaciones_externas, condiciones,
    plan_carrera, resultados_esperados, created_at, updated_at
  )
  SELECT
    gen_random_uuid(), p_cliente_id, am.nuevo_area_id,
    am.nombre, pc.cargo, pc.jefe_inmediato, pc.codigo, pc.version,
    pc.fecha_elaboracion, pc.fecha_revision, pc.elaborado_por, pc.aprobado_por,
    pc.vacante, pc.estado, pc.objetivo,
    pc.supervisa_a, pc.requisitos, pc.funciones,
    pc.competencias_blandas, pc.competencias_tecnicas, pc.kpis,
    pc.relaciones_internas, pc.relaciones_externas, pc.condiciones,
    pc.plan_carrera, pc.resultados_esperados, now(), now()
  FROM manual_plantilla_cargos pc
  JOIN area_mapping am ON am.plantilla_area_id = pc.plantilla_area_id;

  INSERT INTO manual_funciones_config (cliente_id)
  VALUES (p_cliente_id)
  ON CONFLICT (cliente_id) DO NOTHING;
END;
$function$;
