import { IActividadParcelaRepository } from '../../../domain/repositories/IActividadParcelaRepository';
import { ActividadParcela }            from '../../../domain/entities/ActividadParcela';
import { AppDataSource }               from '../../../infrastructure/db/DataSource';
import { CicloActividad }              from '../../../domain/entities/CicloActividad';
import { Parcela }                     from '../../../domain/entities/Parcela';

const TIPOS_CON_PRODUCTOS = ['fertilizacion','fumigacion','soca_fertilizacion','soca_fumigacion'];
const TIPOS_COSECHA       = ['cosecha','cosecha_soca'];

export class CreateActividad {
  constructor(private repo: IActividadParcelaRepository) {}

  async execute(data: Partial<ActividadParcela>): Promise<ActividadParcela> {
    if (!data.parcelaId) throw new Error('La parcela es obligatoria');
    if (!data.tipo)      throw new Error('El tipo de actividad es obligatorio');

    // ── 1. Asignar ciclo activo automáticamente ───────────────────
    if (!data.cicloId) {
      const cicloRepo  = AppDataSource.getRepository(CicloActividad);
      const cicloActivo = await cicloRepo.findOne({
        where: { parcelaId: data.parcelaId, estado: 'activo' },
      });
      if (cicloActivo) data.cicloId = cicloActivo.id;
    }

    // ── 2. Validar productos requeridos ───────────────────────────
    if (TIPOS_CON_PRODUCTOS.includes(data.tipo)) {
      if (!data.productos || data.productos.length === 0) {
        throw new Error(`El tipo "${data.tipo}" requiere al menos un producto`);
      }
    }

    // ── 3. Calcular ingreso total cosecha ─────────────────────────
    if (TIPOS_COSECHA.includes(data.tipo)) {
      if (data.totalSacos && data.precioQq) {
        data.ingresoTotal = Number(data.totalSacos) * Number(data.precioQq);
      }
    }

    // ── 4. Calcular mano de obra según unidad ─────────────────────
    if (data.unidadManoObra && data.cantidadUnidadMo && data.precioUnidadMo) {
      data.costoManoObra = Number(data.cantidadUnidadMo) * Number(data.precioUnidadMo);
    } else if (data.numJornales && data.pagoJornal) {
      // compatibilidad con campo anterior
      data.costoManoObra   = Number(data.numJornales) * Number(data.pagoJornal);
      data.unidadManoObra  = 'jornal';
      data.cantidadUnidadMo = Number(data.numJornales);
      data.precioUnidadMo  = Number(data.pagoJornal);
    }

    // ── 5. Calcular sembradores (siembra_trasplante) ──────────────
    if (data.tipo === 'siembra_trasplante' && data.precioTarea) {
      if (!data.numTareas) {
        // calcular tareas desde área de la parcela
        const parcelaRepo = AppDataSource.getRepository(Parcela);
        const parcela     = await parcelaRepo.findOneBy({ id: data.parcelaId });
        if (parcela?.areaHa) {
          data.numTareas = Number((Number(parcela.areaHa) * 16).toFixed(2));
        }
      }
      if (data.numTareas) {
        data.costoSembradores = Number(data.numTareas) * Number(data.precioTarea);
      }
    }

    // ── 6. Calcular dosis total y costo por producto ──────────────
    // if (data.productos?.length) {
    //   data.productos = data.productos.map(p => {
    //     const prod = { ...p };

    //     // dosis total según tanques o hectáreas
    //     if (data.numTanques && prod.dosisPorTanque) {
    //       prod.dosisTotal = Number(prod.dosisPorTanque) * Number(data.numTanques);
    //     } else if (prod.dosisHa) {
    //       const parcelaAreaHa = (data as any).parcelaAreaHa;
    //       if (parcelaAreaHa) {
    //         prod.dosisTotal = Number(prod.dosisHa) * Number(parcelaAreaHa);
    //       }
    //     }

    //     // costo total del producto
    //     if (prod.dosisTotal && prod.precioUnitario) {
    //       prod.costoTotal = Number(
    //         (Number(prod.dosisTotal) * Number(prod.precioUnitario)).toFixed(2)
    //       );
    //     }

    //     return prod;
    //   });

    // ── 6. Calcular dosis total y costo por producto ──────────────
// if (data.productos?.length) {
//   data.productos = data.productos.map(p => {
//     const prod = { ...p };

//     if (data.numTanques && prod.dosisPorTanque) {
//       // cc → litros ÷ 1000
//       prod.dosisTotal = (Number(prod.dosisPorTanque) / 1000) * Number(data.numTanques);
//     } else if (prod.dosisHa) {
//       const parcelaAreaHa = (data as any).parcelaAreaHa;
//       if (parcelaAreaHa) {
//         prod.dosisTotal = Number(prod.dosisHa) * Number(parcelaAreaHa);
//       }
//     }

//     if (prod.dosisTotal && prod.precioUnitario) {
//       prod.costoTotal = Number(
//         (Number(prod.dosisTotal) * Number(prod.precioUnitario)).toFixed(2)
//       );
//     }

//     return prod;
//   });

//  data.costoInsumos = data.productos.reduce(
//     (sum, p) => sum + Number(p.costoTotal ?? 0), 0
//   );
//  }


// ── 6. Calcular dosis total y costo por producto ──────────────
if (data.productos?.length) {
  data.productos = data.productos.map(p => {
    const prod = { ...p };

    // ── Dosis total ───────────────────────────────────────────
    if (data.numTanques && prod.dosisPorTanque) {
      // líquido fumigación: cc → litros
      prod.dosisTotal = (Number(prod.dosisPorTanque) / 1000) * Number(data.numTanques);
    } else if (prod.dosisPorUnidadMo && data.cantidadUnidadMo) {
      // sólido fertilización: kg × sacos echados
      prod.dosisTotal = Number(prod.dosisPorUnidadMo) * Number(data.cantidadUnidadMo);
    } else if (prod.dosisHa) {
      const parcelaAreaHa = (data as any).parcelaAreaHa;
      if (parcelaAreaHa) {
        prod.dosisTotal = Number(prod.dosisHa) * Number(parcelaAreaHa);
      }
    }

    // ── Precio unitario desde presentación ────────────────────
    if (prod.presentacionMl && prod.precioPresentacion) {
      // $/L o $/kg = precio_frasco ÷ (ml/1000)
      prod.precioUnitario = Number(
        (Number(prod.precioPresentacion) / (Number(prod.presentacionMl) / 1000)).toFixed(4)
      );
      // frascos/sacos usados
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

      // ── 7. Sumar costo de insumos ─────────────────────────────
    //   data.costoInsumos = data.productos.reduce(
    //     (sum, p) => sum + Number(p.costoTotal ?? 0), 0
    //   );
    // }

    // ── 8. Costo total de la actividad ────────────────────────────
    // El trigger de BD lo recalcula, pero lo calculamos aquí también
    data.costoTotalActividad =
      Number(data.costoManoObra    ?? 0) +
      Number(data.costoMaquinaria  ?? 0) +
      Number(data.costoInsumos     ?? 0) +
      Number(data.costoSembradores ?? 0);

    return this.repo.create(data);
  }
}


