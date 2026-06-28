import { IActividadParcelaRepository } from '../../../domain/repositories/IActividadParcelaRepository';
import { ActividadParcela }            from '../../../domain/entities/ActividadParcela';
import { AppDataSource }               from '../../../infrastructure/db/DataSource';
import { CicloActividad }              from '../../../domain/entities/CicloActividad';
import { Parcela }                     from '../../../domain/entities/Parcela';

const TIPOS_CON_PRODUCTOS = ['fertilizacion', 'fumigacion', 'soca_fertilizacion', 'soca_fumigacion'];
const TIPOS_COSECHA       = ['cosecha', 'cosecha_soca'];

type ActividadSinRelaciones = Omit<Partial<ActividadParcela>, 'detalleRiego' | 'detalleFumigacion' | 'detalleFertilizacion' | 'detalleCosecha' | 'detalleManoObra' | 'detalleMaquinaria' | 'productos'>;

interface CreateActividadInput extends ActividadSinRelaciones {
  detalleRiego?: { laminaAgua?: number };
  detalleFumigacion?: { plagaDetectada?: string; nivelDano?: string; capacidadTanque?: number; numTanques?: number };
  detalleFertilizacion?: Record<string, never>;
  detalleCosecha?: { rendimientoHa?: number; totalSacos?: number; humedad?: number; precioQq?: number; ingresoTotal?: number; costoCosecha?: number; destino?: string };
  detalleManoObra?: { numJornales?: number; pagoJornal?: number; unidadManoObra?: string; cantidadUnidadMo?: number; precioUnidadMo?: number; numTrabajadores?: number; descripcionUnidadMo?: string; numTareas?: number; precioTarea?: number; costoSembradores?: number; costoManoObra?: number };
  detalleMaquinaria?: { tipoMaquinaria?: string; unidadCobro?: string; cantidadUnidades?: number; costoPorUnidad?: number; costoMaquinaria?: number };
  productos?: any[];
}

export class CreateActividad {
  constructor(private repo: IActividadParcelaRepository) {}

  async execute(data: CreateActividadInput): Promise<ActividadParcela> {
    if (!data.parcelaId) throw new Error('La parcela es obligatoria');
    if (!data.tipo)      throw new Error('El tipo de actividad es obligatorio');

    if (!data.cicloId) {
      const cicloRepo   = AppDataSource.getRepository(CicloActividad);
      const cicloActivo = await cicloRepo.findOne({
        where: { parcelaId: data.parcelaId, estado: 'activo' },
      });
      if (cicloActivo) data.cicloId = cicloActivo.id;
    }

    if (TIPOS_CON_PRODUCTOS.includes(data.tipo)) {
      if (!data.productos || data.productos.length === 0) {
        throw new Error(`El tipo "${data.tipo}" requiere al menos un producto`);
      }
    }

    if (TIPOS_COSECHA.includes(data.tipo) && data.detalleCosecha) {
      const { totalSacos, precioQq } = data.detalleCosecha;
      if (totalSacos && precioQq) {
        data.detalleCosecha.ingresoTotal = Number(totalSacos) * Number(precioQq);
      }
    }

    if (data.detalleManoObra) {
      const mo = data.detalleManoObra;
      if (mo.unidadManoObra && mo.cantidadUnidadMo && mo.precioUnidadMo) {
        mo.costoManoObra = Number(mo.cantidadUnidadMo) * Number(mo.precioUnidadMo);
      } else if (mo.numJornales && mo.pagoJornal) {
        mo.costoManoObra    = Number(mo.numJornales) * Number(mo.pagoJornal);
        mo.unidadManoObra    = 'jornal';
        mo.cantidadUnidadMo  = Number(mo.numJornales);
        mo.precioUnidadMo    = Number(mo.pagoJornal);
      }

      if (data.tipo === 'siembra_trasplante' && mo.precioTarea) {
        if (!mo.numTareas) {
          const parcelaRepo = AppDataSource.getRepository(Parcela);
          const parcela      = await parcelaRepo.findOneBy({ id: data.parcelaId });
          if (parcela?.areaHa) {
            mo.numTareas = Number((Number(parcela.areaHa) * 16).toFixed(2));
          }
        }
        if (mo.numTareas) {
          mo.costoSembradores = Number(mo.numTareas) * Number(mo.precioTarea);
        }
      }
    }

    if (data.detalleMaquinaria) {
      const maq = data.detalleMaquinaria;
      if (maq.cantidadUnidades && maq.costoPorUnidad) {
        maq.costoMaquinaria = Number(maq.cantidadUnidades) * Number(maq.costoPorUnidad);
      }
    }

    if (data.productos?.length) {
      data.productos = data.productos.map((p: any) => {
        const prod = { ...p };

        if (data.detalleFumigacion?.numTanques && prod.dosisPorTanque) {
          prod.dosisTotal = (Number(prod.dosisPorTanque) / 1000) * Number(data.detalleFumigacion.numTanques);
        } else if (prod.dosisPorUnidadMo && data.detalleManoObra?.cantidadUnidadMo) {
          prod.dosisTotal = Number(prod.dosisPorUnidadMo) * Number(data.detalleManoObra.cantidadUnidadMo);
        } else if (prod.dosisHa) {
          const parcelaAreaHa = (data as any).parcelaAreaHa;
          if (parcelaAreaHa) {
            prod.dosisTotal = Number(prod.dosisHa) * Number(parcelaAreaHa);
          }
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

    data.costoTotalActividad =
      Number(data.detalleManoObra?.costoManoObra    ?? 0) +
      Number(data.detalleMaquinaria?.costoMaquinaria ?? 0) +
      Number(data.costoInsumos                        ?? 0) +
      Number(data.detalleManoObra?.costoSembradores  ?? 0);

    return this.repo.create(data, data.productos);
  }
}