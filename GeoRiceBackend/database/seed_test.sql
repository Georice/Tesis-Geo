-- ═══════════════════════════════════════════════════════════════════════════
-- ESTO SOLO SERIA NECESSARIO PARA PRUEBAS CUANDO POR EJEMPLO QUIERAS PROBAR CON UN CONTENEDOR NUEVO Y NO TENGAS USUARIOS
-- Admin:  cedula=1111111111  password=admin123  (PRESIDENTE en socios -> rol efectivo administrador)
-- Socio:  cedula=2222222222  password=socio123  (SOCIO en socios -> rol efectivo socio)
-- (login acepta cedula o email indistintamente, ver LocalUserRepository.findByEmail
--  y el rol efectivo lo resuelve AuthService.resolveRol() contra "socios")
-- ═══════════════════════════════════════════════════════════════════════════

INSERT INTO public.usuarios
  (id, cedula, nombre, apellido, password, activo, email)
VALUES
  ('00000000-0000-0000-0000-000000000001',
   '1111111111',
   'Admin', 'Sistema',
   '$2b$12$IaTztfUQ1jOyEMQ4cm60hunt7pVRv5.rl0N5PCLUCOETIiMI5hdFi',
   true,
   'admin@georice.com'),

  ('00000000-0000-0000-0000-000000000002',
   '2222222222',
   'Juan', 'Pérez',
   '$2b$12$ysFqrY/YyC8Lm6SqfQaCke1iMKbfXv7gPJUBC3SBvS/OP.8bWqjC2',
   true,
   'socio@georice.com')
ON CONFLICT (cedula) DO NOTHING;

INSERT INTO public.socios
  (id, cedula, nombre, apellido, email, rol, "nivelAcceso", estado, "usuarioId")
VALUES
  ('00000000-0000-0000-0000-000000000011',
   '1111111111', 'Admin', 'Sistema', 'admin@georice.com',
   'PRESIDENTE', 'ADMIN', 'ACTIVO',
   '00000000-0000-0000-0000-000000000001'),

  ('00000000-0000-0000-0000-000000000012',
   '2222222222', 'Juan', 'Pérez', 'socio@georice.com',
   'SOCIO', 'MIEMBRO', 'ACTIVO',
   '00000000-0000-0000-0000-000000000002')
ON CONFLICT (cedula) DO NOTHING;
