import { ParcelaRepository } from '../../../infrastructure/repositories/ParcelaRepository';
import { Parcela, CreateParcelaDTO } from '../../../domain/entities/Parcela';

export const CreateParcela = async (data: CreateParcelaDTO): Promise<Parcela> => {
  if (!data.nombre?.trim()) throw new Error('El nombre de la parcela es obligatorio');
  if (!data.propietario?.trim()) throw new Error('El propietario es obligatorio');
  if (!data.geometria) throw new Error('La geometría es obligatoria');
  return await ParcelaRepository.create(data);
};