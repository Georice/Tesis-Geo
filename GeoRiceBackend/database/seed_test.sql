-- ═══════════════════════════════════════════════════════════════════════════
-- ESTO SOLO SERIA NECESSARIO PARA PRUEBAS CUANDO POR EJEMPLO QUIERAS PROBAR CON UN CONTENEDOR NUEVO Y NO TENGAS USUARIOS
-- Admin:  email=admin@georice.com  password=admin123
-- Socio:  email=socio@georice.com  password=socio123
-- ═══════════════════════════════════════════════════════════════════════════

INSERT INTO "usuarios" ("id", "email", "password", "nombre", "apellido", "activo", "updatedAt")
VALUES
  ('1',
   'admin@georice.com',
   '$2b$10$yOZIkAs.DEztWchSAqJmeeDG5G.kSvK8IYuNWLA/Fz2I2aMuTLdZ2',
   'Admin', 'Sistema', true, NOW()),

  ('2',
   'socio@georice.com',
   '$2b$10$m9xxtUVXv5lDahctL/UsFubbbilogY9Vusfn3bWe5nfz/cnL/Re4q',
   'Juan', 'Pérez', true, NOW())
ON CONFLICT ("id") DO NOTHING;

--INSERT INTO "socios" ("id", "cedula", "nombre", "apellido", "telefono", "rol", "nivelAcceso", "usuarioId", "updatedAt")
--VALUES
--  ('2',
--   '1234567890',
--   'Admin', 'Sistema', '0999999999',
--   'PRESIDENTE', 'ADMIN',
--   '1', NOW()),
--
--  ('2',
--   '0987654321',
--   'Juan', 'Pérez', '0988888888',
--   'SOCIO', 'MIEMBRO',
--   'b2c3d4e5-0002-0002-0002-000000000002', NOW())
--ON CONFLICT ("id") DO NOTHING;
