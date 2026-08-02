import { ActividadRepository } from '../../../infrastructure/repositories/ActividadRepository';
import { Actividad, UpdateActividadDTO } from '../../../domain/entities/Actividad';

export const UpdateActividad = async (parcelaId: number, id: number, data: UpdateActividadDTO): Promise<Actividad> => {
  if (!parcelaId) throw new Error('ID de parcela inválido');
  if (!id) throw new Error('ID de actividad inválido');
  return await ActividadRepository.update(parcelaId, id, data);
};