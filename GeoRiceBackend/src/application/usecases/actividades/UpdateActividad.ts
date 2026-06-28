import { IActividadParcelaRepository, CreateActividadData } from '../../../domain/repositories/IActividadParcelaRepository';
import { ActividadParcela }            from '../../../domain/entities/ActividadParcela';
import { AppDataSource }               from '../../../infrastructure/db/DataSource';
import { Parcela }                     from '../../../domain/entities/Parcela';

const TIPOS_COSECHA = ['cosecha', 'cosecha_soca'];

export class UpdateActividad {
  constructor(private repo: IActividadParcelaRepository) {}

  async execute(id: number, data: CreateActividadData): Promise<ActividadParcela | null> {
    if (!id) throw new Error('El id de la actividad es obligatorio');

    const actividad = await this.repo.findById(id);
    if (!actividad) throw new Error('Actividad no encontrada');

    const tipo = data.tipo ?? actividad.tipo;

    // ── 1. Recalcular ingreso cosecha ─────────────────────────────
    if (TIPOS_COSECHA.includes(tipo)) {
      const sacos  = data.detalleCosecha?.totalSacos ?? actividad.detalleCosecha?.totalSacos;
      const precio = data.detalleCosecha?.precioQq   ?? actividad.detalleCosecha?.precioQq;
      if (sacos && precio) {
        data.detalleCosecha = {
          ...actividad.detalleCosecha,
          ...data.detalleCosecha,
          ingresoTotal: Number(sacos) * Number(precio),
        };
      }
    }

    // ── 2. Recalcular mano de obra ────────────────────────────────
    const unidad   = data.detalleManoObra?.unidadManoObra   ?? actividad.detalleManoObra?.unidadManoObra;
    const cantMo   = data.detalleManoObra?.cantidadUnidadMo  ?? actividad.detalleManoObra?.cantidadUnidadMo;
    const precioMo = data.detalleManoObra?.precioUnidadMo    ?? actividad.detalleManoObra?.precioUnidadMo;

    let costoManoObra: number | undefined;
    let unidadFinal = unidad;
    let cantidadFinal = cantMo;
    let precioFinal = precioMo;

    if (unidad && cantMo && precioMo) {
      costoManoObra = Number(cantMo) * Number(precioMo);
    } else {
      const jornales = data.detalleManoObra?.numJornales ?? actividad.detalleManoObra?.numJornales;
      const pago     = data.detalleManoObra?.pagoJornal  ?? actividad.detalleManoObra?.pagoJornal;
      if (jornales && pago) {
        costoManoObra = Number(jornales) * Number(pago);
        unidadFinal   = 'jornal';
        cantidadFinal = Number(jornales);
        precioFinal   = Number(pago);
      }
    }

    // ── 3. Recalcular sembradores ─────────────────────────────────
    let numTareas      = data.detalleManoObra?.numTareas   ?? actividad.detalleManoObra?.numTareas;
    const precioTarea  = data.detalleManoObra?.precioTarea ?? actividad.detalleManoObra?.precioTarea;
    let costoSembradores: number | undefined;

    if (tipo === 'siembra_trasplante') {
      if (!numTareas) {
        const parcelaRepo = AppDataSource.getRepository(Parcela);
        const parcela      = await parcelaRepo.findOneBy({ id: actividad.parcelaId });
        if (parcela?.areaHa) {
          numTareas = Number((Number(parcela.areaHa) * 16).toFixed(2));
        }
      }
      if (numTareas && precioTarea) {
        costoSembradores = Number(numTareas) * Number(precioTarea);
      }
    }

    if (data.detalleManoObra || costoManoObra !== undefined || costoSembradores !== undefined) {
      data.detalleManoObra = {
        ...actividad.detalleManoObra,
        ...data.detalleManoObra,
        ...(unidadFinal !== undefined && { unidadManoObra: unidadFinal }),
        ...(cantidadFinal !== undefined && { cantidadUnidadMo: cantidadFinal }),
        ...(precioFinal !== undefined && { precioUnidadMo: precioFinal }),
        ...(costoManoObra !== undefined && { costoManoObra }),
        ...(numTareas !== undefined && { numTareas }),
        ...(costoSembradores !== undefined && { costoSembradores }),
      };
    }

    // ── 4. Recalcular maquinaria ───────────────────────────────────
    const cantUnidadesMaq = data.detalleMaquinaria?.cantidadUnidades ?? actividad.detalleMaquinaria?.cantidadUnidades;
    const costoPorUnidad   = data.detalleMaquinaria?.costoPorUnidad   ?? actividad.detalleMaquinaria?.costoPorUnidad;
    let costoMaquinaria: number | undefined;
    if (cantUnidadesMaq && costoPorUnidad) {
      costoMaquinaria = Number(cantUnidadesMaq) * Number(costoPorUnidad);
    }
    if (data.detalleMaquinaria || costoMaquinaria !== undefined) {
      data.detalleMaquinaria = {
        ...actividad.detalleMaquinaria,
        ...data.detalleMaquinaria,
        ...(costoMaquinaria !== undefined && { costoMaquinaria }),
      };
    }

    // ── 5. Recalcular productos ─────────────────────────────────────
    const tanques = data.detalleFumigacion?.numTanques ?? actividad.detalleFumigacion?.numTanques;
    const cantMoParaProductos = cantidadFinal ?? cantMo;

    if (data.productos?.length) {
      data.productos = data.productos.map((p: any) => {
        const prod = { ...p };

        if (tanques && prod.dosisPorTanque) {
          prod.dosisTotal = (Number(prod.dosisPorTanque) / 1000) * Number(tanques);
        } else if (prod.dosisPorUnidadMo && cantMoParaProductos) {
          prod.dosisTotal = Number(prod.dosisPorUnidadMo) * Number(cantMoParaProductos);
        }

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

        if (prod.dosisTotal && prod.precioUnitario) {
          prod.costoTotal = Number(
            (Number(prod.dosisTotal) * Number(prod.precioUnitario)).toFixed(2)
          );
        }

        return prod;
      });

      data.costoInsumos = data.productos.reduce(
        (sum: number, p: any) => sum + Number(p.costoTotal ?? 0), 0
      );
    }

    // ── 6. Recalcular costo total ───────────────────────────────────
    data.costoTotalActividad =
      Number(data.detalleManoObra?.costoManoObra    ?? actividad.detalleManoObra?.costoManoObra    ?? 0) +
      Number(data.detalleMaquinaria?.costoMaquinaria ?? actividad.detalleMaquinaria?.costoMaquinaria ?? 0) +
      Number(data.costoInsumos                        ?? actividad.costoInsumos                        ?? 0) +
      Number(data.detalleManoObra?.costoSembradores  ?? actividad.detalleManoObra?.costoSembradores  ?? 0);

    return this.repo.update(id, data);
  }
}