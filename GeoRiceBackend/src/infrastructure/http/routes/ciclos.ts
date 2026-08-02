import { Router }          from 'express';
import { CicloController } from '../controllers/CicloController';
import { CicloRepository } from '../../db/repositories/CicloRepository';
import { ActividadParcelaRepository } from '../../db/repositories/ActividadParcelaRepository';
import { ParcelaRepository } from '../../db/repositories/ParcelaRepository';

const router       = Router({ mergeParams: true });
const cicloRepo     = new CicloRepository();
const actividadRepo = new ActividadParcelaRepository();
const parcelaRepo   = new ParcelaRepository();
const controller    = new CicloController(cicloRepo, actividadRepo, parcelaRepo);

router.get('/',    (req, res) => controller.getByParcela(req, res));
router.post('/',   (req, res) => controller.iniciar(req, res));
router.put('/:id/finalizar', (req, res) => controller.finalizar(req, res));
router.get('/fases-por-tipo', (req, res) => controller.getFasesPorTipo(req, res));

export default router;