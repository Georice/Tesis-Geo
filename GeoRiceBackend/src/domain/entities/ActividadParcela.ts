import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, ManyToOne, JoinColumn, OneToMany } from 'typeorm';
import { Parcela } from './Parcela';
import { CapaParcela } from './CapaParcela';
import { ProductoActividad } from './ProductoActividad';

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
    | 'preparacion_suelo'
    | 'inundacion'
    | 'siembra_boleo'
    | 'siembra_trasplante'
    | 'riego'
    | 'fertilizacion'
    | 'fumigacion'
    | 'deshierba'
    | 'cosecha'
    | 'rozar_quemar'
    | 'soca_riego'
    | 'soca_fertilizacion'
    | 'soca_fumigacion'
    | 'cosecha_soca'
    | 'observacion';

  @Column({ type: 'timestamp', default: () => 'NOW()' })
  fecha!: Date;

  // Siembra
  @Column({ type: 'varchar', length: 100, nullable: true })
  insumo!: string;

  @Column({ type: 'decimal', precision: 10, scale: 2, nullable: true })
  cantidad!: number;

  @Column({ type: 'varchar', length: 20, nullable: true })
  unidad!: string;

  // Método aplicación
  @Column({ type: 'varchar', length: 50, nullable: true })
  metodo!: string;

  // Riego
  @Column({ name: 'lamina_agua', type: 'decimal', precision: 8, scale: 2, nullable: true })
  laminaAgua!: number;

  // Cosecha
  @Column({ name: 'rendimiento_ha', type: 'decimal', precision: 10, scale: 2, nullable: true })
  rendimientoHa!: number;

  @Column({ name: 'total_sacos', type: 'decimal', precision: 10, scale: 2, nullable: true })
  totalSacos!: number;

  @Column({ type: 'decimal', precision: 5, scale: 2, nullable: true })
  humedad!: number;

  @Column({ name: 'precio_qq', type: 'decimal', precision: 10, scale: 2, nullable: true })
  precioQq!: number;

  @Column({ name: 'ingreso_total', type: 'decimal', precision: 10, scale: 2, nullable: true })
  ingresoTotal!: number;

  @Column({ name: 'costo_cosecha', type: 'decimal', precision: 10, scale: 2, nullable: true })
  costoCosecha!: number;

  @Column({
    type: 'varchar',
    length: 50,
    nullable: true,
  })
  destino!: 'piladora' | 'almacen' | 'directo' | 'otro';

  // Plagas
  @Column({ name: 'plaga_detectada', type: 'varchar', length: 100, nullable: true })
  plagaDetectada!: string;

  @Column({ name: 'nivel_dano', type: 'varchar', length: 20, nullable: true })
  nivelDano!: 'leve' | 'moderado' | 'severo';

  // Observación
  @Column({ name: 'nivel_alerta', type: 'varchar', length: 20, nullable: true })
  nivelAlerta!: 'normal' | 'alerta' | 'critico';

  @Column({ type: 'text', nullable: true })
  observaciones!: string;

  @CreateDateColumn({ name: 'fecha_registro' })
  fechaRegistro!: Date;

  // Relación con productos
  @OneToMany(() => ProductoActividad, producto => producto.actividad, {
    cascade: true,
    eager: true,
  })
  productos!: ProductoActividad[];
}