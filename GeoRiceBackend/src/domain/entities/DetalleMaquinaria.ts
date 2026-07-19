import { UnidadCobroMaquinaria } from '../types/DetalleTypes';

export interface DetalleMaquinariaProps {
  actividadId: number;
  tipoMaquinaria: string | null;
  unidadCobro: UnidadCobroMaquinaria | null;
  cantidadUnidades: number | null;
  costoPorUnidad: number | null;
  costoMaquinaria: number | null;
}

export class DetalleMaquinaria {
  readonly actividadId: number;
  readonly tipoMaquinaria: string | null;
  readonly unidadCobro: UnidadCobroMaquinaria | null;
  readonly cantidadUnidades: number | null;
  readonly costoPorUnidad: number | null;
  readonly costoMaquinaria: number | null;

  private constructor(props: DetalleMaquinariaProps) {
    this.actividadId       = props.actividadId;
    this.tipoMaquinaria      = props.tipoMaquinaria;
    this.unidadCobro          = props.unidadCobro;
    this.cantidadUnidades     = props.cantidadUnidades;
    this.costoPorUnidad       = props.costoPorUnidad;
    this.costoMaquinaria      = props.costoMaquinaria;
  }

  static create(props: DetalleMaquinariaProps): DetalleMaquinaria {
    if (!props.actividadId) throw new Error('El detalle de maquinaria debe pertenecer a una actividad');
    return new DetalleMaquinaria(props);
  }
}
