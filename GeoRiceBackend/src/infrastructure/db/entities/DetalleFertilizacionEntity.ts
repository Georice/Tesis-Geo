import { Entity, PrimaryColumn, OneToOne, JoinColumn } from 'typeorm';
import { ActividadParcelaEntity } from './ActividadParcelaEntity';

// Reservada para futuras columnas específicas de fertilización.
@Entity('detalle_fertilizacion')
export class DetalleFertilizacionEntity {
  @PrimaryColumn({ name: 'actividad_id' })
  actividadId!: number;

  @OneToOne(() => ActividadParcelaEntity, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'actividad_id' })
  actividad!: ActividadParcelaEntity;
}
