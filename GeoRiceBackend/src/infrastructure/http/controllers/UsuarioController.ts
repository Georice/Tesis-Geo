import { Request, Response } from 'express';
import { LocalUserRepository } from '../../db/repositories/LocalUserRepository';
import { logger } from '../../../shared/logger';

const repo = new LocalUserRepository();

export class UsuarioController {
  async getAll(_req: Request, res: Response): Promise<void> {
    try {
      const usuarios = await repo.findAll();
      res.json(usuarios);
    } catch (err: any) {
      logger.error('Error al obtener usuarios:', err);
      res.status(500).json({ error: 'Error interno del servidor' });
    }
  }

  async create(req: Request, res: Response): Promise<void> {
    try {
      const createdBy = Number(req.user!.sub);
      const { cedula, nombres, apellidos, usuario, password, rol } = req.body;
      if (!cedula || !nombres || !apellidos || !usuario || !password || !rol) {
        res.status(400).json({ error: 'Todos los campos son requeridos' });
        return;
      }
      if (!['administrador', 'socio'].includes(rol)) {
        res.status(400).json({ error: 'Rol inválido. Use: administrador o socio' });
        return;
      }
      const nuevo = await repo.create({ cedula, nombres, apellidos, usuario, password, rol }, createdBy);
      res.status(201).json(nuevo);
    } catch (err: any) {
      if (err.code === '23505' || err.message?.includes('duplicate')) {
        res.status(409).json({ error: 'El usuario o cédula ya existe' });
      } else {
        res.status(400).json({ error: err.message });
      }
    }
  }

  async update(req: Request, res: Response): Promise<void> {
    try {
      const id        = Number(req.params.id);
      const updatedBy = Number(req.user!.sub);
      const usuario   = await repo.update(id, req.body, updatedBy);
      res.json(usuario);
    } catch (err: any) {
      if (err.code === '23505' || err.message?.includes('duplicate')) {
        res.status(409).json({ error: 'El usuario o cédula ya existe' });
      } else {
        res.status(400).json({ error: err.message });
      }
    }
  }

  async activate(req: Request, res: Response): Promise<void> {
    try {
      const id        = Number(req.params.id);
      const updatedBy = Number(req.user!.sub);
      await repo.activate(id, updatedBy);
      res.json({ mensaje: 'Usuario activado' });
    } catch (err: any) {
      res.status(500).json({ error: err.message });
    }
  }

  async deactivate(req: Request, res: Response): Promise<void> {
    try {
      const id        = Number(req.params.id);
      const updatedBy = Number(req.user!.sub);
      if (id === Number(req.user!.sub)) {
        res.status(400).json({ error: 'No puedes desactivar tu propia cuenta' });
        return;
      }
      await repo.deactivate(id, updatedBy);
      res.json({ mensaje: 'Usuario desactivado' });
    } catch (err: any) {
      res.status(500).json({ error: err.message });
    }
  }
}
