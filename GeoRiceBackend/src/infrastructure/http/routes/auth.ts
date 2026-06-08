import { Router }         from 'express';
import { AuthController } from '../controllers/AuthController';
import { authenticate }   from '../middleware/authenticate';

const router     = Router();
const controller = new AuthController();

router.post('/login',   (req, res) => controller.login(req, res));
router.post('/refresh', (req, res) => controller.refresh(req, res));
router.post('/logout',  authenticate, (req, res) => controller.logout(req, res));
router.get('/me',       authenticate, (req, res) => controller.me(req, res));

export default router;
