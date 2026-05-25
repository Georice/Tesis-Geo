import { ActividadRepository } from '../../../infrastructure/repositories/ActividadRepository';
import { Actividad, UpdateActividadDTO } from '../../../domain/entities/Actividad';

export const UpdateActividad = async (id: number, data: UpdateActividadDTO): Promise<Actividad> => {
  if (!id) throw new Error('ID de actividad inválido');
  return await ActividadRepository.update(id, data);
};