import {
  Entity, PrimaryGeneratedColumn, Column,
  CreateDateColumn, UpdateDateColumn,
} from 'typeorm';
import { TipoCiclo, EstadoCiclo } from '../../../domain/types/CicloTypes';

@Entity('ciclos_actividad')
export class CicloActividadModel {
  @PrimaryGeneratedColumn()
  id!: number;

  @Column({ name: 'parcela_id' })
  parcelaId!: number;

  @Column({ type: 'varchar', length: 30 })
  tipo!: TipoCiclo;

  @Column({ type: 'varchar', length: 20, default: 'activo' })
  estado!: EstadoCiclo;

  @Column({ name: 'fecha_inicio', type: 'timestamp' })
  fechaInicio!: Date;

  @Column({ name: 'fecha_fin', type: 'timestamp', nullable: true })
  fechaFin!: Date;

  @Column({ name: 'variedad_semilla', type: 'varchar', length: 100, nullable: true })
  variedadSemilla!: string;

  @Column({ name: 'area_sembrada', type: 'decimal', precision: 10, scale: 2, nullable: true })
  areaSembrada!: number;

  @Column({ type: 'text', nullable: true })
  observaciones!: string;

  @CreateDateColumn({ name: 'fecha_registro' })
  fechaRegistro!: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt!: Date;

  @Column({ name: 'created_by', type: 'text', nullable: true })
  createdBy!: string | null;

  @Column({ name: 'updated_by', type: 'text', nullable: true })
  updatedBy!: string | null;
}
