import { ICicloRepository, FaseInfo } from '../../../domain/repositories/ICicloRepository';

export interface FasesPorTipoResult {
  tipoCiclo: string;
  fases:     FaseInfo[];
}

export class GetFasesPorTipo {
  constructor(private repo: ICicloRepository) {}

  async execute(parcelaId: number, tipoActividad: string): Promise<FasesPorTipoResult> {
    const cicloActivo = await this.repo.findActivoByParcela(parcelaId);
    if (!cicloActivo) throw new Error('No hay ciclo activo en esta parcela');

    const fases = await this.repo.getFasesPorTipoActividad(cicloActivo.tipo, tipoActividad);
    return { tipoCiclo: cicloActivo.tipo, fases };
  }
}
