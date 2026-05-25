import { CapaRepository } from '../../../infrastructure/repositories/CapaRepository';
import { Capa } from '../../../domain/entities/Capa';

export const GetCapas = async (parcelaId: number): Promise<Capa[]> => {
  if (!parcelaId) throw new Error('ID de parcela inválido');
  return await CapaRepository.getByParcela(parcelaId);
};