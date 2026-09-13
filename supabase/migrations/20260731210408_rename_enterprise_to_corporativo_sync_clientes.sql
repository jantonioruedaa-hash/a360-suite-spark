-- Migración aplicada a producción el 31/07/2026.
-- Archivo documental retroactivo — el SQL original no quedó en el repo.
-- Renombra el plan "Enterprise" a "Corporativo" y sincroniza clientes.plan_licencia.

UPDATE public.planes
SET nombre      = 'Corporativo',
    descripcion = 'Acceso completo a todos los módulos de la plataforma'
WHERE id = 'a1000000-0000-0000-0000-000000000003'
  AND nombre = 'Enterprise';

UPDATE public.clientes
SET plan_licencia = 'corporativo'
WHERE plan_licencia = 'enterprise';
