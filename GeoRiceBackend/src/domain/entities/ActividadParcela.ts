import {
  Entity, PrimaryGeneratedColumn, Column, CreateDateColumn,
  ManyToOne, JoinColumn, OneToMany,
} from 'typeorm';
import { Parcela }        from './Parcela';
import { CapaParcela }    from './CapaParcela';
import { ProductoActividad } from './ProductoActividad';
import { CicloActividad } from './CicloActividad';


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

  // ── Tipo de actividad ─────────────────────────────────────────────
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

  // ── Campos generales ──────────────────────────────────────────────
  @Column({ type: 'varchar', length: 100, nullable: true })
  metodo!: string;

  @Column({ type: 'varchar', length: 100, nullable: true })
  insumo!: string;

  @Column({ type: 'decimal', precision: 10, scale: 2, nullable: true })
  cantidad!: number;

  @Column({ type: 'varchar', length: 20, nullable: true })
  unidad!: string;

  // ── Riego / inundación ────────────────────────────────────────────
  @Column({ name: 'lamina_agua', type: 'decimal', precision: 8, scale: 2, nullable: true })
  laminaAgua!: number;

  // ── Cosecha ───────────────────────────────────────────────────────
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

  // ── Fumigación / plagas ───────────────────────────────────────────
  @Column({ name: 'plaga_detectada', type: 'varchar', length: 100, nullable: true })
  plagaDetectada!: string;

  @Column({ name: 'nivel_dano', type: 'varchar', length: 20, nullable: true })
  nivelDano!: 'leve' | 'moderado' | 'severo';

  @Column({ name: 'nivel_alerta', type: 'varchar', length: 20, nullable: true, default: 'normal' })
  nivelAlerta!: 'normal' | 'alerta' | 'critico';

  // ── TANQUE de fumigación ──────────────────────────────────────────
  @Column({ name: 'capacidad_tanque', type: 'decimal', precision: 8, scale: 2, nullable: true, default: 200 })
  capacidadTanque!: number;  // Litros del tanque (default 200L)

  @Column({ name: 'num_tanques', type: 'decimal', precision: 6, scale: 2, nullable: true })
  numTanques!: number;  // Cuántos tanques se aplicaron (puede ser 2.5)

  // ── JORNALES / mano de obra ───────────────────────────────────────
  @Column({ name: 'num_jornales', type: 'integer', nullable: true })
  numJornales!: number;  // Cantidad de jornales usados

  @Column({ name: 'pago_jornal', type: 'decimal', precision: 10, scale: 2, nullable: true })
  pagoJornal!: number;  // $ pagado por cada jornal

  @Column({ name: 'costo_mano_obra', type: 'decimal', precision: 10, scale: 2, nullable: true })
  costoManoObra!: number;  // Calculado: numJornales × pagoJornal

  // ── Observaciones ─────────────────────────────────────────────────
  @Column({ type: 'text', nullable: true })
  observaciones!: string;

  // ── Productos (fumigación/fertilización) ──────────────────────────
  @OneToMany(() => ProductoActividad, p => p.actividad, { cascade: true, eager: true })
  productos!: ProductoActividad[];

  @CreateDateColumn({ name: 'fecha_registro' })
  fechaRegistro!: Date;

  // ── Ciclo ─────────────────────────────────────────────────────────────────
@Column({ name: 'ciclo_id', nullable: true })
cicloId!: number;

@ManyToOne(() => CicloActividad, { nullable: true, onDelete: 'SET NULL' })
@JoinColumn({ name: 'ciclo_id' })
ciclo!: CicloActividad;


@Column({ type: 'varchar', length: 20, default: 'pendiente' })
estado!: 'pendiente' | 'en_proceso' | 'completada';

@Column({ name: 'fecha_inicio', type: 'timestamp', nullable: true })
fechaInicio!: Date;

@Column({ name: 'fecha_fin', type: 'timestamp', nullable: true })
fechaFin!: Date;


// ── Maquinaria ────────────────────────────────────────────────────
@Column({ name: 'tipo_maquinaria', type: 'varchar', length: 50, nullable: true })
tipoMaquinaria!: string;  // tractor, drone, cosechadora, etc.

@Column({ name: 'unidad_cobro', type: 'varchar', length: 20, nullable: true })
unidadCobro!: 'hora' | 'hectarea' | 'saco' | 'otro';  // cómo se cobra

@Column({ name: 'cantidad_unidades', type: 'decimal', precision: 8, scale: 2, nullable: true })
cantidadUnidades!: number;  // horas trabajadas, hectáreas, sacos

@Column({ name: 'costo_por_unidad', type: 'decimal', precision: 10, scale: 2, nullable: true })
costoPorUnidad!: number;  // $ por hora/ha/saco

@Column({ name: 'costo_maquinaria', type: 'decimal', precision: 10, scale: 2, nullable: true })
costoMaquinaria!: number;  // Calculado: cantidadUnidades × costoPorUnidad

  
}