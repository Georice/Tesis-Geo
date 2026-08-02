import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn } from 'typeorm';
import { TipoCiclo } from '../../../domain/types/CicloTypes';

@Entity('fases_ciclo')
export class FaseCicloModel {
  @PrimaryGeneratedColumn()
  id!: number;

  @Column({ type: 'varchar', length: 5 })
  codigo!: string; // F1...F6

  @Column({ type: 'varchar', length: 100 })
  nombre!: string;

  @Column({ name: 'tipo_ciclo', type: 'varchar', length: 20 })
  tipoCiclo!: TipoCiclo;

  @Column({ name: 'orden_fase' })
  ordenFase!: number;

  @Column({ name: 'orden_min' })
  ordenMin!: number;

  @Column({ name: 'orden_max' })
  ordenMax!: number;

  @Column({ name: 'tipos_actividad', type: 'varchar', length: 30, array: true })
  tiposActividad!: string[];

  @Column({ type: 'text', nullable: true })
  descripcion!: string;

  @CreateDateColumn({ name: 'created_at' })
  createdAt!: Date;
}
