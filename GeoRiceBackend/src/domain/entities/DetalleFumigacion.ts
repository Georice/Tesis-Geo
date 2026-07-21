import { NivelDano } from '../types/DetalleTypes';

export interface DetalleFumigacionProps {
  actividadId: number;
  plagaDetectada: string | null;
  nivelDano: NivelDano | null;
  capacidadTanque: number | null;
  numTanques: number | null;
}

export class DetalleFumigacion {
  readonly actividadId: number;
  readonly plagaDetectada: string | null;
  readonly nivelDano: NivelDano | null;
  readonly capacidadTanque: number | null;
  readonly numTanques: number | null;

  private constructor(props: DetalleFumigacionProps) {
    this.actividadId      = props.actividadId;
    this.plagaDetectada    = props.plagaDetectada;
    this.nivelDano          = props.nivelDano;
    this.capacidadTanque    = props.capacidadTanque;
    this.numTanques         = props.numTanques;
  }

  static create(props: DetalleFumigacionProps): DetalleFumigacion {
    if (!props.actividadId) throw new Error('El detalle de fumigación debe pertenecer a una actividad');
    return new DetalleFumigacion(props);
  }
}
