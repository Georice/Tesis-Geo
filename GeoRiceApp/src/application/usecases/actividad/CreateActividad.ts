import { ActividadRepository } from '../../../infrastructure/repositories/ActividadRepository';
import { Actividad, CreateActividadDTO } from '../../../domain/entities/Actividad';

export const CreateActividad = async (parcelaId: number, data: CreateActividadDTO): Promise<Actividad> => {
  if (!parcelaId) throw new Error('ID de parcela inválido');
  if (!data.tipo) throw new Error('El tipo de actividad es obligatorio');
  if (!data.fecha) throw new Error('La fecha es obligatoria');
  return await ActividadRepository.create(parcelaId, data);
};