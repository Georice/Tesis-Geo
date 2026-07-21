import bcrypt from 'bcrypt';
import { AppDataSource } from '../DataSource';
import {
  IUserRepository,
  CredencialesLogin,
  CreateUsuarioDTO,
  UpdateUsuarioDTO,
  UsuarioPublico,
} from '../../../domain/repositories/IUserRepository';

// Nota: este repositorio consulta con SQL crudo (AppDataSource.query), no usa
// AppDataSource.getRepository(), por lo que no depende de UsuarioEntity.

// ── Credenciales para login (busca por cédula o usuario) ──────────────────
const SELECT_CRED = `
  SELECT
    u.id::text                                              AS id,
    u.password_hash                                        AS "passwordHash",
    u.rol                                                  AS rol,
    u.estado                                               AS estado,
    u.nombres                                              AS nombres,
    u.apellidos                                            AS apellidos
  FROM public.usuarios u
`;

// ── Datos públicos del usuario ─────────────────────────────────────────────
const SELECT_PUB = `
  SELECT
    u.id::text                                              AS id,
    u.nombres                                              AS nombres,
    u.apellidos                                            AS apellidos,
    u.cedula,
    u.usuario,
    u.email,
    u.rol                                                  AS rol,
    u.estado                                               AS estado,
    u.fecha_registro                                       AS "fechaRegistro"
  FROM public.usuarios u
`;

export class LocalUserRepository implements IUserRepository {

  // Login con cédula (socios) o nombre de usuario (administradores)
  async findByEmail(login: string): Promise<CredencialesLogin | null> {
    const rows = await AppDataSource.query(
      `${SELECT_CRED} WHERE u.cedula = $1 OR u.usuario = $1 OR u.email = $1 LIMIT 1`,
      [login],
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
      `${SELECT_PUB} ORDER BY u.apellidos, u.nombres`,
    );
  }

  async findSoloActivos(): Promise<UsuarioPublico[]> {
    return AppDataSource.query(
      `${SELECT_PUB} WHERE u.estado = 'activo' ORDER BY u.apellidos, u.nombres`,
    );
  }

  async create(data: CreateUsuarioDTO, createdBy: string): Promise<UsuarioPublico> {
    const hash = await bcrypt.hash(data.password, 12);
    const rows = await AppDataSource.query(
      `INSERT INTO public.usuarios 
        (cedula, nombres, apellidos, usuario, password_hash, rol, estado, email, updated_by)
       VALUES ($1, $2, $3, $4, $5, $6, 'activo', $7, $8)
       RETURNING id`,
      [
        data.cedula,
        data.nombres,
        data.apellidos,
        data.usuario ?? data.cedula,
        hash,
        data.rol ?? 'socio',
        data.email ?? null,
        createdBy,
      ],
    );
    return (await this.findById(rows[0].id))!;
  }

  async update(id: string, data: UpdateUsuarioDTO, updatedBy: string): Promise<UsuarioPublico> {
    // Versión anterior (vulnerable a SQL injection: updatedBy interpolado directo
    // en el string SQL en vez de parametrizado). Se deja comentada como referencia
    // para la tesis — ver hallazgo de deuda técnica documentado.
    // const sets: string[] = ['updated_at = NOW()', `updated_by = '${updatedBy}'`];
    // const params: unknown[] = [];
    const sets: string[] = ['updated_at = NOW()'];
    const params: unknown[] = [updatedBy];
    sets.push(`updated_by = $${params.length}`);

    if (data.nombres   != null) { params.push(data.nombres);   sets.push(`nombres = $${params.length}`); }
    if (data.apellidos != null) { params.push(data.apellidos); sets.push(`apellidos = $${params.length}`); }
    if (data.email     != null) { params.push(data.email);     sets.push(`email = $${params.length}`); }
    if (data.estado    != null) { params.push(data.estado);    sets.push(`estado = $${params.length}`); }
    if (data.password  != null) {
      params.push(await bcrypt.hash(data.password, 12));
      sets.push(`password_hash = $${params.length}`);
    }

    params.push(id);
    await AppDataSource.query(
      `UPDATE public.usuarios SET ${sets.join(', ')} WHERE id = $${params.length}`,
      params,
    );
    return (await this.findById(id))!;
  }

  async activate(id: string, updatedBy: string): Promise<void> {
    await AppDataSource.query(
      `UPDATE public.usuarios SET estado = 'activo', updated_at = NOW(), updated_by = $2 WHERE id = $1`,
      [id, updatedBy],
    );
  }

  async deactivate(id: string, updatedBy: string): Promise<void> {
    await AppDataSource.query(
      `UPDATE public.usuarios SET estado = 'inactivo', updated_at = NOW(), updated_by = $2 WHERE id = $1`,
      [id, updatedBy],
    );
  }
}