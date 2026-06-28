import { Entity, PrimaryColumn, OneToOne, JoinColumn } from 'typeorm';
import { ActividadParcela } from './ActividadParcela';

// Reservada para futuras columnas específicas de fertilización.
@Entity('detalle_fertilizacion')
export class DetalleFertilizacion {
  @PrimaryColumn({ name: 'actividad_id' })
  actividadId!: number;

  @OneToOne(() => ActividadParcela, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'actividad_id' })
  actividad!: ActividadParcela;
}