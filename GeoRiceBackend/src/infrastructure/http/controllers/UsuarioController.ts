import { Request, Response } from 'express';
import { IUserRepository } from '../../../domain/repositories/IUserRepository';
import { CreateUsuario } from '../../../application/usecases/usuarios/CreateUsuario';
import { RegistrarUsuario } from '../../../application/usecases/usuarios/RegistrarUsuario';
import { UpdateUsuario } from '../../../application/usecases/usuarios/UpdateUsuario';
import { GetUsuarios } from '../../../application/usecases/usuarios/GetUsuarios';
import { ActivateUsuario } from '../../../application/usecases/usuarios/ActivateUsuario';
import { DeactivateUsuario } from '../../../application/usecases/usuarios/DeactivateUsuario';
import { logger } from '../../../shared/logger';

export class UsuarioController {
  constructor(private readonly repo: IUserRepository) {}

  async getAll(_req: Request, res: Response): Promise<void> {
    try {
      const usuarios = await new GetUsuarios(this.repo).execute();
      res.json(usuarios);
    } catch (err: any) {
      logger.error('Error al obtener usuarios:', err);
      res.status(500).json({ error: 'Error interno del servidor' });
    }
  }

  async create(req: Request, res: Response): Promise<void> {
    try {
      const nuevo = await new CreateUsuario(this.repo).execute(req.body);
      res.status(201).json(nuevo);
    } catch (err: any) {
      if (err.code === '23505' || err.message?.includes('duplicate')) {
        res.status(409).json({ error: 'La cédula o email ya existe' });
      } else {
        logger.error('Error al crear usuario:', err);
        res.status(400).json({ error: err.message });
      }
    }
  }

  async register(req: Request, res: Response): Promise<void> {
    try {
      await new RegistrarUsuario(this.repo).execute(req.body);
      res.status(201).json({
        mensaje: 'Cuenta creada correctamente. Solicite al administrador habilitar su usuario.',
      });
    } catch (err: any) {
      if (err.code === '23505' || err.message?.includes('duplicate')) {
        res.status(409).json({ error: 'La cédula o email ya existe' });
      } else {
        logger.error('Error al registrar usuario:', err);
        res.status(400).json({ error: err.message });
      }
    }
  }

  async update(req: Request, res: Response): Promise<void> {
    try {
      const id      = String(req.params.id);
      const usuario = await new UpdateUsuario(this.repo).execute(id, req.body);
      res.json(usuario);
    } catch (err: any) {
      if (err.code === '23505' || err.message?.includes('duplicate')) {
        res.status(409).json({ error: 'El email ya existe' });
      } else {
        res.status(400).json({ error: err.message });
      }
    }
  }

  async activate(req: Request, res: Response): Promise<void> {
    try {
      const id = String(req.params.id);
      await new ActivateUsuario(this.repo).execute(id);
      res.json({ mensaje: 'Usuario activado' });
    } catch (err: any) {
      logger.error('Error al activar usuario:', err);
      res.status(500).json({ error: 'No se pudo activar el usuario' });
    }
  }

  async deactivate(req: Request, res: Response): Promise<void> {
    try {
      const id          = String(req.params.id);
      const solicitanteId = req.user!.sub;
      await new DeactivateUsuario(this.repo).execute(id, solicitanteId);
      res.json({ mensaje: 'Usuario desactivado' });
    } catch (err: any) {
      if (err.message?.includes('propia cuenta')) {
        res.status(400).json({ error: err.message });
      } else {
        logger.error('Error al desactivar usuario:', err);
        res.status(500).json({ error: 'No se pudo desactivar el usuario' });
      }
    }
  }
}
