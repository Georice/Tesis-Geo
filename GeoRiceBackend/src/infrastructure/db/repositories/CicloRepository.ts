import { AppDataSource } from '../DataSource';
import { CicloActividadModel } from '../models/CicloActividadModel';
import { CicloActividad } from '../../../domain/entities/CicloActividad';
import {
  ICicloRepository,
  CrearCicloComando,
  FaseInfo,
} from '../../../domain/repositories/ICicloRepository';
import { TipoCiclo } from '../../../domain/types/CicloTypes';
import { TIPOS_ACTIVIDAD_TODAS_FASES } from '../../../domain/types/ActividadTypes';
import { CicloActividadMapper } from '../mappers/CicloActividadMapper';

export class CicloRepository implements ICicloRepository {
  private repo = AppDataSource.getRepository(CicloActividadModel);

  async create(data: CrearCicloComando): Promise<CicloActividad> {
    const activo = await this.findActivoByParcela(data.parcelaId);
    if (activo) {
      throw new Error('Esta parcela ya tiene un ciclo activo. Finaliza el ciclo actual antes de iniciar uno nuevo.');
    }

    const ciclo = this.repo.create({ ...data, estado: 'activo' });
    const saved = await this.repo.save(ciclo);
    return CicloActividadMapper.toDomain(saved);
  }

  async findActivoByParcela(parcelaId: number): Promise<CicloActividad | null> {
    const model = await this.repo.findOne({ where: { parcelaId, estado: 'activo' } });
    return model ? CicloActividadMapper.toDomain(model) : null;
  }

  async findByParcela(parcelaId: number): Promise<CicloActividad[]> {
    const rows = await this.repo.find({ where: { parcelaId }, order: { fechaInicio: 'DESC' } });
    return rows.map(CicloActividadMapper.toDomain);
  }

  async findById(id: number): Promise<CicloActividad | null> {
    const model = await this.repo.findOne({ where: { id } });
    return model ? CicloActividadMapper.toDomain(model) : null;
  }

  async finalizar(id: number): Promise<CicloActividad | null> {
    const model = await this.repo.findOne({ where: { id } });
    if (!model) return null;
    model.estado   = 'completado';
    model.fechaFin = new Date();
    const saved = await this.repo.save(model);
    return CicloActividadMapper.toDomain(saved);
  }

  async getTodasLasFases(tipoCiclo: TipoCiclo): Promise<FaseInfo[]> {
    const rows = await AppDataSource.query(`
      SELECT f.codigo, f.nombre, f.orden_fase AS "ordenFase", f.orden_min AS "ordenPlantilla"
      FROM fases_ciclo f
      WHERE f.tipo_ciclo = $1
      ORDER BY f.orden_fase
    `, [tipoCiclo]);
    return rows;
  }

  async getFasesPorTipoActividad(tipoCiclo: TipoCiclo, tipoActividad: string): Promise<FaseInfo[]> {
    if (TIPOS_ACTIVIDAD_TODAS_FASES.includes(tipoActividad as any)) {
      return this.getTodasLasFases(tipoCiclo);
    }
    const rows = await AppDataSource.query(`
      SELECT f.codigo, f.nombre, f.orden_fase AS "ordenFase", p.orden AS "ordenPlantilla"
      FROM fases_ciclo f
      JOIN plantillas_ciclo p
        ON p.tipo_ciclo = f.tipo_ciclo
        AND p.orden BETWEEN f.orden_min AND f.orden_max
      WHERE f.tipo_ciclo = $1
        AND p.tipo_actividad = $2
      ORDER BY f.orden_fase
    `, [tipoCiclo, tipoActividad]);
    return rows;
  }
}
