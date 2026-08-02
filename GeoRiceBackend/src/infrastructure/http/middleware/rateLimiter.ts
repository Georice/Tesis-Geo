import rateLimit from 'express-rate-limit';

// Limita intentos de login/refresh para mitigar fuerza bruta y credential
// stuffing. 10 intentos cada 15 minutos por IP.
export const authRateLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  limit: 10,
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: 'Demasiados intentos. Intenta de nuevo más tarde.' },
});
