import { IActividadParcelaRepository } from '../../../domain/repositories/IActividadParcelaRepository';
import { ActividadParcela }            from '../../../domain/entities/ActividadParcela';
import { AppDataSource }               from '../../../infrastructure/db/DataSource';
import { Parcela }                     from '../../../domain/entities/Parcela';

const TIPOS_COSECHA = ['cosecha','cosecha_soca'];

export class UpdateActividad {
  constructor(private repo: IActividadParcelaRepository) {}

  async execute(id: number, data: Partial<ActividadParcela>): Promise<ActividadParcela | null> {
    if (!id) throw new Error('El id de la actividad es obligatorio');

    const actividad = await this.repo.findById(id);
    if (!actividad) throw new Error('Actividad no encontrada');

    // ── 1. Recalcular ingreso cosecha ─────────────────────────────
    if (TIPOS_COSECHA.includes(data.tipo ?? actividad.tipo)) {
      const sacos  = data.totalSacos ?? actividad.totalSacos;
      const precio = data.precioQq   ?? actividad.precioQq;
      if (sacos && precio) {
        data.ingresoTotal = Number(sacos) * Number(precio);
      }
    }

    // ── 2. Recalcular mano de obra ────────────────────────────────
    const unidad   = data.unidadManoObra   ?? actividad.unidadManoObra;
    const cantidad = data.cantidadUnidadMo ?? actividad.cantidadUnidadMo;
    const precio   = data.precioUnidadMo   ?? actividad.precioUnidadMo;

    if (unidad && cantidad && precio) {
      data.costoManoObra = Number(cantidad) * Number(precio);
    } else {
      const jornales = data.numJornales ?? actividad.numJornales;
      const pago     = data.pagoJornal  ?? actividad.pagoJornal;
      if (jornales && pago) {
        data.costoManoObra    = Number(jornales) * Number(pago);
        data.unidadManoObra   = 'jornal';
        data.cantidadUnidadMo = Number(jornales);
        data.precioUnidadMo   = Number(pago);
      }
    }

    // ── 3. Recalcular sembradores ─────────────────────────────────
    const tipo = data.tipo ?? actividad.tipo;
    if (tipo === 'siembra_trasplante') {
      const precioTarea = data.precioTarea ?? actividad.precioTarea;
      let   numTareas   = data.numTareas   ?? actividad.numTareas;

      if (!numTareas) {
        const parcelaRepo = AppDataSource.getRepository(Parcela);
        const parcela     = await parcelaRepo.findOneBy({ id: actividad.parcelaId });
        if (parcela?.areaHa) {
          numTareas      = Number((Number(parcela.areaHa) * 16).toFixed(2));
          data.numTareas = numTareas;
        }
      }
      if (numTareas && precioTarea) {
        data.costoSembradores = Number(numTareas) * Number(precioTarea);
      }
    }

    // ── 4. Recalcular productos ───────────────────────────────────
    // const tanques = data.numTanques ?? actividad.numTanques;
    // if (data.productos?.length) {
    //   data.productos = data.productos.map(p => {
    //     const prod = { ...p };
    //     if (tanques && prod.dosisPorTanque) {
    //       prod.dosisTotal = Number(prod.dosisPorTanque) * Number(tanques);
    //     }
    //     if (prod.dosisTotal && prod.precioUnitario) {
    //       prod.costoTotal = Number(
    //         (Number(prod.dosisTotal) * Number(prod.precioUnitario)).toFixed(2)
    //       );
    //     }
    //     return prod;
    //   });

    //   data.costoInsumos = data.productos.reduce(
    //     (sum, p) => sum + Number(p.costoTotal ?? 0), 0
    //   );
    // }

    // ── 4. Recalcular productos ───────────────────────────────────
// const tanques = data.numTanques ?? actividad.numTanques;
// if (data.productos?.length) {
//   data.productos = data.productos.map(p => {
//     const prod = { ...p };
//     if (tanques && prod.dosisPorTanque) {
//       // cc → litros ÷ 1000
//       prod.dosisTotal = (Number(prod.dosisPorTanque) / 1000) * Number(tanques);
//     }
//     if (prod.dosisTotal && prod.precioUnitario) {
//       prod.costoTotal = Number(
//         (Number(prod.dosisTotal) * Number(prod.precioUnitario)).toFixed(2)
//       );
//     }
//     return prod;
//   });

//   data.costoInsumos = data.productos.reduce(
//     (sum, p) => sum + Number(p.costoTotal ?? 0), 0
//   );
// }

// ── 4. Recalcular productos ───────────────────────────────────
const tanques = data.numTanques ?? actividad.numTanques;
const cantMo  = data.cantidadUnidadMo ?? actividad.cantidadUnidadMo;

if (data.productos?.length) {
  data.productos = data.productos.map(p => {
    const prod = { ...p };

    // ── Dosis total ───────────────────────────────────────────
    if (tanques && prod.dosisPorTanque) {
      prod.dosisTotal = (Number(prod.dosisPorTanque) / 1000) * Number(tanques);
    } else if (prod.dosisPorUnidadMo && cantMo) {
      prod.dosisTotal = Number(prod.dosisPorUnidadMo) * Number(cantMo);
    }

    // ── Precio unitario desde presentación ────────────────────
    if (prod.presentacionMl && prod.precioPresentacion) {
      prod.precioUnitario = Number(
        (Number(prod.precioPresentacion) / (Number(prod.presentacionMl) / 1000)).toFixed(4)
      );
      if (prod.dosisTotal) {
        prod.frascoUsados = Number(
          (Number(prod.dosisTotal) / (Number(prod.presentacionMl) / 1000)).toFixed(4)
        );
      }
    }

    // ── Costo total ───────────────────────────────────────────
    if (prod.dosisTotal && prod.precioUnitario) {
      prod.costoTotal = Number(
        (Number(prod.dosisTotal) * Number(prod.precioUnitario)).toFixed(2)
      );
    }

    return prod;
  });

  data.costoInsumos = data.productos.reduce(
    (sum, p) => sum + Number(p.costoTotal ?? 0), 0
  );
}

    // ── 5. Recalcular costo total ─────────────────────────────────
    data.costoTotalActividad =
      Number(data.costoManoObra    ?? actividad.costoManoObra    ?? 0) +
      Number(data.costoMaquinaria  ?? actividad.costoMaquinaria  ?? 0) +
      Number(data.costoInsumos     ?? actividad.costoInsumos     ?? 0) +
      Number(data.costoSembradores ?? actividad.costoSembradores ?? 0);

    return this.repo.update(id, data);
  }
}