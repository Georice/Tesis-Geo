import { TipoCiclo } from '../types/CicloTypes';

export interface FaseCicloProps {
  id: number;
  codigo: string;
  nombre: string;
  tipoCiclo: TipoCiclo;
  ordenFase: number;
  ordenMin: number;
  ordenMax: number;
  tiposActividad: string[];
  descripcion: string | null;
  createdAt: Date;
}

// Entidad de dominio pura: sin decoradores de TypeORM.
export class FaseCiclo {
  readonly id: number;
  readonly codigo: string;
  readonly nombre: string;
  readonly tipoCiclo: TipoCiclo;
  readonly ordenFase: number;
  readonly ordenMin: number;
  readonly ordenMax: number;
  readonly tiposActividad: string[];
  readonly descripcion: string | null;
  readonly createdAt: Date;

  private constructor(props: FaseCicloProps) {
    this.id             = props.id;
    this.codigo          = props.codigo;
    this.nombre          = props.nombre;
    this.tipoCiclo        = props.tipoCiclo;
    this.ordenFase        = props.ordenFase;
    this.ordenMin         = props.ordenMin;
    this.ordenMax         = props.ordenMax;
    this.tiposActividad   = props.tiposActividad;
    this.descripcion      = props.descripcion;
    this.createdAt        = props.createdAt;
  }

  static create(props: FaseCicloProps): FaseCiclo {
    if (!props.codigo?.trim()) throw new Error('El código de la fase es obligatorio');
    if (!props.tipoCiclo)      throw new Error('El tipo de ciclo de la fase es obligatorio');
    return new FaseCiclo(props);
  }
}
