import { Entity, PrimaryColumn, Column, OneToOne, JoinColumn } from 'typeorm';
import { ActividadParcelaEntity } from './ActividadParcelaEntity';

@Entity('detalle_cosecha')
export class DetalleCosechaEntity {
  @PrimaryColumn({ name: 'actividad_id' })
  actividadId!: number;

  @OneToOne(() => ActividadParcelaEntity, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'actividad_id' })
  actividad!: ActividadParcelaEntity;

  @Column({ name: 'rendimiento_ha', type: 'decimal', precision: 10, scale: 2, nullable: true })
  rendimientoHa!: number;

  @Column({ name: 'total_sacos', type: 'decimal', precision: 10, scale: 2, nullable: true })
  totalSacos!: number;

  @Column({ type: 'decimal', precision: 5, scale: 2, nullable: true })
  humedad!: number;

  @Column({ name: 'precio_qq', type: 'decimal', precision: 10, scale: 2, nullable: true })
  precioQq!: number;

  @Column({ name: 'ingreso_total', type: 'decimal', precision: 12, scale: 2, nullable: true })
  ingresoTotal!: number;

  @Column({ name: 'costo_cosecha', type: 'decimal', precision: 10, scale: 2, nullable: true })
  costoCosecha!: number;

  @Column({ type: 'varchar', length: 20, nullable: true })
  destino!: 'piladora' | 'almacen' | 'directo' | 'otro';
}
