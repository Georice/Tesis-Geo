import { IActividadParcelaRepository } from '../../../domain/repositories/IActividadParcelaRepository';
import { ActividadParcela }            from '../../../domain/entities/ActividadParcela';

const TIPOS_COSECHA = ['cosecha','cosecha_soca'];

export class UpdateActividad {
  constructor(private repo: IActividadParcelaRepository) {}

  async execute(id: number, data: Partial<ActividadParcela>): Promise<ActividadParcela | null> {
    if (!id) throw new Error('El id de la actividad es obligatorio');

    const actividad = await this.repo.findById(id);
    if (!actividad) throw new Error('Actividad no encontrada');

    // Recalcular ingreso total
    if (TIPOS_COSECHA.includes(data.tipo ?? actividad.tipo)) {
      const sacos  = data.totalSacos  ?? actividad.totalSacos;
      const precio = data.precioQq    ?? actividad.precioQq;
      if (sacos && precio) {
        data.ingresoTotal = Number(sacos) * Number(precio);
      }
    }

    // Recalcular costo mano de obra
    const jornales = data.numJornales ?? actividad.numJornales;
    const pago     = data.pagoJornal  ?? actividad.pagoJornal;
    if (jornales && pago) {
      data.costoManoObra = Number(jornales) * Number(pago);
    }

    // Recalcular dosis total por producto
    const tanques = data.numTanques ?? actividad.numTanques;
    if (data.productos && tanques) {
      data.productos = data.productos.map(p => ({
        ...p,
        dosisTotal: p.dosisPorTanque
          ? Number(p.dosisPorTanque) * Number(tanques)
          : p.dosisTotal,
      }));
    }

    return this.repo.update(id, data);
  }
}