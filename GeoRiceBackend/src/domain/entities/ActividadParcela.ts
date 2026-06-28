import {
  Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn,
  ManyToOne, JoinColumn, OneToMany, OneToOne,
} from 'typeorm';
import { Parcela }        from './Parcela';
import { CapaParcela }    from './CapaParcela';
import { ProductoActividad } from './ProductoActividad';
import { CicloActividad } from './CicloActividad';
import { FaseCiclo } from './FaseCiclo';
import { DetalleRiego } from './DetalleRiego';
import { DetalleFumigacion } from './DetalleFumigacion';
import { DetalleFertilizacion } from './DetalleFertilizacion';
import { DetalleCosecha } from './DetalleCosecha';
import { DetalleManoObra } from './DetalleManoObra';
import { DetalleMaquinaria } from './DetalleMaquinaria';


@Entity('actividades_parcela')
export class ActividadParcela {
  @PrimaryGeneratedColumn()
  id!: number;

  @Column({ name: 'parcela_id' })
  parcelaId!: number;

  @ManyToOne(() => Parcela, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'parcela_id' })
  parcela!: Parcela;

  @Column({ name: 'capa_id', nullable: true })
  capaId!: number;

  @ManyToOne(() => CapaParcela, { nullable: true, onDelete: 'SET NULL' })
  @JoinColumn({ name: 'capa_id' })
  capa!: CapaParcela;

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

  @OneToMany(() => ProductoActividad, p => p.actividad, { cascade: true, eager: true })
  productos!: ProductoActividad[];

  @CreateDateColumn({ name: 'fecha_registro' })
  fechaRegistro!: Date;

  @Column({ name: 'ciclo_id', nullable: true })
  cicloId!: number;

  @ManyToOne(() => CicloActividad, { nullable: true, onDelete: 'SET NULL' })
  @JoinColumn({ name: 'ciclo_id' })
  ciclo!: CicloActividad;

  @Column({ name: 'orden_plantilla', type: 'integer', nullable: true })
  ordenPlantilla!: number;

  @Column({ name: 'fase_id', nullable: true })
  faseId!: number;

  @ManyToOne(() => FaseCiclo, { nullable: true })
  @JoinColumn({ name: 'fase_id' })
  fase!: FaseCiclo;

  @Column({ type: 'varchar', length: 20, default: 'pendiente' })
  estado!: 'pendiente' | 'en_proceso' | 'completada';

  @Column({ name: 'fecha_inicio', type: 'timestamp', nullable: true })
  fechaInicio!: Date;

  @Column({ name: 'fecha_fin', type: 'timestamp', nullable: true })
  fechaFin!: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt!: Date;

  @Column({ name: 'created_by', type: 'int', nullable: true })
  createdBy!: number | null;

  @Column({ name: 'updated_by', type: 'int', nullable: true })
  updatedBy!: number | null;

  @Column({ name: 'numero_actividad', type: 'integer', nullable: true })
  numeroActividad!: number;

  @Column({ name: 'costo_insumos', type: 'decimal', precision: 10, scale: 2, nullable: true })
  costoInsumos!: number;

  @Column({ name: 'costo_total_actividad', type: 'decimal', precision: 10, scale: 2, nullable: true })
  costoTotalActividad!: number;

  @OneToOne(() => DetalleRiego, d => d.actividad, { cascade: true, nullable: true })
  detalleRiego!: DetalleRiego;

  @OneToOne(() => DetalleFumigacion, d => d.actividad, { cascade: true, nullable: true })
  detalleFumigacion!: DetalleFumigacion;

  @OneToOne(() => DetalleFertilizacion, d => d.actividad, { cascade: true, nullable: true })
  detalleFertilizacion!: DetalleFertilizacion;

  @OneToOne(() => DetalleCosecha, d => d.actividad, { cascade: true, nullable: true })
  detalleCosecha!: DetalleCosecha;

  @OneToOne(() => DetalleManoObra, d => d.actividad, { cascade: true, nullable: true })
  detalleManoObra!: DetalleManoObra;

  @OneToOne(() => DetalleMaquinaria, d => d.actividad, { cascade: true, nullable: true })
  detalleMaquinaria!: DetalleMaquinaria;
}