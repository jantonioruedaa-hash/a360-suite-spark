// Demo data helpers — to be replaced with real Supabase queries in next phase
export interface DemoCliente {
  id: string;
  nombre_empresa: string;
  sector: string;
  tamano: string;
  pais: string;
  ciudad: string;
  ime: number;
  ime_estado: "critico" | "desarrollo" | "consolidado" | "lider";
  progreso: { side: number; plan: number; coach: number; lee: number };
  ultima_actividad: string;
  brechas: { nombre: string; score: number }[];
}

export const demoClientes: DemoCliente[] = [
  {
    id: "1",
    nombre_empresa: "Comercial del Pacífico S.A.",
    sector: "Comercio distribución B2B",
    tamano: "45 empleados",
    pais: "Ecuador", ciudad: "Guayaquil",
    ime: 3.1, ime_estado: "desarrollo",
    progreso: { side: 80, plan: 45, coach: 30, lee: 20 },
    ultima_actividad: "Hace 2 días",
    brechas: [{ nombre: "Escalabilidad", score: 2.3 }, { nombre: "Gestión", score: 2.6 }],
  },
  {
    id: "2",
    nombre_empresa: "AgroAndes Cía. Ltda.",
    sector: "Agroindustria",
    tamano: "120 empleados",
    pais: "Ecuador", ciudad: "Quito",
    ime: 3.8, ime_estado: "consolidado",
    progreso: { side: 100, plan: 75, coach: 60, lee: 50 },
    ultima_actividad: "Ayer",
    brechas: [{ nombre: "Innovación", score: 2.9 }],
  },
  {
    id: "3",
    nombre_empresa: "Textiles Manabí",
    sector: "Manufactura textil",
    tamano: "28 empleados",
    pais: "Ecuador", ciudad: "Manta",
    ime: 2.4, ime_estado: "critico",
    progreso: { side: 50, plan: 10, coach: 0, lee: 0 },
    ultima_actividad: "Hace 1 semana",
    brechas: [{ nombre: "Finanzas", score: 1.8 }, { nombre: "Operaciones", score: 2.1 }],
  },
  {
    id: "4",
    nombre_empresa: "TecnoServicios Andinos",
    sector: "Servicios IT B2B",
    tamano: "62 empleados",
    pais: "Ecuador", ciudad: "Cuenca",
    ime: 4.2, ime_estado: "lider",
    progreso: { side: 100, plan: 90, coach: 80, lee: 70 },
    ultima_actividad: "Hoy",
    brechas: [{ nombre: "Expansión internacional", score: 3.4 }],
  },
];

export const imeColor = (estado: DemoCliente["ime_estado"]) => {
  switch (estado) {
    case "critico": return "text-destructive bg-destructive/10";
    case "desarrollo": return "text-warning bg-[oklch(0.78_0.16_70/0.15)]";
    case "consolidado": return "text-success bg-[oklch(0.62_0.14_150/0.12)]";
    case "lider": return "text-gold bg-[oklch(0.74_0.12_80/0.18)]";
  }
};

export const imeLabel = (estado: DemoCliente["ime_estado"]) =>
  ({ critico: "Crítico", desarrollo: "En desarrollo", consolidado: "Consolidado", lider: "Líder" }[estado]);
