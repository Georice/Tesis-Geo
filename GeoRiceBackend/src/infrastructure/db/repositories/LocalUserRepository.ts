import bcrypt from 'bcrypt';
import { AppDataSource } from '../DataSource';
import {
  IUserRepository,
  CredencialesLogin,
  CreateUsuarioDTO,
  UpdateUsuarioDTO,
  UsuarioPublico,
} from '../../../domain/repositories/IUserRepository';

const SELECT_CRED = `
  SELECT
    u.id::text                                              AS id,
    u.password                                             AS "passwordHash",
    COALESCE(
      CASE s."nivelAcceso" WHEN 'ADMIN' THEN 'administrador' ELSE 'socio' END,
      'socio'
    )                                                      AS rol,
    CASE WHEN u.activo THEN 'activo' ELSE 'inactivo' END   AS estado,
    u.nombre                                               AS nombres,
    u.apellido                                             AS apellidos
  FROM public.usuarios u
  LEFT JOIN public.socios s ON s."usuarioId" = u.id
`;

const SELECT_PUB = `
  SELECT
    u.id::text                                              AS id,
    u.nombre                                               AS nombres,
    u.apellido                                             AS apellidos,
    u.email,
    COALESCE(
      CASE s."nivelAcceso" WHEN 'ADMIN' THEN 'administrador' ELSE 'socio' END,
      'socio'
    )                                                      AS rol,
    CASE WHEN u.activo THEN 'activo' ELSE 'inactivo' END   AS estado,
    u."createdAt"                                          AS "fechaRegistro"
  FROM public.usuarios u
  LEFT JOIN public.socios s ON s."usuarioId" = u.id
`;

export class LocalUserRepository implements IUserRepository {

  async findByEmail(email: string): Promise<CredencialesLogin | null> {
    const rows = await AppDataSource.query(
      `${SELECT_CRED} WHERE u.email = $1 LIMIT 1`,
      [email],
    );
    return rows[0] ?? null;
  }

  async findById(id: string): Promise<UsuarioPublico | null> {
    const rows = await AppDataSource.query(
      `${SELECT_PUB} WHERE u.id = $1 LIMIT 1`,
      [id],
    );
    return rows[0] ?? null;
  }

  async findAll(): Promise<UsuarioPublico[]> {
    return AppDataSource.query(
      `${SELECT_PUB} ORDER BY u.apellido, u.nombre`,
    );
  }

  async findSoloActivos(): Promise<UsuarioPublico[]> {
    return AppDataSource.query(
      `${SELECT_PUB} WHERE u.activo = true ORDER BY u.apellido, u.nombre`,
    );
  }

  async create(data: CreateUsuarioDTO, _createdBy: string): Promise<UsuarioPublico> {
    const hash = await bcrypt.hash(data.password, 12);
    const rows = await AppDataSource.query(
      `INSERT INTO public.usuarios (id, nombre, apellido, email, password, activo, "updatedAt")
       VALUES (gen_random_uuid()::text, $1, $2, $3, $4, true, NOW())
       RETURNING id`,
      [data.nombres, data.apellidos, data.email, hash],
    );
    return (await this.findById(rows[0].id))!;
  }

  async update(id: string, data: UpdateUsuarioDTO, _updatedBy: string): Promise<UsuarioPublico> {
    const sets: string[] = ['"updatedAt" = NOW()'];
    const params: unknown[] = [];

    if (data.nombres   != null) { params.push(data.nombres);   sets.push(`nombre = $${params.length}`); }
    if (data.apellidos != null) { params.push(data.apellidos); sets.push(`apellido = $${params.length}`); }
    if (data.email     != null) { params.push(data.email);     sets.push(`email = $${params.length}`); }
    if (data.estado    != null) {
      params.push(data.estado === 'activo');
      sets.push(`activo = $${params.length}`);
    }
    if (data.password  != null) {
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

  async activate(id: string, _updatedBy: string): Promise<void> {
    await AppDataSource.query(
      `UPDATE public.usuarios SET activo = true, "updatedAt" = NOW() WHERE id = $1`,
      [id],
    );
  }

  async deactivate(id: string, _updatedBy: string): Promise<void> {
    await AppDataSource.query(
      `UPDATE public.usuarios SET activo = false, "updatedAt" = NOW() WHERE id = $1`,
      [id],
    );
  }
}