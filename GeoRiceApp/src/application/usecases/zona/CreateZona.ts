import { ZonaRepository } from '../../../infrastructure/repositories/ZonaRepository';
import { Zona, CreateZonaDTO } from '../../../domain/entities/Zona';

export const CreateZona = async (data: CreateZonaDTO): Promise<Zona> => {
  if (!data.nombre?.trim()) throw new Error('El nombre de la zona es obligatorio');
  if (data.nombre.length > 100) throw new Error('El nombre no puede superar 100 caracteres');
  return await ZonaRepository.create(data);
};