// Usuario.ts
import { Entity, PrimaryGeneratedColumn, Column } from 'typeorm';

@Entity({ name: 'usuarios', schema: 'public' })
export class Usuario {
  @PrimaryGeneratedColumn()
  id!: number;

  @Column({ type: 'varchar', length: 10, unique: true })
  cedula!: string;

  @Column({ type: 'varchar', length: 100 })
  nombres!: string;

  @Column({ type: 'varchar', length: 100 })
  apellidos!: string;

  @Column({ type: 'varchar', length: 50, unique: true })
  usuario!: string;

  @Column({ name: 'password_hash', type: 'text', select: false })
  passwordHash!: string;

  @Column({ type: 'varchar', length: 20, default: 'socio' })
  rol!: string;

  @Column({ type: 'varchar', length: 20, default: 'activo' })
  estado!: string;

  @Column({ type: 'varchar', length: 100, nullable: true })
  email!: string | null;

  @Column({ name: 'fecha_registro', type: 'timestamp', default: () => 'NOW()' })
  fechaRegistro!: Date;

  @Column({ name: 'updated_at', type: 'timestamp', default: () => 'NOW()' })
  updatedAt!: Date;

  // Getter para compatibilidad con AuthService que usa activo
  get activo(): boolean {
    return this.estado === 'activo';
  }
}