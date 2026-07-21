import { TipoProducto } from '../types/ProductoTypes';

export interface ProductoActividadProps {
  id: number;
  actividadId: number;
  nombre: string;
  tipo: TipoProducto | null;
  dosis: number | null;
  unidad: string | null;
  dosisPorTanque: number | null;
  dosisHa: number | null;
  dosisPorUnidadMo: number | null;
  dosisTotal: number | null;
  presentacionMl: number | null;
  precioPresentacion: number | null;
  frascoUsados: number | null;
  precioUnitario: number | null;
  costoTotal: number | null;
  updatedAt: Date;
}

// Entidad de dominio pura: sin decoradores de TypeORM.
export class ProductoActividad {
  readonly id: number;
  readonly actividadId: number;
  readonly nombre: string;
  readonly tipo: TipoProducto | null;
  readonly dosis: number | null;
  readonly unidad: string | null;
  readonly dosisPorTanque: number | null;
  readonly dosisHa: number | null;
  readonly dosisPorUnidadMo: number | null;
  readonly dosisTotal: number | null;
  readonly presentacionMl: number | null;
  readonly precioPresentacion: number | null;
  readonly frascoUsados: number | null;
  readonly precioUnitario: number | null;
  readonly costoTotal: number | null;
  readonly updatedAt: Date;

  private constructor(props: ProductoActividadProps) {
    this.id                 = props.id;
    this.actividadId         = props.actividadId;
    this.nombre              = props.nombre;
    this.tipo                = props.tipo;
    this.dosis                = props.dosis;
    this.unidad               = props.unidad;
    this.dosisPorTanque       = props.dosisPorTanque;
    this.dosisHa              = props.dosisHa;
    this.dosisPorUnidadMo     = props.dosisPorUnidadMo;
    this.dosisTotal           = props.dosisTotal;
    this.presentacionMl       = props.presentacionMl;
    this.precioPresentacion   = props.precioPresentacion;
    this.frascoUsados         = props.frascoUsados;
    this.precioUnitario       = props.precioUnitario;
    this.costoTotal           = props.costoTotal;
    this.updatedAt            = props.updatedAt;
  }

  static create(props: ProductoActividadProps): ProductoActividad {
    if (!props.nombre?.trim()) throw new Error('El nombre del producto es obligatorio');
    return new ProductoActividad(props);
  }
}
