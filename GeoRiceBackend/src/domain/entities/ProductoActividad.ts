import {
  Entity, PrimaryGeneratedColumn, Column,
  ManyToOne, JoinColumn, UpdateDateColumn,
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

  @Column({ name: 'dosis_por_tanque', type: 'decimal', precision: 10, scale: 4, nullable: true })
  dosisPorTanque!: number;

  @Column({ name: 'dosis_ha', type: 'decimal', precision: 10, scale: 4, nullable: true })
  dosisHa!: number;

  @Column({ name: 'dosis_por_unidad_mo', type: 'decimal', precision: 10, scale: 4, nullable: true })
  dosisPorUnidadMo!: number;  // kg por saco echado (fertilización)

  @Column({ name: 'dosis_total', type: 'decimal', precision: 10, scale: 4, nullable: true })
  dosisTotal!: number;

  // ── Presentación ──────────────────────────────────────────────
  @Column({ name: 'presentacion_ml', type: 'integer', nullable: true })
  presentacionMl!: number;  // ml del frasco o gramos del saco (25000=25kg, 50000=50kg)

  @Column({ name: 'precio_presentacion', type: 'decimal', precision: 10, scale: 2, nullable: true })
  precioPresentacion!: number;  // precio del frasco/saco completo

  @Column({ name: 'frascos_usados', type: 'decimal', precision: 10, scale: 4, nullable: true })
  frascoUsados!: number;  // calculado: dosis_total ÷ (presentacion_ml/1000)

  // ── Costo ─────────────────────────────────────────────────────
  @Column({ name: 'precio_unitario', type: 'decimal', precision: 10, scale: 4, nullable: true })
  precioUnitario!: number;  // calculado: precio_presentacion ÷ (presentacion_ml/1000)

  @Column({ name: 'costo_total', type: 'decimal', precision: 10, scale: 2, nullable: true })
  costoTotal!: number;  // calculado: dosis_total × precio_unitario

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt!: Date;
}