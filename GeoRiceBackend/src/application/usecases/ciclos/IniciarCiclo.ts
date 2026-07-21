import { ICicloRepository }            from '../../../domain/repositories/ICicloRepository';
import { IActividadParcelaRepository } from '../../../domain/repositories/IActividadParcelaRepository';
import { CicloActividad }              from '../../../domain/entities/CicloActividad';
import { ActividadParcela }            from '../../../domain/entities/ActividadParcela';
import { PLANTILLAS_CICLO, TipoCiclo } from '../../../domain/entities/PlantillaCiclo';

interface IniciarCicloInput {
  parcelaId:      number;
  tipo:           TipoCiclo;
  fechaInicio:    Date;
  variedadSemilla?: string;
  areaSembrada?:  number;
  observaciones?: string;
}

export class IniciarCiclo {
  constructor(
    private readonly cicloRepo: ICicloRepository,
    private readonly actividadRepo: IActividadParcelaRepository,
  ) {}

  async execute(input: IniciarCicloInput): Promise<{ ciclo: CicloActividad; actividades: ActividadParcela[] }> {
    const { parcelaId, tipo, fechaInicio, variedadSemilla, areaSembrada, observaciones } = input;

    const plantilla = PLANTILLAS_CICLO[tipo];
    if (!plantilla) throw new Error(`Tipo de ciclo "${tipo}" no válido`);

    const cicloActivo = await this.cicloRepo.findActivoByParcela(parcelaId);
    if (cicloActivo) {
      throw new Error('Esta parcela ya tiene un ciclo activo. Finaliza el ciclo actual antes de iniciar uno nuevo.');
    }

    const ciclo = await this.cicloRepo.create({
      parcelaId,
      tipo,
      estado:         'activo',
      fechaInicio,
      variedadSemilla,
      areaSembrada,
      observaciones,
    } as Partial<CicloActividad>);

    const actividades: ActividadParcela[] = [];
    for (const item of plantilla) {
      const fechaActividad = new Date(fechaInicio);
      fechaActividad.setDate(fechaActividad.getDate() + item.diasDesdeInicio);

      const actividad = await this.actividadRepo.create({
        parcelaId,
        tipo:           item.tipo as any,
        fecha:          fechaActividad,
        cicloId:        ciclo.id,
        ordenPlantilla: item.orden,
        observaciones:  item.descripcion,
        nivelAlerta:    'normal',
      } as any);
      actividades.push(actividad);
    }

    return { ciclo, actividades };
  }
}
