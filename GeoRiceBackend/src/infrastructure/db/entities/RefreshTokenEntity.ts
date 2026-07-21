import {
  Entity, PrimaryGeneratedColumn, Column,
  ManyToOne, JoinColumn, CreateDateColumn,
} from 'typeorm';
import { UsuarioEntity } from './UsuarioEntity';

@Entity('refresh_tokens')
export class RefreshTokenEntity {
  @PrimaryGeneratedColumn()
  id!: number;

  @Column({ name: 'usuario_id', type: 'int' })
  usuarioId!: number;

  @ManyToOne(() => UsuarioEntity, { onDelete: 'CASCADE', eager: false })
  @JoinColumn({ name: 'usuario_id' })
  usuario!: UsuarioEntity;

  @Column({ name: 'token_hash', type: 'varchar', length: 255, unique: true })
  tokenHash!: string;

  @Column({ name: 'expires_at' })
  expiresAt!: Date;

  @CreateDateColumn({ name: 'creado_en' })
  creadoEn!: Date;

  @Column({ default: false })
  revocado!: boolean;
}
