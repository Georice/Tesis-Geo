import { Router }          from 'express';
import { CicloController } from '../controllers/CicloController';

const router     = Router({ mergeParams: true });
const controller = new CicloController();

router.get('/',    (req, res) => controller.getByParcela(req, res));
router.post('/',   (req, res) => controller.iniciar(req, res));
router.put('/:id/finalizar', (req, res) => controller.finalizar(req, res));

export default router;