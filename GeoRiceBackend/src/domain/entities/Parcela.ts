import { EstadoParcela, CicloActualParcela } from '../types/ParcelaTypes';

export interface ParcelaProps {
  id: number;
  usuarioId: string;
  zonaId: number | null;
  nombre: string;
  propietario: string | null;
  cultivo: string;
  geometria: object;
  estado: EstadoParcela;
  cicloActual: CicloActualParcela | null;
  areaHa: number;
  areaCuadras: number;
  fechaCreacion: Date;
  updatedAt: Date;
  createdBy: string | null;
  updatedBy: string | null;
}

// Entidad de dominio pura: sin decoradores de TypeORM.
// La persistencia vive en infrastructure/db/models/ParcelaModel.ts.
export class Parcela {
  readonly id: number;
  readonly usuarioId: string;
  readonly zonaId: number | null;
  readonly nombre: string;
  readonly propietario: string | null;
  readonly cultivo: string;
  readonly geometria: object;
  readonly estado: EstadoParcela;
  readonly cicloActual: CicloActualParcela | null;
  readonly areaHa: number;
  readonly areaCuadras: number;
  readonly fechaCreacion: Date;
  readonly updatedAt: Date;
  readonly createdBy: string | null;
  readonly updatedBy: string | null;

  private constructor(props: ParcelaProps) {
    this.id            = props.id;
    this.usuarioId      = props.usuarioId;
    this.zonaId         = props.zonaId;
    this.nombre         = props.nombre;
    this.propietario    = props.propietario;
    this.cultivo        = props.cultivo;
    this.geometria      = props.geometria;
    this.estado         = props.estado;
    this.cicloActual    = props.cicloActual;
    this.areaHa         = props.areaHa;
    this.areaCuadras    = props.areaCuadras;
    this.fechaCreacion  = props.fechaCreacion;
    this.updatedAt      = props.updatedAt;
    this.createdBy      = props.createdBy;
    this.updatedBy      = props.updatedBy;
  }

  // Factory: garantiza las invariantes mínimas de una Parcela válida.
  static create(props: ParcelaProps): Parcela {
    if (!props.nombre?.trim())  throw new Error('El nombre de la parcela es obligatorio');
    if (!props.cultivo?.trim()) throw new Error('El cultivo es obligatorio');
    if (!props.geometria)       throw new Error('La geometría es obligatoria');
    return new Parcela(props);
  }
}
