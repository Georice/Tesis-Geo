import { CapaRepository } from '../../../infrastructure/repositories/CapaRepository';

export const DeleteCapa = async (id: number): Promise<void> => {
  if (!id) throw new Error('ID de capa inválido');
  return await CapaRepository.delete(id);
};
