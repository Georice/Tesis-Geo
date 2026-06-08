import {
  Entity, PrimaryGeneratedColumn, Column,
  CreateDateColumn, UpdateDateColumn,
  ManyToOne, JoinColumn,
} from 'typeorm';
import { Parcela } from './Parcela';

@Entity('ciclos_actividad')
export class CicloActividad {
  @PrimaryGeneratedColumn()
  id!: number;

  @Column({ name: 'parcela_id' })
  parcelaId!: number;

  @ManyToOne(() => Parcela, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'parcela_id' })
  parcela!: Parcela;

  @Column({ type: 'varchar', length: 30 })
  tipo!: 'siembra_boleo' | 'siembra_trasplante' | 'soca' | 'resoca';

  @Column({ type: 'varchar', length: 20, default: 'activo' })
  estado!: 'activo' | 'completado' | 'cancelado';

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

  @Column({ name: 'created_by', type: 'int', nullable: true })
  createdBy!: number | null;

  @Column({ name: 'updated_by', type: 'int', nullable: true })
  updatedBy!: number | null;
}
