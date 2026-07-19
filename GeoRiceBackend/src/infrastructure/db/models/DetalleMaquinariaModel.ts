import { Entity, PrimaryColumn, Column, OneToOne, JoinColumn } from 'typeorm';
import { ActividadParcelaModel } from './ActividadParcelaModel';
import { UnidadCobroMaquinaria } from '../../../domain/types/DetalleTypes';

@Entity('detalle_maquinaria')
export class DetalleMaquinariaModel {
  @PrimaryColumn({ name: 'actividad_id' })
  actividadId!: number;

  @OneToOne(() => ActividadParcelaModel, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'actividad_id' })
  actividad!: ActividadParcelaModel;

  @Column({ name: 'tipo_maquinaria', type: 'varchar', length: 50, nullable: true })
  tipoMaquinaria!: string;

  @Column({ name: 'unidad_cobro', type: 'varchar', length: 20, nullable: true })
  unidadCobro!: UnidadCobroMaquinaria;

  @Column({ name: 'cantidad_unidades', type: 'decimal', precision: 8, scale: 2, nullable: true })
  cantidadUnidades!: number;

  @Column({ name: 'costo_por_unidad', type: 'decimal', precision: 10, scale: 2, nullable: true })
  costoPorUnidad!: number;

  @Column({ name: 'costo_maquinaria', type: 'decimal', precision: 10, scale: 2, nullable: true })
  costoMaquinaria!: number;
}
