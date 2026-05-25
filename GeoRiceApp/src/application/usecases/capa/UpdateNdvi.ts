import { CapaRepository } from '../../../infrastructure/repositories/CapaRepository';
import { Capa } from '../../../domain/entities/Capa';

export const UpdateNdvi = async (capaId: number, ndviEstimado: number): Promise<Capa> => {
  if (!capaId) throw new Error('ID de capa inválido');
  if (ndviEstimado < 0 || ndviEstimado > 1) throw new Error('El NDVI debe estar entre 0 y 1');
  return await CapaRepository.updateNdvi(capaId, ndviEstimado);
};