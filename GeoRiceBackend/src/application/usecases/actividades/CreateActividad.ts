import { IActividadParcelaRepository, ProductoComando } from '../../../domain/repositories/IActividadParcelaRepository';
import { ICicloRepository } from '../../../domain/repositories/ICicloRepository';
import { IParcelaRepository } from '../../../domain/repositories/IParcelaRepository';
import { ActividadParcela } from '../../../domain/entities/ActividadParcela';
import { CreateActividadDto } from '../../dtos/actividades/ActividadDtos';

const TIPOS_CON_PRODUCTOS = ['fertilizacion', 'fumigacion', 'soca_fertilizacion', 'soca_fumigacion'];
const TIPOS_COSECHA       = ['cosecha', 'cosecha_soca'];

export class CreateActividad {
  constructor(
    private repo: IActividadParcelaRepository,
    private cicloRepo: ICicloRepository,
    private parcelaRepo: IParcelaRepository,
  ) {}

  async execute(data: CreateActividadDto): Promise<ActividadParcela> {
    if (!data.parcelaId) throw new Error('La parcela es obligatoria');
    if (!data.tipo)      throw new Error('El tipo de actividad es obligatorio');

    if (!data.cicloId) {
      // Si hay un ciclo activo en la parcela, la actividad se asocia a él
      // automáticamente. Si no lo hay, queda como actividad suelta (sin
      // ciclo ni fase) — es un caso válido, el trigger de la base ya no lo
      // rechaza.
      const cicloActivo = await this.cicloRepo.findActivoByParcela(data.parcelaId);
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
          const areaHa = await this.parcelaRepo.findAreaHa(data.parcelaId);
          if (areaHa) {
            mo.numTareas = Number((areaHa * 16).toFixed(2));
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
      data.productos = data.productos.map((p: ProductoComando) => {
        const prod = { ...p };

        if (data.detalleFumigacion?.numTanques && prod.dosisPorTanque) {
          prod.dosisTotal = (Number(prod.dosisPorTanque) / 1000) * Number(data.detalleFumigacion.numTanques);
        } else if (prod.dosisPorUnidadMo && data.detalleManoObra?.cantidadUnidadMo) {
          prod.dosisTotal = Number(prod.dosisPorUnidadMo) * Number(data.detalleManoObra.cantidadUnidadMo);
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
        (sum: number, p: ProductoComando) => sum + Number(p.costoTotal ?? 0), 0
      );
    }

    data.costoTotalActividad =
      Number(data.detalleManoObra?.costoManoObra    ?? 0) +
      Number(data.detalleMaquinaria?.costoMaquinaria ?? 0) +
      Number(data.costoInsumos                        ?? 0) +
      Number(data.detalleManoObra?.costoSembradores  ?? 0);

    const { productos, ...comando } = data;
    return this.repo.create(comando, productos);
  }
}
