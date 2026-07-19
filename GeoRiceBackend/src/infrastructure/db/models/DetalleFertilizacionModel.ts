import { Entity, PrimaryColumn, OneToOne, JoinColumn } from 'typeorm';
import { ActividadParcelaModel } from './ActividadParcelaModel';

// Reservada para futuras columnas específicas de fertilización.
@Entity('detalle_fertilizacion')
export class DetalleFertilizacionModel {
  @PrimaryColumn({ name: 'actividad_id' })
  actividadId!: number;

  @OneToOne(() => ActividadParcelaModel, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'actividad_id' })
  actividad!: ActividadParcelaModel;
}
