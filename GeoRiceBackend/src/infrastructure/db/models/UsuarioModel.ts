import { Entity, PrimaryColumn, Column } from 'typeorm';

// Modelo de persistencia (TypeORM). Es la única clase acoplada a la
// tecnología de base de datos para este agregado; el dominio (Usuario.ts)
// no la conoce.
//
// Tabla `usuarios` propiedad de MagnaRice (Prisma) — id TEXT sin default
// en DB, se genera en la app con crypto.randomUUID() al crear. Las
// columnas createdAt/updatedAt son camelCase tal cual las creó Prisma.
@Entity({ name: 'usuarios', schema: 'public' })
export class UsuarioModel {
  @PrimaryColumn({ type: 'text' })
  id!: string;

  @Column({ type: 'varchar', length: 10, unique: true })
  cedula!: string;

  @Column({ type: 'text' })
  nombre!: string;

  @Column({ type: 'text' })
  apellido!: string;

  @Column({ type: 'text', unique: true, nullable: true })
  email!: string | null;

  @Column({ type: 'text', select: false })
  password!: string;

  @Column({ type: 'boolean', default: true })
  activo!: boolean;

  @Column({ name: 'createdAt', type: 'timestamp' })
  createdAt!: Date;

  @Column({ name: 'updatedAt', type: 'timestamp' })
  updatedAt!: Date;
}
