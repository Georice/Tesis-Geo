-- ═══════════════════════════════════════════════════════════════════════════
-- GeoRice BD - 04_seed_fases_plantillas.sql
-- Datos de catálogo para ciclos_actividad: plantillas_ciclo y fases_ciclo (F1-F6)
-- Réplica de PLANTILLAS_CICLO (PlantillaCiclo.ts). Requerido por el trigger
-- trg_asignar_fase (fn_asignar_fase) antes de poder iniciar un ciclo.
-- ═══════════════════════════════════════════════════════════════════════════

-- ── plantillas_ciclo ─────────────────────────────────────────────────────────
INSERT INTO public.plantillas_ciclo (tipo_ciclo, tipo_actividad, orden, dias_desde_inicio, descripcion, obligatoria) VALUES
  ('siembra_boleo', 'preparacion_suelo',  1,  0,   'Preparación del suelo con rastra o maquinaria', true),
  ('siembra_boleo', 'inundacion',         2,  3,   'Inundación del terreno antes de la siembra',    true),
  ('siembra_boleo', 'siembra_boleo',      3,  7,   'Siembra al voleo de la semilla de arroz',        true),
  ('siembra_boleo', 'riego',              4,  15,  'Primer riego post siembra',                      true),
  ('siembra_boleo', 'fertilizacion',      5,  20,  'Primera fertilización (arranque)',               true),
  ('siembra_boleo', 'deshierba',          6,  25,  'Control de malezas',                             false),
  ('siembra_boleo', 'fumigacion',         7,  35,  'Primera fumigación preventiva',                  false),
  ('siembra_boleo', 'fertilizacion',      8,  45,  'Segunda fertilización (engrose)',                true),
  ('siembra_boleo', 'fumigacion',         9,  60,  'Segunda fumigación si hay plagas',               false),
  ('siembra_boleo', 'riego',              10, 70,  'Riego de llenado de grano',                      true),
  ('siembra_boleo', 'cosecha',            11, 110, 'Cosecha del ciclo principal',                    true),

  ('siembra_trasplante', 'preparacion_suelo',  1,  0,   'Preparación del suelo',                          true),
  ('siembra_trasplante', 'inundacion',         2,  3,   'Inundación del terreno',                         true),
  ('siembra_trasplante', 'siembra_trasplante', 3,  25,  'Trasplante de plántulas al campo definitivo',    true),
  ('siembra_trasplante', 'riego',              4,  30,  'Primer riego post trasplante',                   true),
  ('siembra_trasplante', 'fertilizacion',      5,  35,  'Primera fertilización (arranque)',              true),
  ('siembra_trasplante', 'deshierba',          6,  40,  'Control de malezas',                             false),
  ('siembra_trasplante', 'fumigacion',         7,  50,  'Primera fumigación preventiva',                  false),
  ('siembra_trasplante', 'fertilizacion',      8,  60,  'Segunda fertilización (engrose)',                true),
  ('siembra_trasplante', 'fumigacion',         9,  75,  'Segunda fumigación si hay plagas',               false),
  ('siembra_trasplante', 'riego',              10, 85,  'Riego de llenado de grano',                      true),
  ('siembra_trasplante', 'cosecha',            11, 120, 'Cosecha del ciclo principal',                    true),

  ('soca', 'rozar_quemar',       1, 0,  'Rozar y quemar el rastrojo del ciclo anterior', true),
  ('soca', 'soca_riego',         2, 5,  'Primer riego del ciclo soca',                   true),
  ('soca', 'soca_fertilizacion', 3, 15, 'Fertilización del ciclo soca',                  true),
  ('soca', 'soca_fumigacion',    4, 25, 'Fumigación preventiva soca',                    false),
  ('soca', 'soca_riego',         5, 35, 'Segundo riego soca',                            true),
  ('soca', 'soca_fumigacion',    6, 50, 'Segunda fumigación si hay plagas',              false),
  ('soca', 'cosecha_soca',       7, 75, 'Cosecha del ciclo soca',                        true),

  ('resoca', 'rozar_quemar',       1, 0,  'Rozar y quemar el rastrojo', true),
  ('resoca', 'soca_riego',         2, 5,  'Primer riego resoca',        true),
  ('resoca', 'soca_fertilizacion', 3, 15, 'Fertilización resoca',       true),
  ('resoca', 'soca_riego',         4, 30, 'Segundo riego resoca',       true),
  ('resoca', 'cosecha_soca',       5, 65, 'Cosecha resoca',             true)
