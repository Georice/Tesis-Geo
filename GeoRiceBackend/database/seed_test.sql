-- ═══════════════════════════════════════════════════════════════════════════
-- ESTO SOLO SERIA NECESSARIO PARA PRUEBAS CUANDO POR EJEMPLO QUIERAS PROBAR CON UN CONTENEDOR NUEVO Y NO TENGAS USUARIOS
-- Admin:  usuario=admin  cedula=1111111111  password=admin123
-- Socio:  usuario=socio  cedula=2222222222  password=socio123
-- (login acepta cedula, usuario o email indistintamente, ver LocalUserRepository.findByEmail)
-- ═══════════════════════════════════════════════════════════════════════════

INSERT INTO public.usuarios
  ("cedula", "nombres", "apellidos", "usuario", "password_hash", "rol", "estado", "email")
VALUES
  ('1111111111',
   'Admin', 'Sistema',
   'admin',
   '$2b$12$IaTztfUQ1jOyEMQ4cm60hunt7pVRv5.rl0N5PCLUCOETIiMI5hdFi',
   'administrador', 'activo',
   'admin@georice.com'),

  ('2222222222',
   'Juan', 'Pérez',
   'socio',
   '$2b$12$ysFqrY/YyC8Lm6SqfQaCke1iMKbfXv7gPJUBC3SBvS/OP.8bWqjC2',
   'socio', 'activo',
   'socio@georice.com')
ON CONFLICT ("cedula") DO NOTHING;