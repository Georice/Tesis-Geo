// import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn } from 'typeorm';

// @Entity('parcelas')
// export class Parcela {
//   @PrimaryGeneratedColumn()
//   id!: number;

//   @Column({ type: 'varchar' })
//   nombre!: string;

//   @Column({ type: 'varchar' })
//   propietario!: string;

//   @Column({ type: 'varchar' })
//   cultivo!: string;

//   @Column({
//     type: 'geometry',
//     spatialFeatureType: 'Geometry',
//     srid: 4326,
//     nullable: true,
//   })
//   geometria!: object;

//   @CreateDateColumn({ name: 'fecha_creacion' })
//   fechaCreacion!: Date;
//}

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
    default: 'activo'
  })
  estado!: 'activo' | 'descanso' | 'cosechado' | 'preparacion';

  @CreateDateColumn({ name: 'fecha_creacion' })
  fechaCreacion!: Date;
}