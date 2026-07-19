import { apiFetch } from './ApiClient';
import { SyncEngine } from '../sync/SyncEngine';
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
  // Los reportes son agregados calculados en vivo en el servidor (sumas,
  // conteos por rango de fechas) — a diferencia de parcelas/actividades/etc.
  // no hay una versión offline razonable de esto, así que a propósito NO
  // cae a caché. Solo se traduce el error crudo de red a un mensaje claro.
  getResumen: async (filtros: ReporteFiltros): Promise<ReporteResumen> => {
    let res: Response;
    try {
      res = await apiFetch(`/reportes/resumen?${buildQuery(filtros)}`);
    } catch (err) {
      if (!SyncEngine.isNetworkError(err)) throw err;
      throw new Error('Los reportes requieren conexión a internet. Intenta de nuevo cuando tengas señal.');
    }
    if (!res.ok) throw new Error(`GET /reportes/resumen falló: ${res.status}`);
    return res.json();
  },
};
