export interface ZonaProps {
  id: number;
  usuarioId: string;
  nombre: string;
  descripcion: string | null;
  geometria: object | null;
  fechaCreacion: Date;
  updatedAt: Date;
  createdBy: string | null;
  updatedBy: string | null;
}

// Entidad de dominio pura: sin decoradores de TypeORM.
export class Zona {
  readonly id: number;
  readonly usuarioId: string;
  readonly nombre: string;
  readonly descripcion: string | null;
  readonly geometria: object | null;
  readonly fechaCreacion: Date;
  readonly updatedAt: Date;
  readonly createdBy: string | null;
  readonly updatedBy: string | null;

  private constructor(props: ZonaProps) {
    this.id            = props.id;
    this.usuarioId      = props.usuarioId;
    this.nombre         = props.nombre;
    this.descripcion    = props.descripcion;
    this.geometria      = props.geometria;
    this.fechaCreacion  = props.fechaCreacion;
    this.updatedAt      = props.updatedAt;
    this.createdBy      = props.createdBy;
    this.updatedBy      = props.updatedBy;
  }

  static create(props: ZonaProps): Zona {
    if (!props.nombre?.trim()) throw new Error('El nombre de la zona es obligatorio');
    return new Zona(props);
  }
}
