import { Entity, PrimaryColumn, Column, OneToOne, JoinColumn } from 'typeorm';
import { ActividadParcelaModel } from './ActividadParcelaModel';

@Entity('detalle_riego')
export class DetalleRiegoModel {
  @PrimaryColumn({ name: 'actividad_id' })
  actividadId!: number;

  @OneToOne(() => ActividadParcelaModel, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'actividad_id' })
  actividad!: ActividadParcelaModel;

  @Column({ name: 'lamina_agua', type: 'decimal', precision: 8, scale: 2, nullable: true })
  laminaAgua!: number;
}
