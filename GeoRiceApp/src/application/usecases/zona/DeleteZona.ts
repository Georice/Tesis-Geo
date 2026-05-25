import { ZonaRepository } from '../../../infrastructure/repositories/ZonaRepository';

export const DeleteZona = async (id: number): Promise<void> => {
  if (!id) throw new Error('ID de zona inválido');
  return await ZonaRepository.delete(id);
};