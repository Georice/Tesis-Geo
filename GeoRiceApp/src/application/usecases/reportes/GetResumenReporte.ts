import { ReporteRepository } from '../../../infrastructure/repositories/ReporteRepository';
import { ReporteFiltros } from '../../../domain/entities/Reporte';

export const GetResumenReporte = (filtros: ReporteFiltros) =>
  ReporteRepository.getResumen(filtros);
