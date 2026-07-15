-- ═══════════════════════════════════════════════════════════════════════════
-- ESTO SOLO ES NECESARIO PARA PRUEBAS, EJ: CONTENEDOR NUEVO SIN USUARIOS
-- Login admin:  cedula/usuario = admin   password = 1234
-- Login socio:  cedula/usuario = socio   password = 1234
-- (LocalUserRepository permite login por cedula, usuario o email)
-- ═══════════════════════════════════════════════════════════════════════════

INSERT INTO public.usuarios
  (cedula, nombres, apellidos, usuario, password_hash, rol, estado, email)
VALUES
  ('0000000001',
   'Admin', 'Sistema',
   'admin',
   '$2b$12$1FYOGwk11YZ1FjvALJCuCu.dYAIGHSRue67E.FeFCkOkBfOQ8twyW',
   'administrador', 'activo',
   'admin@georice.com'),

  ('0000000002',
   'Socio', 'Prueba',
   'socio',
   '$2b$12$PJLRdjHwJ4Y1zo8DOdkTi.F4meJ6ulm0Znb/8Py1y70/tGcWhUHaa',
   'socio', 'activo',
   'socio@georice.com')
ON CONFLICT ("cedula") DO NOTHING;
