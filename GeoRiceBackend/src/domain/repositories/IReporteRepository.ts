export interface ReporteFiltros {
  fechaInicio: string;
  fechaFin:    string;
  usuarioId:   string | null;
}

export interface ReporteResumenGeneral {
  totalActividades: number;
  totalCiclos:      number;
  costoTotal:       number;
  areaTrabajada:    number;
}

export interface ReporteEstadoCount {
  estado:   string;
  cantidad: number;
}

export interface ReporteCostoPorTipo {
  tipo:       string;
  cantidad:   number;
  costoTotal: number;
}

export interface ReporteCiclo {
  id:            number;
  tipo:          string;
  estado:        string;
  fechaInicio:   string;
  fechaFin:      string | null;
  areaSembrada:  number | null;
  parcelaNombre: string;
  costoTotal:    number;
}

export interface ReporteActividad {
  id:            number;
  fecha:         string;
  tipo:          string;
  estado:        string;
  parcelaNombre: string;
  cicloTipo:     string | null;
  socioNombre:   string;
  costoInsumos:  number;
  costoTotal:    number;
}

export interface ReporteResumen {
  filtros: {
    fechaInicio: string;
    fechaFin:    string;
    usuarioId:   string | null;
    socioNombre: string | null;
  };
  resumen:              ReporteResumenGeneral;
  actividadesPorEstado: ReporteEstadoCount[];
  costoPorTipo:         ReporteCostoPorTipo[];
  ciclos:               ReporteCiclo[];
  actividades:          ReporteActividad[];
}

export interface IReporteRepository {
  getResumen(filtros: ReporteFiltros): Promise<ReporteResumen>;
}
