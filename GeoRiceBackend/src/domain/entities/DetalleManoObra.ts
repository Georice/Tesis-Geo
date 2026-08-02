import { UnidadManoObra } from '../types/DetalleTypes';

export interface DetalleManoObraProps {
  actividadId: number;
  numJornales: number | null;
  pagoJornal: number | null;
  costoManoObra: number | null;
  unidadManoObra: UnidadManoObra | null;
  cantidadUnidadMo: number | null;
  precioUnidadMo: number | null;
  numTrabajadores: number | null;
  pagoPorTrabajador: number | null;
  descripcionUnidadMo: string | null;
  numTareas: number | null;
  precioTarea: number | null;
  costoSembradores: number | null;
}

export class DetalleManoObra {
  readonly actividadId: number;
  readonly numJornales: number | null;
  readonly pagoJornal: number | null;
  readonly costoManoObra: number | null;
  readonly unidadManoObra: UnidadManoObra | null;
  readonly cantidadUnidadMo: number | null;
  readonly precioUnidadMo: number | null;
  readonly numTrabajadores: number | null;
  readonly pagoPorTrabajador: number | null;
  readonly descripcionUnidadMo: string | null;
  readonly numTareas: number | null;
  readonly precioTarea: number | null;
  readonly costoSembradores: number | null;

  private constructor(props: DetalleManoObraProps) {
    this.actividadId          = props.actividadId;
    this.numJornales           = props.numJornales;
    this.pagoJornal             = props.pagoJornal;
    this.costoManoObra          = props.costoManoObra;
    this.unidadManoObra         = props.unidadManoObra;
    this.cantidadUnidadMo       = props.cantidadUnidadMo;
    this.precioUnidadMo         = props.precioUnidadMo;
    this.numTrabajadores        = props.numTrabajadores;
    this.pagoPorTrabajador      = props.pagoPorTrabajador;
    this.descripcionUnidadMo    = props.descripcionUnidadMo;
    this.numTareas              = props.numTareas;
    this.precioTarea            = props.precioTarea;
    this.costoSembradores       = props.costoSembradores;
  }

  static create(props: DetalleManoObraProps): DetalleManoObra {
    if (!props.actividadId) throw new Error('El detalle de mano de obra debe pertenecer a una actividad');
    return new DetalleManoObra(props);
  }
}
