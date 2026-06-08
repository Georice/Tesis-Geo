import {
  Entity, PrimaryGeneratedColumn, Column,
  CreateDateColumn, UpdateDateColumn,
  ManyToOne, JoinColumn,
} from 'typeorm';
import { Zona }    from './Zona';
import { Usuario } from './Usuario';

@Entity('parcelas')
export class Parcela {
  @PrimaryGeneratedColumn()
  id!: number;

  @Column({ name: 'usuario_id' })
  usuarioId!: number;

  @ManyToOne(() => Usuario, { nullable: false, eager: false })
  @JoinColumn({ name: 'usuario_id' })
  usuario!: Usuario;

  @Column({ name: 'zona_id', nullable: true })
  zonaId!: number | null;

  @ManyToOne(() => Zona, { nullable: true, onDelete: 'SET NULL' })
  @JoinColumn({ name: 'zona_id' })
  zona!: Zona;

  @Column({ type: 'varchar', length: 100 })
  nombre!: string;

  // Mantenido por compatibilidad. Se auto-rellena desde usuario.nombres+apellidos.
  @Column({ type: 'varchar', length: 100, nullable: true })
  propietario!: string | null;

  @Column({ type: 'varchar', length: 50 })
  cultivo!: string;

  @Column({
    type: 'geometry',
    spatialFeatureType: 'Geometry',
    srid: 4326,
    nullable: true,
  })
  geometria!: object;

  @Column({ type: 'varchar', length: 20, default: 'activo' })
  estado!: 'activo' | 'descanso' | 'cosechado' | 'preparacion';

  @Column({
    name: 'ciclo_actual',
    type: 'varchar',
    length: 30,
    nullable: true,
    default: 'siembra_normal_boleo',
  })
  cicloActual!: 'siembra_normal_boleo' | 'siembra_normal_trasplante' | 'soca' | 'resoca' | 'en_preparacion';

  @Column({ name: 'area_ha', type: 'double precision', nullable: true })
  areaHa!: number;

  @Column({ name: 'area_cuadras', type: 'double precision', nullable: true })
  areaCuadras!: number;

  @CreateDateColumn({ name: 'fecha_creacion' })
  fechaCreacion!: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt!: Date;

  @Column({ name: 'created_by', type: 'int', nullable: true })
  createdBy!: number | null;

  @Column({ name: 'updated_by', type: 'int', nullable: true })
  updatedBy!: number | null;
}
