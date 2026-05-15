import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn } from 'typeorm';

@Entity('parcelas')
export class Parcela {
  @PrimaryGeneratedColumn()
  id!: number;

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

  @CreateDateColumn({ name: 'fecha_creacion' })
  fechaCreacion!: Date;
}