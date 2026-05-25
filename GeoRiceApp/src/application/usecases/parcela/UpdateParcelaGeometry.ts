import { ParcelaRepository } from '../../../infrastructure/repositories/ParcelaRepository';
import { Parcela } from '../../../domain/entities/Parcela';

export const UpdateParcelaGeometry = async (id: number, geometria: object): Promise<Parcela> => {
  if (!id) throw new Error('ID de parcela inválido');
  const coords = (geometria as any)?.coordinates?.[0];
  if (!coords || coords.length < 3) throw new Error('La geometría necesita al menos 3 vértices');

  // Asegurar que el anillo esté cerrado
  const first = coords[0];
  const last  = coords[coords.length - 1];
  const isClosed = first[0] === last[0] && first[1] === last[1];
  const closedCoords = isClosed ? coords : [...coords, first];

  const geometriaCerrada = {
    type: 'Polygon',
    coordinates: [closedCoords],
  };

  return await ParcelaRepository.updateGeometry(id, geometriaCerrada);
};