import { TipoCapa } from '../types/CapaTypes';

export interface CapaParcelaProps {
  id: number;
  parcelaId: number;
  tipo: TipoCapa;
  geometria: object;
  ndviEstimado: number | null;
  fechaActualizacion: Date;
  updatedAt: Date;
  createdBy: string | null;
  updatedBy: string | null;
}

// Entidad de dominio pura: sin decoradores de TypeORM.
export class CapaParcela {
  readonly id: number;
  readonly parcelaId: number;
  readonly tipo: TipoCapa;
  readonly geometria: object;
  readonly ndviEstimado: number | null;
  readonly fechaActualizacion: Date;
  readonly updatedAt: Date;
  readonly createdBy: string | null;
  readonly updatedBy: string | null;

  private constructor(props: CapaParcelaProps) {
    this.id                 = props.id;
    this.parcelaId          = props.parcelaId;
    this.tipo                = props.tipo;
    this.geometria           = props.geometria;
    this.ndviEstimado        = props.ndviEstimado;
    this.fechaActualizacion  = props.fechaActualizacion;
    this.updatedAt           = props.updatedAt;
    this.createdBy           = props.createdBy;
    this.updatedBy           = props.updatedBy;
  }

  static create(props: CapaParcelaProps): CapaParcela {
    if (!props.parcelaId) throw new Error('La parcela es obligatoria');
    if (!props.geometria) throw new Error('La geometría de la capa es obligatoria');
    return new CapaParcela(props);
  }
}
