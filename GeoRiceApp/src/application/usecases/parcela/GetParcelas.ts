import { ParcelaRepository } from '../../../infrastructure/repositories/ParcelaRepository';
import { Parcela } from '../../../domain/entities/Parcela';

export const GetParcelas = async (): Promise<Parcela[]> => {
  return await ParcelaRepository.getAll();
};