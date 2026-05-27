-- Agregar columna de créditos extra
ALTER TABLE public.clientes
ADD COLUMN IF NOT EXISTS creditos_ia_extra integer NOT NULL DEFAULT 0;

-- Actualizar los grants existentes (ya están en la tabla, pero reafirmamos si es necesario)
GRANT SELECT, INSERT, UPDATE ON public.clientes TO authenticated;
GRANT ALL ON public.clientes TO service_role;