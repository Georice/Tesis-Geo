import { IActividadParcelaRepository } from '../../../domain/repositories/IActividadParcelaRepository';
import { ActividadParcela }            from '../../../domain/entities/ActividadParcela';

const TIPOS_CON_PRODUCTOS = ['fertilizacion','fumigacion','soca_fertilizacion','soca_fumigacion'];
const TIPOS_COSECHA       = ['cosecha','cosecha_soca'];

export class CreateActividad {
  constructor(private repo: IActividadParcelaRepository) {}

  async execute(data: Partial<ActividadParcela>): Promise<ActividadParcela> {
    if (!data.parcelaId) throw new Error('La parcela es obligatoria');
    if (!data.tipo)      throw new Error('El tipo de actividad es obligatorio');

    // Validar productos obligatorios para fumigación/fertilización
    if (TIPOS_CON_PRODUCTOS.includes(data.tipo)) {
      if (!data.productos || data.productos.length === 0) {
        throw new Error(`El tipo "${data.tipo}" requiere al menos un producto`);
      }
    }

    // Calcular ingreso total en cosecha
    if (TIPOS_COSECHA.includes(data.tipo)) {
      if (data.totalSacos && data.precioQq) {
        data.ingresoTotal = Number(data.totalSacos) * Number(data.precioQq);
      }
    }

    // Calcular costo de mano de obra
    if (data.numJornales && data.pagoJornal) {
      data.costoManoObra = Number(data.numJornales) * Number(data.pagoJornal);
    }

    // Calcular dosis total por producto según tanques
    if (data.productos && data.numTanques) {
      data.productos = data.productos.map(p => ({
        ...p,
        dosisTotal: p.dosisPorTanque
          ? Number(p.dosisPorTanque) * Number(data.numTanques)
          : p.dosisTotal,
      }));
    }

    return this.repo.create(data);
  }
}