import {
  Entity, PrimaryColumn, Column,
  ManyToOne, JoinColumn,
} from 'typeorm';
import { UsuarioModel } from './UsuarioModel';

// Tabla propiedad de MagnaRice (Prisma): "tokens_actualizacion". id TEXT con
// default gen_random_uuid()::text en DB — no lo genera la app. "revocado" no
// es booleano: es revocadoEn (timestamptz nullable), null = vigente.
@Entity('tokens_actualizacion')
export class RefreshTokenModel {
  @PrimaryColumn({ type: 'text' })
  id!: string;

  @Column({ name: 'usuarioId', type: 'text' })
  usuarioId!: string;

  @ManyToOne(() => UsuarioModel, { onDelete: 'CASCADE', eager: false })
  @JoinColumn({ name: 'usuarioId' })
  usuario!: UsuarioModel;

  @Column({ name: 'hashToken', type: 'varchar', length: 255 })
  hashToken!: string;

  @Column({ name: 'expiraEn', type: 'timestamptz' })
  expiraEn!: Date;

  @Column({ name: 'revocadoEn', type: 'timestamptz', nullable: true })
  revocadoEn!: Date | null;

  @Column({ name: 'createdAt', type: 'timestamptz' })
  createdAt!: Date;
}
