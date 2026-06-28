import { AppDataSource }       from '../../../infrastructure/db/DataSource';
import { CicloActividad }      from '../../../domain/entities/CicloActividad';
import { ActividadParcela }    from '../../../domain/entities/ActividadParcela';
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
  async execute(input: IniciarCicloInput): Promise<{ ciclo: CicloActividad; actividades: ActividadParcela[] }> {
    const { parcelaId, tipo, fechaInicio, variedadSemilla, areaSembrada, observaciones } = input;

    const plantilla = PLANTILLAS_CICLO[tipo];
    if (!plantilla) throw new Error(`Tipo de ciclo "${tipo}" no válido`);

    const cicloRepo      = AppDataSource.getRepository(CicloActividad);
    const actividadRepo  = AppDataSource.getRepository(ActividadParcela);

    const cicloActivo = await cicloRepo.findOne({
      where: { parcelaId, estado: 'activo' },
    });
    if (cicloActivo) {
      throw new Error('Esta parcela ya tiene un ciclo activo. Finaliza el ciclo actual antes de iniciar uno nuevo.');
    }

    const ciclo = cicloRepo.create({
      parcelaId,
      tipo,
      estado:         'activo',
      fechaInicio,
      variedadSemilla,
      areaSembrada,
      observaciones,
    });
    await cicloRepo.save(ciclo);

    const actividades: ActividadParcela[] = [];
    for (const item of plantilla) {
      const fechaActividad = new Date(fechaInicio);
      fechaActividad.setDate(fechaActividad.getDate() + item.diasDesdeInicio);

      const actividad = actividadRepo.create({
        parcelaId,
        tipo:           item.tipo as any,
        fecha:          fechaActividad,
        cicloId:        ciclo.id,
        ordenPlantilla: item.orden,
        observaciones:  item.descripcion,
        nivelAlerta:    'normal',
      });
      await actividadRepo.save(actividad);
      actividades.push(actividad);
    }

    return { ciclo, actividades };
  }
}