ON CONFLICT DO NOTHING;

-- ── fases_ciclo (F1-F6) ──────────────────────────────────────────────────────
-- Rangos de orden_plantilla (columna "orden" de plantillas_ciclo) agrupados por fase agrícola.
INSERT INTO public.fases_ciclo (codigo, nombre, tipo_ciclo, orden_fase, orden_min, orden_max, tipos_actividad, descripcion) VALUES
  ('F1', 'Preparación del terreno', 'siembra_boleo', 1, 1,  2,  ARRAY['preparacion_suelo','inundacion'],                    'Preparación del suelo e inundación previa a la siembra'),
  ('F2', 'Siembra',                 'siembra_boleo', 2, 3,  3,  ARRAY['siembra_boleo'],                                     'Siembra al voleo'),
  ('F3', 'Establecimiento',         'siembra_boleo', 3, 4,  5,  ARRAY['riego','fertilizacion'],                             'Primer riego y fertilización de arranque'),
  ('F4', 'Desarrollo vegetativo',   'siembra_boleo', 4, 6,  9,  ARRAY['deshierba','fumigacion','fertilizacion'],            'Control de malezas, fumigaciones y fertilización de engrose'),
  ('F5', 'Maduración',              'siembra_boleo', 5, 10, 10, ARRAY['riego'],                                             'Riego de llenado de grano'),
  ('F6', 'Cosecha',                 'siembra_boleo', 6, 11, 11, ARRAY['cosecha'],                                           'Cosecha del ciclo principal'),

  ('F1', 'Preparación del terreno', 'siembra_trasplante', 1, 1,  2,  ARRAY['preparacion_suelo','inundacion'],              'Preparación del suelo e inundación previa al trasplante'),
  ('F2', 'Trasplante',              'siembra_trasplante', 2, 3,  3,  ARRAY['siembra_trasplante'],                          'Trasplante de plántulas'),
  ('F3', 'Establecimiento',         'siembra_trasplante', 3, 4,  5,  ARRAY['riego','fertilizacion'],                       'Primer riego y fertilización de arranque'),
  ('F4', 'Desarrollo vegetativo',   'siembra_trasplante', 4, 6,  9,  ARRAY['deshierba','fumigacion','fertilizacion'],      'Control de malezas, fumigaciones y fertilización de engrose'),
  ('F5', 'Maduración',              'siembra_trasplante', 5, 10, 10, ARRAY['riego'],                                       'Riego de llenado de grano'),
  ('F6', 'Cosecha',                 'siembra_trasplante', 6, 11, 11, ARRAY['cosecha'],                                     'Cosecha del ciclo principal'),

  ('F1', 'Preparación del rastrojo', 'soca', 1, 1, 1, ARRAY['rozar_quemar'],                       'Rozar y quemar el rastrojo del ciclo anterior'),
  ('F2', 'Riego inicial',            'soca', 2, 2, 2, ARRAY['soca_riego'],                          'Primer riego del ciclo soca'),
  ('F3', 'Fertilización',            'soca', 3, 3, 3, ARRAY['soca_fertilizacion'],                  'Fertilización del ciclo soca'),
  ('F4', 'Manejo y maduración',      'soca', 4, 4, 6, ARRAY['soca_fumigacion','soca_riego'],        'Fumigaciones preventivas y segundo riego'),
  ('F5', 'Cosecha',                  'soca', 5, 7, 7, ARRAY['cosecha_soca'],                        'Cosecha del ciclo soca'),

  ('F1', 'Preparación del rastrojo', 'resoca', 1, 1, 1, ARRAY['rozar_quemar'],       'Rozar y quemar el rastrojo'),
  ('F2', 'Riego inicial',            'resoca', 2, 2, 2, ARRAY['soca_riego'],          'Primer riego resoca'),
  ('F3', 'Fertilización',            'resoca', 3, 3, 3, ARRAY['soca_fertilizacion'],  'Fertilización resoca'),
  ('F4', 'Maduración',               'resoca', 4, 4, 4, ARRAY['soca_riego'],          'Segundo riego resoca'),
  ('F5', 'Cosecha',                  'resoca', 5, 5, 5, ARRAY['cosecha_soca'],        'Cosecha resoca')
ON CONFLICT DO NOTHING;
