import { Entity, PrimaryColumn, Column, OneToOne, JoinColumn } from 'typeorm';
import { ActividadParcelaEntity } from './ActividadParcelaEntity';

@Entity('detalle_riego')
export class DetalleRiegoEntity {
  @PrimaryColumn({ name: 'actividad_id' })
  actividadId!: number;

  @OneToOne(() => ActividadParcelaEntity, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'actividad_id' })
  actividad!: ActividadParcelaEntity;

  @Column({ name: 'lamina_agua', type: 'decimal', precision: 8, scale: 2, nullable: true })
  laminaAgua!: number;
}
