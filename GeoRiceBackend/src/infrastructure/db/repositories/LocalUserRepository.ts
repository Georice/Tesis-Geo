import bcrypt from 'bcrypt';
import { AppDataSource } from '../DataSource';
import { Usuario } from '../../../domain/entities/Usuario';
import {
  IUserRepository,
  CredencialesLogin,
  CreateUsuarioDTO,
  UpdateUsuarioDTO,
  UsuarioPublico,
} from '../../../domain/repositories/IUserRepository';

export class LocalUserRepository implements IUserRepository {
  private repo = AppDataSource.getRepository(Usuario);

  async findByUsuario(usuario: string): Promise<CredencialesLogin | null> {
    const result = await AppDataSource.query(
      `SELECT id, password_hash AS "passwordHash", rol, estado, cedula, nombres, apellidos
       FROM usuarios WHERE usuario = $1 LIMIT 1`,
      [usuario]
    );
    return result[0] ?? null;
  }

  async findById(id: number): Promise<UsuarioPublico | null> {
    const result = await AppDataSource.query(
      `SELECT id, cedula, nombres, apellidos, usuario, rol, estado,
              fecha_registro AS "fechaRegistro"
       FROM usuarios WHERE id = $1 LIMIT 1`,
      [id]
    );
    return result[0] ?? null;
  }

  async findAll(): Promise<UsuarioPublico[]> {
    return AppDataSource.query(
      `SELECT id, cedula, nombres, apellidos, usuario, rol, estado,
              fecha_registro AS "fechaRegistro"
       FROM usuarios ORDER BY apellidos, nombres`
    );
  }

  async findSoloActivos(): Promise<UsuarioPublico[]> {
    return AppDataSource.query(
      `SELECT id, cedula, nombres, apellidos, usuario, rol, estado,
              fecha_registro AS "fechaRegistro"
       FROM usuarios WHERE estado = 'activo' ORDER BY apellidos, nombres`
    );
  }

  async create(data: CreateUsuarioDTO, createdBy: number): Promise<UsuarioPublico> {
    const passwordHash = await bcrypt.hash(data.password, 12);
    const result = await AppDataSource.query(
      `INSERT INTO usuarios (cedula, nombres, apellidos, usuario, password_hash, rol, estado, updated_by)
       VALUES ($1, $2, $3, $4, $5, $6, 'activo', $7)
       RETURNING id`,
      [data.cedula, data.nombres, data.apellidos, data.usuario, passwordHash, data.rol, createdBy]
    );
    return (await this.findById(result[0].id))!;
  }

  async update(id: number, data: UpdateUsuarioDTO, updatedBy: number): Promise<UsuarioPublico> {
    const sets: string[] = ['updated_by = $1', 'updated_at = NOW()'];
    const params: any[]  = [updatedBy];

    if (data.cedula    != null) { params.push(data.cedula);    sets.push(`cedula = $${params.length}`); }
    if (data.nombres   != null) { params.push(data.nombres);   sets.push(`nombres = $${params.length}`); }
    if (data.apellidos != null) { params.push(data.apellidos); sets.push(`apellidos = $${params.length}`); }
    if (data.usuario   != null) { params.push(data.usuario);   sets.push(`usuario = $${params.length}`); }
    if (data.rol       != null) { params.push(data.rol);       sets.push(`rol = $${params.length}`); }
    if (data.estado    != null) { params.push(data.estado);    sets.push(`estado = $${params.length}`); }
    if (data.password  != null) {
      const hash = await bcrypt.hash(data.password, 12);
      params.push(hash);
      sets.push(`password_hash = $${params.length}`);
    }

    params.push(id);
    await AppDataSource.query(
      `UPDATE usuarios SET ${sets.join(', ')} WHERE id = $${params.length}`,
      params
    );
    return (await this.findById(id))!;
  }

  async activate(id: number, updatedBy: number): Promise<void> {
    await AppDataSource.query(
      `UPDATE usuarios SET estado = 'activo', updated_by = $1, updated_at = NOW() WHERE id = $2`,
      [updatedBy, id]
    );
  }

  async deactivate(id: number, updatedBy: number): Promise<void> {
    await AppDataSource.query(
      `UPDATE usuarios SET estado = 'inactivo', updated_by = $1, updated_at = NOW() WHERE id = $2`,
      [updatedBy, id]
    );
  }
}
