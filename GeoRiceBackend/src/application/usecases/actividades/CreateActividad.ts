import { IActividadParcelaRepository } from '../../../domain/repositories/IActividadParcelaRepository';
import { ActividadParcela } from '../../../domain/entities/ActividadParcela';
import { ProductoActividad } from '../../../domain/entities/ProductoActividad';

const TIPOS_CON_PRODUCTOS = ['fertilizacion', 'fumigacion', 'soca_fertilizacion', 'soca_fumigacion'];

export class CreateActividad {
  constructor(private repo: IActividadParcelaRepository) {}

  async execute(
    data: Partial<ActividadParcela>,
    productos?: Partial<ProductoActividad>[]
  ): Promise<ActividadParcela> {
    if (!data.parcelaId) throw new Error('La parcela es obligatoria');
    if (!data.tipo)      throw new Error('El tipo de actividad es obligatorio');
    if (!data.fecha)     throw new Error('La fecha es obligatoria');

    // Validar productos obligatorios para fumigación y fertilización
    if (TIPOS_CON_PRODUCTOS.includes(data.tipo)) {
      if (!productos || productos.length === 0) {
        throw new Error(`Debe agregar al menos un producto para ${data.tipo}`);
      }
      for (const p of productos) {
        if (!p.nombre?.trim()) throw new Error('Cada producto debe tener un nombre');
      }
    }

    // Calcular ingreso total si es cosecha
    if ((data.tipo === 'cosecha' || data.tipo === 'cosecha_soca') &&
        data.totalSacos && data.precioQq) {
      data.ingresoTotal = Number(data.totalSacos) * Number(data.precioQq);
    }

    return this.repo.create(data, productos);
  }
}