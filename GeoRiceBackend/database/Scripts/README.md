# GeoRice BD — Scripts de base de datos

Ejecutar en orden en pgAdmin contra `georice_db`:

| Archivo | Módulo | Tablas |
|---|---|---|
| `01_auth.sql` | Autenticación | `usuarios`, `refresh_tokens` |
| `02_geo.sql` | Geográfico | `zonas`, `parcelas`, `capas_parcela` |
| `03_ciclos_fases.sql` | Ciclos agrícolas | `ciclos_actividad`, `fases_ciclo`, `plantillas_ciclo` |
| `04_actividades.sql` | Actividades | `actividades_parcela`, `productos_actividad` |
| `05_socios.sql` | Socios (MagnaRice) | `socios` + ENUMs |

> `schema.sql` se mantiene como dump completo de referencia (pg_dump).
