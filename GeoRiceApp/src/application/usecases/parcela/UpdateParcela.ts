import { ParcelaRepository } from '../../../infrastructure/repositories/ParcelaRepository';
import { Parcela, UpdateParcelaDTO } from '../../../domain/entities/Parcela';

export const UpdateParcela = async (id: number, data: UpdateParcelaDTO): Promise<Parcela> => {
  if (!id) throw new Error('ID de parcela inválido');
  return await ParcelaRepository.update(id, data);
};