import { ActividadRepository } from '../../../infrastructure/repositories/ActividadRepository';

export const DeleteActividad = async (parcelaId: number, id: number): Promise<void> => {
  if (!parcelaId) throw new Error('ID de parcela inválido');
  if (!id) throw new Error('ID de actividad inválido');
  return await ActividadRepository.delete(parcelaId, id);
};