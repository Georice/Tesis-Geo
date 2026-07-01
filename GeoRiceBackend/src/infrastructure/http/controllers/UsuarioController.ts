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
      const createdBy = req.user!.sub;   // UUID string de MagnaRice
      const { nombres, apellidos, email, password } = req.body;
      if (!nombres || !apellidos || !email || !password) {
        res.status(400).json({ error: 'nombres, apellidos, email y password son requeridos' });
        return;
      }
      const nuevo = await repo.create({ nombres, apellidos, email, password }, createdBy as any);
      res.status(201).json(nuevo);
    } catch (err: any) {
      if (err.code === '23505' || err.message?.includes('duplicate')) {
        res.status(409).json({ error: 'El email ya existe' });
      } else {
        res.status(400).json({ error: err.message });
      }
    }
  }

  async update(req: Request, res: Response): Promise<void> {
    try {
      const id        = req.params.id;   // UUID string de URL
      const updatedBy = req.user!.sub;
      const usuario   = await repo.update(id as any, req.body, updatedBy as any);
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
      const id        = req.params.id;
      const updatedBy = req.user!.sub;
      await repo.activate(id as any, updatedBy as any);
      res.json({ mensaje: 'Usuario activado' });
    } catch (err: any) {
      res.status(500).json({ error: err.message });
    }
  }

  async deactivate(req: Request, res: Response): Promise<void> {
    try {
      const id        = req.params.id;
      const updatedBy = req.user!.sub;
      if (id === req.user!.sub) {
        res.status(400).json({ error: 'No puedes desactivar tu propia cuenta' });
        return;
      }
      await repo.deactivate(id as any, updatedBy as any);
      res.json({ mensaje: 'Usuario desactivado' });
    } catch (err: any) {
      res.status(500).json({ error: err.message });
    }
  }
}