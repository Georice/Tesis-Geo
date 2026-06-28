import { Entity, PrimaryColumn, Column, OneToOne, JoinColumn } from 'typeorm';
import { ActividadParcela } from './ActividadParcela';

@Entity('detalle_mano_obra')
export class DetalleManoObra {
  @PrimaryColumn({ name: 'actividad_id' })
  actividadId!: number;

  @OneToOne(() => ActividadParcela, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'actividad_id' })
  actividad!: ActividadParcela;

  @Column({ name: 'num_jornales', type: 'integer', nullable: true })
  numJornales!: number;

  @Column({ name: 'pago_jornal', type: 'decimal', precision: 10, scale: 2, nullable: true })
  pagoJornal!: number;

  @Column({ name: 'costo_mano_obra', type: 'decimal', precision: 10, scale: 2, nullable: true })
  costoManoObra!: number;

  @Column({ name: 'unidad_mano_obra', type: 'varchar', length: 20, nullable: true })
  unidadManoObra!: 'jornal' | 'tanque' | 'saco' | 'tarea' | 'otro';

  @Column({ name: 'cantidad_unidad_mo', type: 'decimal', precision: 10, scale: 2, nullable: true })
  cantidadUnidadMo!: number;

  @Column({ name: 'precio_unidad_mo', type: 'decimal', precision: 10, scale: 2, nullable: true })
  precioUnidadMo!: number;

  @Column({ name: 'num_trabajadores', type: 'integer', nullable: true })
  numTrabajadores!: number;

  @Column({ name: 'pago_por_trabajador', type: 'decimal', precision: 10, scale: 2, nullable: true })
  pagoPorTrabajador!: number;

  @Column({ name: 'descripcion_unidad_mo', type: 'varchar', length: 100, nullable: true })
  descripcionUnidadMo!: string;

  @Column({ name: 'num_tareas', type: 'decimal', precision: 8, scale: 2, nullable: true })
  numTareas!: number;

  @Column({ name: 'precio_tarea', type: 'decimal', precision: 10, scale: 2, nullable: true })
  precioTarea!: number;

  @Column({ name: 'costo_sembradores', type: 'decimal', precision: 10, scale: 2, nullable: true })
  costoSembradores!: number;
}