import {
  Entity, PrimaryGeneratedColumn, Column,
  CreateDateColumn, UpdateDateColumn,
} from 'typeorm';
import { EstadoParcela, CicloActualParcela } from '../../../domain/types/ParcelaTypes';

// Modelo de persistencia (TypeORM). Los FK a usuarios/zonas se guardan como
// columnas planas: ningún repositorio navega esas relaciones como objetos.
@Entity('parcelas')
export class ParcelaModel {
  @PrimaryGeneratedColumn()
  id!: number;

  @Column({ name: 'usuario_id', type: 'text' })
  usuarioId!: string;

  @Column({ name: 'zona_id', type: 'int', nullable: true })
  zonaId!: number | null;

  @Column({ type: 'varchar', length: 100 })
  nombre!: string;

  // Mantenido por compatibilidad. Se auto-rellena desde usuario.nombre+apellido.
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
  estado!: EstadoParcela;

  @Column({
    name: 'ciclo_actual',
    type: 'varchar',
    length: 30,
    nullable: true,
    default: 'siembra_normal_boleo',
  })
  cicloActual!: CicloActualParcela;

  @Column({ name: 'area_ha', type: 'double precision', nullable: true })
  areaHa!: number;

  @Column({ name: 'area_cuadras', type: 'double precision', nullable: true })
  areaCuadras!: number;

  @CreateDateColumn({ name: 'fecha_creacion' })
  fechaCreacion!: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt!: Date;

  @Column({ name: 'created_by', type: 'text', nullable: true })
  createdBy!: string | null;

  @Column({ name: 'updated_by', type: 'text', nullable: true })
  updatedBy!: string | null;
}
