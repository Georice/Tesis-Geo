import { TipoCiclo, EstadoCiclo } from '../types/CicloTypes';

export interface CicloActividadProps {
  id: number;
  parcelaId: number;
  tipo: TipoCiclo;
  estado: EstadoCiclo;
  fechaInicio: Date;
  fechaFin: Date | null;
  variedadSemilla: string | null;
  areaSembrada: number | null;
  observaciones: string | null;
  fechaRegistro: Date;
  updatedAt: Date;
  createdBy: string | null;
  updatedBy: string | null;
}

// Entidad de dominio pura: sin decoradores de TypeORM.
export class CicloActividad {
  readonly id: number;
  readonly parcelaId: number;
  readonly tipo: TipoCiclo;
  readonly estado: EstadoCiclo;
  readonly fechaInicio: Date;
  readonly fechaFin: Date | null;
  readonly variedadSemilla: string | null;
  readonly areaSembrada: number | null;
  readonly observaciones: string | null;
  readonly fechaRegistro: Date;
  readonly updatedAt: Date;
  readonly createdBy: string | null;
  readonly updatedBy: string | null;

  private constructor(props: CicloActividadProps) {
    this.id              = props.id;
    this.parcelaId        = props.parcelaId;
    this.tipo             = props.tipo;
    this.estado           = props.estado;
    this.fechaInicio      = props.fechaInicio;
    this.fechaFin         = props.fechaFin;
    this.variedadSemilla  = props.variedadSemilla;
    this.areaSembrada     = props.areaSembrada;
    this.observaciones    = props.observaciones;
    this.fechaRegistro    = props.fechaRegistro;
    this.updatedAt        = props.updatedAt;
    this.createdBy        = props.createdBy;
    this.updatedBy        = props.updatedBy;
  }

  static create(props: CicloActividadProps): CicloActividad {
    if (!props.parcelaId)   throw new Error('La parcela es obligatoria');
    if (!props.tipo)        throw new Error('El tipo de ciclo es obligatorio');
    if (!props.fechaInicio) throw new Error('La fecha de inicio es obligatoria');
    return new CicloActividad(props);
  }

  get activo(): boolean {
    return this.estado === 'activo';
  }
}
