import bcrypt from 'bcrypt';
import crypto from 'crypto';
import { AppDataSource } from '../DataSource';
import { Usuario } from '../../../domain/entities/Usuario';
import {
  IUserRepository,
  CredencialesLogin,
  NuevoUsuarioComando,
  ActualizarUsuarioComando,
} from '../../../domain/repositories/IUserRepository';
import { UsuarioMapper } from '../mappers/UsuarioMapper';

const SELECT_CRED = `
  SELECT
    u.id                                                      AS id,
    u.cedula                                                  AS cedula,
    u.password                                                AS "password",
    u.activo                                                  AS activo,
    u.nombre                                                  AS nombre,
    u.apellido                                                AS apellido
  FROM public.usuarios u
`;

const SELECT_PUB = `
  SELECT
    u.id                                                      AS id,
    u.nombre                                                  AS nombre,
    u.apellido                                                AS apellido,
    u.cedula                                                  AS cedula,
    u.email                                                   AS email,
    u.activo                                                  AS activo,
    u."createdAt"                                             AS "createdAt",
    u."updatedAt"                                             AS "updatedAt",
    CASE
      WHEN s.rol = 'PRESIDENTE' OR s."nivelAcceso" = 'ADMIN' THEN 'administrador'
      ELSE 'socio'
    END                                                       AS rol
  FROM public.usuarios u
  LEFT JOIN public.socios s ON s.cedula = u.cedula
`;

export class LocalUserRepository implements IUserRepository {

  async findByEmail(login: string): Promise<CredencialesLogin | null> {
    const rows = await AppDataSource.query(
      `${SELECT_CRED} WHERE u.cedula = $1 OR u.email = $1 LIMIT 1`,
      [login],
    );
    return rows[0] ?? null;
  }

  async findById(id: string): Promise<Usuario | null> {
    const rows = await AppDataSource.query(
      `${SELECT_PUB} WHERE u.id = $1 LIMIT 1`,
      [id],
    );
    return rows[0] ? UsuarioMapper.fromRow(rows[0]) : null;
  }

  async findAll(): Promise<Usuario[]> {
    const rows = await AppDataSource.query(
      `${SELECT_PUB} ORDER BY u.apellido, u.nombre`,
    );
    return rows.map(UsuarioMapper.fromRow);
  }

  async findSoloActivos(): Promise<Usuario[]> {
    const rows = await AppDataSource.query(
      `${SELECT_PUB} WHERE u.activo = true ORDER BY u.apellido, u.nombre`,
    );
    return rows.map(UsuarioMapper.fromRow);
  }

  async create(data: NuevoUsuarioComando, activo: boolean = true): Promise<Usuario> {
    const hash = await bcrypt.hash(data.password, 12);
    const rows = await AppDataSource.query(
      `INSERT INTO public.usuarios
        (id, cedula, nombre, apellido, email, password, activo, "createdAt", "updatedAt")
       VALUES ($1, $2, $3, $4, $5, $6, $7, NOW(), NOW())
       RETURNING id`,
      [
        crypto.randomUUID(),
        data.cedula,
        data.nombre,
        data.apellido,
        data.email ?? null,
        hash,
        activo,
      ],
    );
    return (await this.findById(rows[0].id))!;
  }

  async update(id: string, data: ActualizarUsuarioComando): Promise<Usuario> {
    const sets: string[] = ['"updatedAt" = NOW()'];
    const params: unknown[] = [];

    if (data.nombre   != null) { params.push(data.nombre);   sets.push(`nombre = $${params.length}`); }
    if (data.apellido != null) { params.push(data.apellido); sets.push(`apellido = $${params.length}`); }
    if (data.cedula   != null) { params.push(data.cedula);   sets.push(`cedula = $${params.length}`); }
    if (data.email    != null) { params.push(data.email);    sets.push(`email = $${params.length}`); }
    if (data.password != null) {
      params.push(await bcrypt.hash(data.password, 12));
      sets.push(`password = $${params.length}`);
    }

    params.push(id);
    await AppDataSource.query(
      `UPDATE public.usuarios SET ${sets.join(', ')} WHERE id = $${params.length}`,
      params,
    );
    return (await this.findById(id))!;
  }

  async activate(id: string): Promise<void> {
    await AppDataSource.query(
      `UPDATE public.usuarios SET activo = true, "updatedAt" = NOW() WHERE id = $1`,
      [id],
    );
  }

  async deactivate(id: string): Promise<void> {
    await AppDataSource.query(
      `UPDATE public.usuarios SET activo = false, "updatedAt" = NOW() WHERE id = $1`,
      [id],
    );
  }
}
