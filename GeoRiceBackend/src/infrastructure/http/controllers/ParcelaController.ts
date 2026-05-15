import { Request, Response } from 'express';
import { ParcelaRepository } from '../../db/repositories/ParcelaRepository';
import { CreateParcela } from '../../../application/usecases/CreateParcela';
import { GetParcelas } from '../../../application/usecases/GetParcelas';
import { UpdateParcela } from '../../../application/usecases/UpdateParcela';
import { UpdateParcelaGeometry } from '../../../application/usecases/UpdateParcelaGeometry';
import { DeleteParcela } from '../../../application/usecases/DeleteParcela';

const repo = new ParcelaRepository();

export class ParcelaController {
  async getAll(req: Request, res: Response): Promise<void> {
    try {
      const parcelas = await new GetParcelas(repo).execute();
      res.json(parcelas);
    } catch (error) {
      res.status(500).json({ error: 'Error al obtener parcelas' });
    }
  }

  async create(req: Request, res: Response): Promise<void> {
    try {
      const { nombre, propietario, cultivo, geometria } = req.body;
      const parcela = await new CreateParcela(repo).execute({ nombre, propietario, cultivo, geometria });
      res.status(201).json(parcela);
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Error al crear parcela';
      res.status(400).json({ error: message });
    }
  }

  async update(req: Request, res: Response): Promise<void> {
    try {
      const id = Number(req.params.id);
      const { nombre, propietario, cultivo } = req.body;
      const parcela = await new UpdateParcela(repo).execute(id, { nombre, propietario, cultivo });
      if (!parcela) { res.status(404).json({ error: 'Parcela no encontrada' }); return; }
      res.json(parcela);
    } catch (error) {
      res.status(500).json({ error: 'Error al actualizar parcela' });
    }
  }

  async updateGeometry(req: Request, res: Response): Promise<void> {
    try {
      const id = Number(req.params.id);
      const { geometria } = req.body;
      if (!geometria) { res.status(400).json({ error: 'Se requiere geometria' }); return; }
      const parcela = await new UpdateParcelaGeometry(repo).execute(id, geometria);
      if (!parcela) { res.status(404).json({ error: 'Parcela no encontrada' }); return; }
      res.json(parcela);
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Error al actualizar geometría';
      res.status(400).json({ error: message });
    }
  }

  async remove(req: Request, res: Response): Promise<void> {
    try {
      const id = Number(req.params.id);
      const deleted = await new DeleteParcela(repo).execute(id);
      if (!deleted) { res.status(404).json({ error: 'Parcela no encontrada' }); return; }
      res.json({ mensaje: 'Parcela eliminada', id });
    } catch (error) {
      res.status(500).json({ error: 'Error al eliminar parcela' });
    }
  }
}