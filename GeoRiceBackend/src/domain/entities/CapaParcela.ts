import {
  Entity, PrimaryGeneratedColumn, Column,
  CreateDateColumn, UpdateDateColumn,
  ManyToOne, JoinColumn,
} from 'typeorm';
import { Parcela } from './Parcela';

@Entity('capas_parcela')
export class CapaParcela {
  @PrimaryGeneratedColumn()
  id!: number;

  @Column({ name: 'parcela_id' })
  parcelaId!: number;

  @ManyToOne(() => Parcela, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'parcela_id' })
  parcela!: Parcela;

  @Column({ type: 'varchar', length: 20 })
  tipo!: 'activo' | 'descanso' | 'lindero';

  @Column({
    type: 'geometry',
    spatialFeatureType: 'Geometry',
    srid: 4326,
  })
  geometria!: object;

  @Column({ name: 'ndvi_estimado', type: 'decimal', precision: 4, scale: 2, nullable: true })
  ndviEstimado!: number;

  @CreateDateColumn({ name: 'fecha_actualizacion' })
  fechaActualizacion!: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt!: Date;

  @Column({ name: 'created_by', type: 'int', nullable: true })
  createdBy!: number | null;

  @Column({ name: 'updated_by', type: 'int', nullable: true })
  updatedBy!: number | null;
}
