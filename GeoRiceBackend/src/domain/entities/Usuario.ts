import {
  Entity, PrimaryGeneratedColumn, Column,
  CreateDateColumn, UpdateDateColumn,
} from 'typeorm';

@Entity('usuarios')
export class Usuario {
  @PrimaryGeneratedColumn()
  id!: number;

  @Column({ type: 'varchar', length: 13, unique: true })
  cedula!: string;

  @Column({ type: 'varchar', length: 100 })
  nombres!: string;

  @Column({ type: 'varchar', length: 100 })
  apellidos!: string;

  @Column({ type: 'varchar', length: 50, unique: true })
  usuario!: string;

  @Column({ name: 'password_hash', type: 'varchar', length: 255, select: false })
  passwordHash!: string;

  @Column({ type: 'varchar', length: 20, default: 'socio' })
  rol!: 'administrador' | 'socio';

  @Column({ type: 'varchar', length: 10, default: 'activo' })
  estado!: 'activo' | 'inactivo';

  @CreateDateColumn({ name: 'fecha_registro' })
  fechaRegistro!: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt!: Date;

  @Column({
    name: 'updated_by',
    type: 'integer',
    nullable: true
  })
  updatedBy!: number | null;
}
