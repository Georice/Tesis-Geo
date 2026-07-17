import { apiGet } from './ApiClient';
import { ReporteFiltros, ReporteResumen } from '../../domain/entities/Reporte';

function buildQuery(filtros: ReporteFiltros): string {
  const params = new URLSearchParams({
    fechaInicio: filtros.fechaInicio,
    fechaFin:    filtros.fechaFin,
  });
  if (filtros.usuarioId) params.set('usuarioId', filtros.usuarioId);
  return params.toString();
}

export const ReporteRepository = {
  getResumen: (filtros: ReporteFiltros): Promise<ReporteResumen> =>
    apiGet<ReporteResumen>(`/reportes/resumen?${buildQuery(filtros)}`),
};
