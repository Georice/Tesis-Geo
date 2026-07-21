import {
  Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn,
  ManyToOne, JoinColumn, OneToMany, OneToOne,
} from 'typeorm';
import { ParcelaEntity }        from './ParcelaEntity';
import { CapaParcelaEntity }    from './CapaParcelaEntity';
import { ProductoActividadEntity } from './ProductoActividadEntity';
import { CicloActividadEntity } from './CicloActividadEntity';
import { FaseCicloEntity } from './FaseCicloEntity';
import { DetalleRiegoEntity } from './DetalleRiegoEntity';
import { DetalleFumigacionEntity } from './DetalleFumigacionEntity';
import { DetalleFertilizacionEntity } from './DetalleFertilizacionEntity';
import { DetalleCosechaEntity } from './DetalleCosechaEntity';
import { DetalleManoObraEntity } from './DetalleManoObraEntity';
import { DetalleMaquinariaEntity } from './DetalleMaquinariaEntity';

@Entity('actividades_parcela')
export class ActividadParcelaEntity {
  @PrimaryGeneratedColumn()
  id!: number;

  @Column({ name: 'parcela_id' })
  parcelaId!: number;

  @ManyToOne(() => ParcelaEntity, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'parcela_id' })
  parcela!: ParcelaEntity;

  @Column({ name: 'capa_id', nullable: true })
  capaId!: number;

  @ManyToOne(() => CapaParcelaEntity, { nullable: true, onDelete: 'SET NULL' })
  @JoinColumn({ name: 'capa_id' })
  capa!: CapaParcelaEntity;

  @Column({ type: 'varchar', length: 30 })
  tipo!:
    | 'preparacion_suelo' | 'inundacion'
    | 'siembra_boleo'     | 'siembra_trasplante'
    | 'riego'             | 'fertilizacion'
    | 'fumigacion'        | 'deshierba'
    | 'cosecha'           | 'rozar_quemar'
    | 'soca_riego'        | 'soca_fertilizacion'
    | 'soca_fumigacion'   | 'cosecha_soca'
    | 'observacion';

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
  nivelAlerta!: 'normal' | 'alerta' | 'critico';

  @Column({ type: 'text', nullable: true })
  observaciones!: string;

  @OneToMany(() => ProductoActividadEntity, p => p.actividad, { cascade: true, eager: true })
  productos!: ProductoActividadEntity[];

  @CreateDateColumn({ name: 'fecha_registro' })
  fechaRegistro!: Date;

  @Column({ name: 'ciclo_id', nullable: true })
  cicloId!: number;

  @ManyToOne(() => CicloActividadEntity, { nullable: true, onDelete: 'SET NULL' })
  @JoinColumn({ name: 'ciclo_id' })
  ciclo!: CicloActividadEntity;

  @Column({ name: 'orden_plantilla', type: 'integer', nullable: true })
  ordenPlantilla!: number;

  @Column({ name: 'fase_id', nullable: true })
  faseId!: number;

  @ManyToOne(() => FaseCicloEntity, { nullable: true })
  @JoinColumn({ name: 'fase_id' })
  fase!: FaseCicloEntity;

  @Column({ type: 'varchar', length: 20, default: 'pendiente' })
  estado!: 'pendiente' | 'en_proceso' | 'completada';

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

  @OneToOne(() => DetalleRiegoEntity, d => d.actividad, { cascade: true, nullable: true })
  detalleRiego!: DetalleRiegoEntity;

  @OneToOne(() => DetalleFumigacionEntity, d => d.actividad, { cascade: true, nullable: true })
  detalleFumigacion!: DetalleFumigacionEntity;

  @OneToOne(() => DetalleFertilizacionEntity, d => d.actividad, { cascade: true, nullable: true })
  detalleFertilizacion!: DetalleFertilizacionEntity;

  @OneToOne(() => DetalleCosechaEntity, d => d.actividad, { cascade: true, nullable: true })
  detalleCosecha!: DetalleCosechaEntity;

  @OneToOne(() => DetalleManoObraEntity, d => d.actividad, { cascade: true, nullable: true })
  detalleManoObra!: DetalleManoObraEntity;

  @OneToOne(() => DetalleMaquinariaEntity, d => d.actividad, { cascade: true, nullable: true })
  detalleMaquinaria!: DetalleMaquinariaEntity;
}
