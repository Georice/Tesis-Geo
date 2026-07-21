import {
  Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn,
  ManyToOne, JoinColumn, OneToMany, OneToOne,
} from 'typeorm';
import { ProductoActividadModel } from './ProductoActividadModel';
import { FaseCicloModel } from './FaseCicloModel';
import { DetalleRiegoModel } from './DetalleRiegoModel';
import { DetalleFumigacionModel } from './DetalleFumigacionModel';
import { DetalleFertilizacionModel } from './DetalleFertilizacionModel';
import { DetalleCosechaModel } from './DetalleCosechaModel';
import { DetalleManoObraModel } from './DetalleManoObraModel';
import { DetalleMaquinariaModel } from './DetalleMaquinariaModel';
import { TipoActividad, NivelAlerta, EstadoActividad } from '../../../domain/types/ActividadTypes';

// Modelo de persistencia (TypeORM) del agregado ActividadParcela.
// Los FK a parcelas/capas/ciclos se guardan como columnas planas (no se
// navegan como relaciones en ningún repositorio); solo 'productos', 'fase'
// y los detalles 1:1 se cargan como relaciones porque sí se consultan así.
@Entity('actividades_parcela')
export class ActividadParcelaModel {
  @PrimaryGeneratedColumn()
  id!: number;

  @Column({ name: 'parcela_id' })
  parcelaId!: number;

  @Column({ name: 'capa_id', nullable: true })
  capaId!: number;

  @Column({ type: 'varchar', length: 30 })
  tipo!: TipoActividad;

  @Column({ type: 'timestamp', default: () => 'NOW()' })
  fecha!: Date;

  @Column({ type: 'varchar', length: 100, nullable: true })
  metodo!: string;

  @Column({ type: 'varchar', length: 100, nullable: true })
  insumo!: string;

  @Column({ type: 'decimal', precision: 10, scale: 2, nullable: true })
  cantidad!: number;

  @Column({ type: 'varchar', length: 20, nullable: true })
  unidad!: string;

  @Column({ name: 'nivel_alerta', type: 'varchar', length: 20, nullable: true, default: 'normal' })
  nivelAlerta!: NivelAlerta;

  @Column({ type: 'text', nullable: true })
  observaciones!: string;

  @OneToMany(() => ProductoActividadModel, p => p.actividad, { cascade: true, eager: true })
  productos!: ProductoActividadModel[];

  @CreateDateColumn({ name: 'fecha_registro' })
  fechaRegistro!: Date;

  @Column({ name: 'ciclo_id', nullable: true })
  cicloId!: number;

  @Column({ name: 'orden_plantilla', type: 'integer', nullable: true })
  ordenPlantilla!: number;

  @Column({ name: 'fase_id', nullable: true })
  faseId!: number;

  @ManyToOne(() => FaseCicloModel, { nullable: true })
  @JoinColumn({ name: 'fase_id' })
  fase!: FaseCicloModel;

  @Column({ type: 'varchar', length: 20, default: 'pendiente' })
  estado!: EstadoActividad;

  @Column({ name: 'fecha_inicio', type: 'timestamp', nullable: true })
  fechaInicio!: Date;

  @Column({ name: 'fecha_fin', type: 'timestamp', nullable: true })
  fechaFin!: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt!: Date;

  @Column({ name: 'created_by', type: 'text', nullable: true })
  createdBy!: string | null;

  @Column({ name: 'updated_by', type: 'text', nullable: true })
  updatedBy!: string | null;

  @Column({ name: 'numero_actividad', type: 'integer', nullable: true })
  numeroActividad!: number;

  @Column({ name: 'costo_insumos', type: 'decimal', precision: 10, scale: 2, nullable: true })
  costoInsumos!: number;

  @Column({ name: 'costo_total_actividad', type: 'decimal', precision: 10, scale: 2, nullable: true })
  costoTotalActividad!: number;

  @OneToOne(() => DetalleRiegoModel, d => d.actividad, { cascade: true, nullable: true })
  detalleRiego!: DetalleRiegoModel;

  @OneToOne(() => DetalleFumigacionModel, d => d.actividad, { cascade: true, nullable: true })
  detalleFumigacion!: DetalleFumigacionModel;

  @OneToOne(() => DetalleFertilizacionModel, d => d.actividad, { cascade: true, nullable: true })
  detalleFertilizacion!: DetalleFertilizacionModel;

  @OneToOne(() => DetalleCosechaModel, d => d.actividad, { cascade: true, nullable: true })
  detalleCosecha!: DetalleCosechaModel;

  @OneToOne(() => DetalleManoObraModel, d => d.actividad, { cascade: true, nullable: true })
  detalleManoObra!: DetalleManoObraModel;

  @OneToOne(() => DetalleMaquinariaModel, d => d.actividad, { cascade: true, nullable: true })
  detalleMaquinaria!: DetalleMaquinariaModel;
}
