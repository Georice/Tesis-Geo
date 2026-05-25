import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, ManyToOne, JoinColumn } from 'typeorm';
import { Zona } from './Zona';

@Entity('parcelas')
export class Parcela {
  @PrimaryGeneratedColumn()
  id!: number;

  @Column({ name: 'zona_id', nullable: true })
  zonaId!: number;

  @ManyToOne(() => Zona, { nullable: true, onDelete: 'SET NULL' })
  @JoinColumn({ name: 'zona_id' })
  zona!: Zona;

  @Column({ type: 'varchar' })
  nombre!: string;

  @Column({ type: 'varchar' })
  propietario!: string;

  @Column({ type: 'varchar' })
  cultivo!: string;

  @Column({
    type: 'geometry',
    spatialFeatureType: 'Geometry',
    srid: 4326,
    nullable: true,
  })
  geometria!: object;

  @Column({
    type: 'varchar',
    length: 20,
    default: 'activo',
  })
  estado!: 'activo' | 'descanso' | 'cosechado' | 'preparacion';

  @Column({
    name: 'ciclo_actual',
    type: 'varchar',
    length: 30,
    default: 'siembra_normal_boleo',
    nullable: true,
  })
  cicloActual!:
    | 'siembra_normal_boleo'
    | 'siembra_normal_trasplante'
    | 'soca'
    | 'resoca'
    | 'en_preparacion';

  @Column({
    name: 'area_ha',
    type: 'decimal',
    precision: 10,
    scale: 4,
    nullable: true,
  })
  areaHa!: number;

  @CreateDateColumn({ name: 'fecha_creacion' })
  fechaCreacion!: Date;
}