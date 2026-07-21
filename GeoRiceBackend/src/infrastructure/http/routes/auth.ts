import { Router }         from 'express';
import { AuthController } from '../controllers/AuthController';
import { authenticate }   from '../middleware/authenticate';
import { authRateLimiter } from '../middleware/rateLimiter';
import { AuthService }    from '../../../application/services/AuthService';
import { LocalUserRepository } from '../../db/repositories/LocalUserRepository';

const router      = Router();
const authService = new AuthService(new LocalUserRepository());
const controller  = new AuthController(authService);

router.post('/login',   authRateLimiter, (req, res) => controller.login(req, res));
router.post('/refresh', authRateLimiter, (req, res) => controller.refresh(req, res));
router.post('/logout',  authenticate, (req, res) => controller.logout(req, res));
router.get('/me',       authenticate, (req, res) => controller.me(req, res));

export default router;
