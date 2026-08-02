import {
  Entity, PrimaryGeneratedColumn, Column,
  CreateDateColumn, UpdateDateColumn,
} from 'typeorm';
import { TipoCapa } from '../../../domain/types/CapaTypes';

@Entity('capas_parcela')
export class CapaParcelaModel {
  @PrimaryGeneratedColumn()
  id!: number;

  @Column({ name: 'parcela_id' })
  parcelaId!: number;

  @Column({ type: 'varchar', length: 20 })
  tipo!: TipoCapa;

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

  @Column({ name: 'created_by', type: 'text', nullable: true })
  createdBy!: string | null;

  @Column({ name: 'updated_by', type: 'text', nullable: true })
  updatedBy!: string | null;
}
