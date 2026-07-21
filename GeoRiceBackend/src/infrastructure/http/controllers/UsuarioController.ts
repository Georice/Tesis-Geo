import { Request, Response } from 'express';
import { IUserRepository } from '../../../domain/repositories/IUserRepository';
import { CreateUsuario } from '../../../application/usecases/usuarios/CreateUsuario';
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
      const createdBy = req.user!.sub;
      const nuevo = await new CreateUsuario(this.repo).execute(req.body, createdBy);
      res.status(201).json(nuevo);
    } catch (err: any) {
      if (err.code === '23505' || err.message?.includes('duplicate')) {
        res.status(409).json({ error: 'La cédula o email ya existe' });
      } else {
        res.status(400).json({ error: err.message });
      }
    }
  }

  async update(req: Request, res: Response): Promise<void> {
    try {
      const id        = String(req.params.id);
      const updatedBy = req.user!.sub;
      const usuario   = await new UpdateUsuario(this.repo).execute(id, req.body, updatedBy);
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
      const id        = String(req.params.id);
      const updatedBy = req.user!.sub;
      await new ActivateUsuario(this.repo).execute(id, updatedBy);
      res.json({ mensaje: 'Usuario activado' });
    } catch (err: any) {
      res.status(500).json({ error: err.message });
    }
  }

  async deactivate(req: Request, res: Response): Promise<void> {
    try {
      const id        = String(req.params.id);
      const updatedBy = req.user!.sub;
      await new DeactivateUsuario(this.repo).execute(id, updatedBy);
      res.json({ mensaje: 'Usuario desactivado' });
    } catch (err: any) {
      res.status(err.message?.includes('propia cuenta') ? 400 : 500).json({ error: err.message });
    }
  }
}
