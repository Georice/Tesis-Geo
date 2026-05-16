import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, ManyToOne, JoinColumn } from 'typeorm';
import { Parcela } from './Parcela';
import { CapaParcela } from './CapaParcela';

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
  tipo!: 'siembra' | 'riego' | 'fertilizacion' | 'cosecha' | 'observacion' | 'pesticida';

  @Column({ type: 'timestamp', default: () => 'NOW()' })
  fecha!: Date;

  @Column({ type: 'varchar', length: 100, nullable: true })
  insumo!: string;

  @Column({ type: 'decimal', precision: 10, scale: 2, nullable: true })
  cantidad!: number;

  @Column({ type: 'varchar', length: 20, nullable: true })
  unidad!: string;

  @Column({ name: 'rendimiento_ha', type: 'decimal', precision: 10, scale: 2, nullable: true })
  rendimientoHa!: number;

  @Column({ type: 'text', nullable: true })
  observaciones!: string;

  @CreateDateColumn({ name: 'fecha_registro' })
  fechaRegistro!: Date;
}