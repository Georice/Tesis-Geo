import { CapaRepository } from '../../../infrastructure/repositories/CapaRepository';
import { Capa, CreateCapaDTO } from '../../../domain/entities/Capa';

export const CreateCapa = async (parcelaId: number, data: CreateCapaDTO): Promise<Capa> => {
  if (!parcelaId) throw new Error('ID de parcela inválido');
  if (!data.tipo) throw new Error('El tipo de capa es obligatorio');
  if (!data.geometria) throw new Error('La geometría es obligatoria');
  return await CapaRepository.create(parcelaId, data);
};