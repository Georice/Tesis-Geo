import {
  Entity, PrimaryGeneratedColumn, Column,
  ManyToOne, JoinColumn, CreateDateColumn,
} from 'typeorm';
import { UsuarioModel } from './UsuarioModel';

@Entity('refresh_tokens')
export class RefreshTokenModel {
  @PrimaryGeneratedColumn()
  id!: number;

  @Column({ name: 'usuario_id', type: 'text' })
  usuarioId!: string;

  @ManyToOne(() => UsuarioModel, { onDelete: 'CASCADE', eager: false })
  @JoinColumn({ name: 'usuario_id' })
  usuario!: UsuarioModel;

  @Column({ name: 'token_hash', type: 'varchar', length: 255, unique: true })
  tokenHash!: string;

  @Column({ name: 'expires_at' })
  expiresAt!: Date;

  @CreateDateColumn({ name: 'creado_en' })
  creadoEn!: Date;

  @Column({ default: false })
  revocado!: boolean;
}
