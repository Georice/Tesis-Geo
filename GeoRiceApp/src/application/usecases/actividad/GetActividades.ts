import { ActividadRepository } from '../../../infrastructure/repositories/ActividadRepository';
import { Actividad } from '../../../domain/entities/Actividad';

export const GetActividades = async (parcelaId: number): Promise<Actividad[]> => {
  if (!parcelaId) throw new Error('ID de parcela inválido');
  return await ActividadRepository.getByParcela(parcelaId);
};