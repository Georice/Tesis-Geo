import {
  Entity, PrimaryGeneratedColumn, Column,
  ManyToOne, JoinColumn,
} from 'typeorm';
import { ActividadParcela } from './ActividadParcela';

@Entity('productos_actividad')
export class ProductoActividad {
  @PrimaryGeneratedColumn()
  id!: number;

  @Column({ name: 'actividad_id' })
  actividadId!: number;

  @ManyToOne(() => ActividadParcela, a => a.productos, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'actividad_id' })
  actividad!: ActividadParcela;

  @Column({ type: 'varchar', length: 100 })
  nombre!: string;

  @Column({ type: 'varchar', length: 30, nullable: true })
  tipo!: 'herbicida' | 'fungicida' | 'insecticida' | 'fertilizante' | 'abono' | 'corrector' | 'bioestimulante' | 'otro';

  @Column({ type: 'decimal', precision: 10, scale: 4, nullable: true })
  dosis!: number;

  @Column({ type: 'varchar', length: 20, nullable: true })
  unidad!: string;

  // Dosis específica por tanque de fumigación
  @Column({ name: 'dosis_por_tanque', type: 'decimal', precision: 10, scale: 4, nullable: true })
  dosisPorTanque!: number;

  // Calculado: dosisPorTanque × numTanques
  @Column({ name: 'dosis_total', type: 'decimal', precision: 10, scale: 4, nullable: true })
  dosisTotal!: number;
}