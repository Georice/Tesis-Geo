import { Entity, PrimaryColumn, Column, OneToOne, JoinColumn } from 'typeorm';
import { ActividadParcela } from './ActividadParcela';

@Entity('detalle_riego')
export class DetalleRiego {
  @PrimaryColumn({ name: 'actividad_id' })
  actividadId!: number;

  @OneToOne(() => ActividadParcela, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'actividad_id' })
  actividad!: ActividadParcela;

  @Column({ name: 'lamina_agua', type: 'decimal', precision: 8, scale: 2, nullable: true })
  laminaAgua!: number;
}