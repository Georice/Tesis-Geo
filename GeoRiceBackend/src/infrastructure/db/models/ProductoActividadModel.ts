import {
  Entity, PrimaryGeneratedColumn, Column,
  ManyToOne, JoinColumn, UpdateDateColumn,
} from 'typeorm';
import { ActividadParcelaModel } from './ActividadParcelaModel';
import { TipoProducto } from '../../../domain/types/ProductoTypes';

@Entity('productos_actividad')
export class ProductoActividadModel {
  @PrimaryGeneratedColumn()
  id!: number;

  @Column({ name: 'actividad_id' })
  actividadId!: number;

  @ManyToOne(() => ActividadParcelaModel, a => a.productos, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'actividad_id' })
  actividad!: ActividadParcelaModel;

  @Column({ type: 'varchar', length: 100 })
  nombre!: string;

  @Column({ type: 'varchar', length: 30, nullable: true })
  tipo!: TipoProducto;

  @Column({ type: 'decimal', precision: 10, scale: 4, nullable: true })
  dosis!: number;

  @Column({ type: 'varchar', length: 20, nullable: true })
  unidad!: string;

  @Column({ name: 'dosis_por_tanque', type: 'decimal', precision: 10, scale: 4, nullable: true })
  dosisPorTanque!: number;

  @Column({ name: 'dosis_ha', type: 'decimal', precision: 10, scale: 4, nullable: true })
  dosisHa!: number;

  @Column({ name: 'dosis_por_unidad_mo', type: 'decimal', precision: 10, scale: 4, nullable: true })
  dosisPorUnidadMo!: number;

  @Column({ name: 'dosis_total', type: 'decimal', precision: 10, scale: 4, nullable: true })
  dosisTotal!: number;

  @Column({ name: 'presentacion_ml', type: 'integer', nullable: true })
  presentacionMl!: number;

  @Column({ name: 'precio_presentacion', type: 'decimal', precision: 10, scale: 2, nullable: true })
  precioPresentacion!: number;

  @Column({ name: 'frascos_usados', type: 'decimal', precision: 10, scale: 4, nullable: true })
  frascoUsados!: number;

  @Column({ name: 'precio_unitario', type: 'decimal', precision: 10, scale: 4, nullable: true })
  precioUnitario!: number;

  @Column({ name: 'costo_total', type: 'decimal', precision: 10, scale: 2, nullable: true })
  costoTotal!: number;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt!: Date;
}
