import { DestinoCosecha } from '../types/DetalleTypes';

export interface DetalleCosechaProps {
  actividadId: number;
  rendimientoHa: number | null;
  totalSacos: number | null;
  humedad: number | null;
  precioQq: number | null;
  ingresoTotal: number | null;
  costoCosecha: number | null;
  destino: DestinoCosecha | null;
}

export class DetalleCosecha {
  readonly actividadId: number;
  readonly rendimientoHa: number | null;
  readonly totalSacos: number | null;
  readonly humedad: number | null;
  readonly precioQq: number | null;
  readonly ingresoTotal: number | null;
  readonly costoCosecha: number | null;
  readonly destino: DestinoCosecha | null;

  private constructor(props: DetalleCosechaProps) {
    this.actividadId    = props.actividadId;
    this.rendimientoHa   = props.rendimientoHa;
    this.totalSacos       = props.totalSacos;
    this.humedad           = props.humedad;
    this.precioQq          = props.precioQq;
    this.ingresoTotal      = props.ingresoTotal;
    this.costoCosecha      = props.costoCosecha;
    this.destino            = props.destino;
  }

  static create(props: DetalleCosechaProps): DetalleCosecha {
    if (!props.actividadId) throw new Error('El detalle de cosecha debe pertenecer a una actividad');
    return new DetalleCosecha(props);
  }
}
