import { ActividadRepository } from '../../../infrastructure/repositories/ActividadRepository';

export const DeleteActividad = async (id: number): Promise<void> => {
  if (!id) throw new Error('ID de actividad inválido');
  return await ActividadRepository.delete(id);
};