import { Entity, PrimaryColumn, Column } from 'typeorm';

@Entity({ name: 'usuarios', schema: 'public' })
export class Usuario {
  @PrimaryColumn({ type: 'text' })
  id!: string;

  @Column({ type: 'text' })
  email!: string;

  @Column({ name: 'password', type: 'text', select: false })
  passwordHash!: string;

  @Column({ name: 'nombre', type: 'text' })
  nombres!: string;

  @Column({ name: 'apellido', type: 'text' })
  apellidos!: string;

  @Column({ type: 'boolean', default: true })
  activo!: boolean;
}
