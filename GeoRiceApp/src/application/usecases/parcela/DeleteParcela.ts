import { ParcelaRepository } from '../../../infrastructure/repositories/ParcelaRepository';

export const DeleteParcela = async (id: number): Promise<void> => {
  if (!id) throw new Error('ID de parcela inválido');
  return await ParcelaRepository.delete(id);
};