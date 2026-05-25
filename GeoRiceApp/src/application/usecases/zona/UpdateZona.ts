import { ZonaRepository } from '../../../infrastructure/repositories/ZonaRepository';
import { Zona, UpdateZonaDTO } from '../../../domain/entities/Zona';

export const UpdateZona = async (id: number, data: UpdateZonaDTO): Promise<Zona> => {
  if (!id) throw new Error('ID de zona inválido');
  if (data.nombre !== undefined && !data.nombre.trim()) throw new Error('El nombre no puede estar vacío');
  return await ZonaRepository.update(id, data);
};