export interface DetalleFertilizacionProps {
  actividadId: number;
}

// Reservada para futuras columnas específicas de fertilización.
export class DetalleFertilizacion {
  readonly actividadId: number;

  private constructor(props: DetalleFertilizacionProps) {
    this.actividadId = props.actividadId;
  }

  static create(props: DetalleFertilizacionProps): DetalleFertilizacion {
    if (!props.actividadId) throw new Error('El detalle de fertilización debe pertenecer a una actividad');
    return new DetalleFertilizacion(props);
  }
}
