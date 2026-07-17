import { IReporteRepository, ReporteResumen } from '../../../domain/repositories/IReporteRepository';
import { AuthContext } from '../../../shared/types/AuthContext';

export interface ReporteFiltrosInput {
  fechaInicio?: string;
  fechaFin?:    string;
  usuarioId?:   string;
}

export class GetResumenReporte {
  constructor(private repo: IReporteRepository) {}

  async execute(ctx: AuthContext, filtros: ReporteFiltrosInput): Promise<ReporteResumen> {
    if (!filtros.fechaInicio || !filtros.fechaFin) {
      throw new Error('fechaInicio y fechaFin son obligatorias');
    }
    if (isNaN(Date.parse(filtros.fechaInicio)) || isNaN(Date.parse(filtros.fechaFin))) {
      throw new Error('fechaInicio o fechaFin no son fechas válidas');
    }
    if (filtros.fechaInicio > filtros.fechaFin) {
      throw new Error('fechaInicio no puede ser posterior a fechaFin');
    }

    // Un socio solo puede ver su propio reporte; un admin puede filtrar por
    // socio específico (usuarioId) o ver todos (usuarioId=null).
    const usuarioId = ctx.rol === 'administrador'
      ? (filtros.usuarioId ?? null)
      : ctx.usuarioId;

    return this.repo.getResumen({
      fechaInicio: filtros.fechaInicio,
      fechaFin:    filtros.fechaFin,
      usuarioId,
    });
  }
}
