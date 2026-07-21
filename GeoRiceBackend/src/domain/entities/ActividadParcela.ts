import { TipoActividad, NivelAlerta, EstadoActividad } from '../types/ActividadTypes';
import { ProductoActividad } from './ProductoActividad';
import { FaseCiclo } from './FaseCiclo';
import { DetalleRiego } from './DetalleRiego';
import { DetalleFumigacion } from './DetalleFumigacion';
import { DetalleFertilizacion } from './DetalleFertilizacion';
import { DetalleCosecha } from './DetalleCosecha';
import { DetalleManoObra } from './DetalleManoObra';
import { DetalleMaquinaria } from './DetalleMaquinaria';

export interface ActividadParcelaProps {
  id: number;
  parcelaId: number;
  capaId: number | null;
  tipo: TipoActividad;
  fecha: Date;
  metodo: string | null;
  insumo: string | null;
  cantidad: number | null;
  unidad: string | null;
  nivelAlerta: NivelAlerta;
  observaciones: string | null;
  productos: ProductoActividad[];
  fechaRegistro: Date;
  cicloId: number | null;
  ordenPlantilla: number | null;
  faseId: number | null;
  fase: FaseCiclo | null;
  estado: EstadoActividad;
  fechaInicio: Date | null;
  fechaFin: Date | null;
  updatedAt: Date;
  createdBy: string | null;
  updatedBy: string | null;
  numeroActividad: number | null;
  costoInsumos: number | null;
  costoTotalActividad: number | null;
  detalleRiego: DetalleRiego | null;
  detalleFumigacion: DetalleFumigacion | null;
  detalleFertilizacion: DetalleFertilizacion | null;
  detalleCosecha: DetalleCosecha | null;
  detalleManoObra: DetalleManoObra | null;
  detalleMaquinaria: DetalleMaquinaria | null;
}

// Entidad de dominio pura (agregado raíz): sin decoradores de TypeORM.
// La persistencia vive en infrastructure/db/models/ActividadParcelaModel.ts
// y sus modelos de detalle asociados.
export class ActividadParcela {
  readonly id: number;
  readonly parcelaId: number;
  readonly capaId: number | null;
  readonly tipo: TipoActividad;
  readonly fecha: Date;
  readonly metodo: string | null;
  readonly insumo: string | null;
  readonly cantidad: number | null;
  readonly unidad: string | null;
  readonly nivelAlerta: NivelAlerta;
  readonly observaciones: string | null;
  readonly productos: ProductoActividad[];
  readonly fechaRegistro: Date;
  readonly cicloId: number | null;
  readonly ordenPlantilla: number | null;
  readonly faseId: number | null;
  readonly fase: FaseCiclo | null;
  readonly estado: EstadoActividad;
  readonly fechaInicio: Date | null;
  readonly fechaFin: Date | null;
  readonly updatedAt: Date;
  readonly createdBy: string | null;
  readonly updatedBy: string | null;
  readonly numeroActividad: number | null;
  readonly costoInsumos: number | null;
  readonly costoTotalActividad: number | null;
  readonly detalleRiego: DetalleRiego | null;
  readonly detalleFumigacion: DetalleFumigacion | null;
  readonly detalleFertilizacion: DetalleFertilizacion | null;
  readonly detalleCosecha: DetalleCosecha | null;
  readonly detalleManoObra: DetalleManoObra | null;
  readonly detalleMaquinaria: DetalleMaquinaria | null;

  private constructor(props: ActividadParcelaProps) {
    this.id                    = props.id;
    this.parcelaId              = props.parcelaId;
    this.capaId                 = props.capaId;
    this.tipo                   = props.tipo;
    this.fecha                  = props.fecha;
    this.metodo                 = props.metodo;
    this.insumo                 = props.insumo;
    this.cantidad                = props.cantidad;
    this.unidad                  = props.unidad;
    this.nivelAlerta             = props.nivelAlerta;
    this.observaciones           = props.observaciones;
    this.productos               = props.productos;
    this.fechaRegistro           = props.fechaRegistro;
    this.cicloId                 = props.cicloId;
    this.ordenPlantilla          = props.ordenPlantilla;
    this.faseId                  = props.faseId;
    this.fase                    = props.fase;
    this.estado                  = props.estado;
    this.fechaInicio             = props.fechaInicio;
    this.fechaFin                = props.fechaFin;
    this.updatedAt               = props.updatedAt;
    this.createdBy               = props.createdBy;
    this.updatedBy               = props.updatedBy;
    this.numeroActividad         = props.numeroActividad;
    this.costoInsumos            = props.costoInsumos;
    this.costoTotalActividad     = props.costoTotalActividad;
    this.detalleRiego            = props.detalleRiego;
    this.detalleFumigacion       = props.detalleFumigacion;
    this.detalleFertilizacion    = props.detalleFertilizacion;
    this.detalleCosecha          = props.detalleCosecha;
    this.detalleManoObra         = props.detalleManoObra;
    this.detalleMaquinaria       = props.detalleMaquinaria;
  }

  static create(props: ActividadParcelaProps): ActividadParcela {
    if (!props.parcelaId) throw new Error('La parcela es obligatoria');
    if (!props.tipo)      throw new Error('El tipo de actividad es obligatorio');
    return new ActividadParcela(props);
  }
}
