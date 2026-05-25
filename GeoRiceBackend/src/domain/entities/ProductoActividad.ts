import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, ManyToOne, JoinColumn } from 'typeorm';
import { ActividadParcela } from './ActividadParcela';

@Entity('productos_actividad')
export class ProductoActividad {
  @PrimaryGeneratedColumn()
  id!: number;

  @Column({ name: 'actividad_id' })
  actividadId!: number;

  @ManyToOne(() => ActividadParcela, actividad => actividad.productos, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'actividad_id' })
  actividad!: ActividadParcela;

  @Column({ type: 'varchar', length: 100 })
  nombre!: string;

  @Column({
    type: 'varchar',
    length: 50,
    nullable: true,
  })
  tipo!: 'herbicida' | 'fungicida' | 'insecticida' | 'fertilizante' | 'abono' | 'corrector' | 'bioestimulante' | 'otro';

  @Column({ type: 'decimal', precision: 10, scale: 4, nullable: true })
  dosis!: number;

  @Column({ type: 'varchar', length: 20, nullable: true })
  unidad!: string;

  @CreateDateColumn({ name: 'fecha_registro' })
  fechaRegistro!: Date;
}