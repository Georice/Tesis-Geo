import { ZonaRepository } from '../../../infrastructure/repositories/ZonaRepository';
import { Zona } from '../../../domain/entities/Zona';

export const GetZonas = async (): Promise<Zona[]> => {
  return await ZonaRepository.getAll();
};
