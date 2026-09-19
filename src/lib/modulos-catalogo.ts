import type { LucideIcon } from "lucide-react";
import {
  ScanSearch, History, Compass, HeartHandshake, BookOpen, TrendingUp,
  GraduationCap, Megaphone, ClipboardList, FileText,
} from "lucide-react";

export interface ModuloCatalogo {
  slug: string;
  label: string;
  descripcion: string;
  icon: LucideIcon;
}

// IMPORTANTE: al agregar un modulo_slug nuevo a plan_modulos en Supabase,
// añadirlo también aquí para que sea visible y toggleable en el Panel Admin.
export const MODULOS: ModuloCatalogo[] = [
  { slug: "side",                 label: "Diagnóstico SIDE",     descripcion: "Diagnóstico integral empresarial",                              icon: ScanSearch     },
  { slug: "side_historial",       label: "Historial SIDE",       descripcion: "Historial completo de diagnósticos SIDE",                       icon: History        },
  { slug: "plan_estrategico",     label: "Plan Estratégico",     descripcion: "Planeación estratégica con BSC",                                icon: Compass        },
  { slug: "coaching",             label: "Coaching A360",        descripcion: "Acompañamiento ejecutivo",                                      icon: HeartHandshake },
  { slug: "coaching_metodologia", label: "Metodología Coaching", descripcion: "Acceso a la metodología del programa",                          icon: BookOpen       },
  { slug: "coaching_resultados",  label: "Resultados Coaching",  descripcion: "Delta Radar + progreso por etapa",                              icon: TrendingUp     },
  { slug: "lee",                  label: "Programa LEE",         descripcion: "Liderazgo Empresarial Evolutivo",                               icon: GraduationCap  },
  { slug: "kpis",                 label: "Seguimiento KPIs",     descripcion: "Tablero de indicadores y BSC",                                  icon: TrendingUp     },
  { slug: "marketing_digital",    label: "Marketing Digital",    descripcion: "Estrategia de crecimiento digital",                             icon: Megaphone      },
  { slug: "manual_funciones",     label: "Manual de Funciones",  descripcion: "Descripción de cargos y competencias",                          icon: ClipboardList  },
  { slug: "cotizador",            label: "Cotizador",            descripcion: "Generación de cotizaciones y propuestas comerciales",           icon: FileText       },
];

export function moduloLabel(slug: string): string {
  return MODULOS.find((m) => m.slug === slug)?.label ?? slug;
}
