import { Entity, PrimaryColumn, Column, OneToOne, JoinColumn } from 'typeorm';
import { ActividadParcelaModel } from './ActividadParcelaModel';
import { NivelDano } from '../../../domain/types/DetalleTypes';

@Entity('detalle_fumigacion')
export class DetalleFumigacionModel {
  @PrimaryColumn({ name: 'actividad_id' })
  actividadId!: number;

  @OneToOne(() => ActividadParcelaModel, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'actividad_id' })
  actividad!: ActividadParcelaModel;

  @Column({ name: 'plaga_detectada', type: 'varchar', length: 100, nullable: true })
  plagaDetectada!: string;

  @Column({ name: 'nivel_dano', type: 'varchar', length: 20, nullable: true })
  nivelDano!: NivelDano;

  @Column({ name: 'capacidad_tanque', type: 'decimal', precision: 8, scale: 2, nullable: true, default: 200 })
  capacidadTanque!: number;

  @Column({ name: 'num_tanques', type: 'decimal', precision: 6, scale: 2, nullable: true })
  numTanques!: number;
}
