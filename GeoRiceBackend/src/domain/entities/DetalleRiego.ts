export interface DetalleRiegoProps {
  actividadId: number;
  laminaAgua: number | null;
}

export class DetalleRiego {
  readonly actividadId: number;
  readonly laminaAgua: number | null;

  private constructor(props: DetalleRiegoProps) {
    this.actividadId = props.actividadId;
    this.laminaAgua  = props.laminaAgua;
  }

  static create(props: DetalleRiegoProps): DetalleRiego {
    if (!props.actividadId) throw new Error('El detalle de riego debe pertenecer a una actividad');
    return new DetalleRiego(props);
  }
}
