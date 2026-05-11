import { Router, Request, Response } from 'express';
import pool from '../db';

const router = Router();

router.post('/', async (req: Request, res: Response) => {
  try {
    const { nombre, propietario, cultivo, geometria } = req.body;
    const geoJson = JSON.stringify(geometria);

    const query = `
      INSERT INTO parcelas (nombre, propietario, cultivo, geometria)
      VALUES ($1, $2, $3, ST_GeomFromGeoJSON($4))
      RETURNING id, nombre, propietario, cultivo, ST_AsGeoJSON(geometria) as geometria, ST_Area(geometria::geography) / 10000 as area_ha
    `;
    const values = [nombre, propietario, cultivo, geoJson];
    const result = await pool.query(query, values);

    res.status(201).json(result.rows[0]);
  } catch (error) {
    console.error('Error al guardar parcela:', error);
    res.status(500).json({ error: 'Error interno del servidor' });
  }
});

// GET /api/parcelas
router.get('/', async (req: Request, res: Response) => {
  try {
    const result = await pool.query(`
      SELECT 
        id,
        nombre,
        propietario,
        cultivo,
        ST_AsGeoJSON(geometria) AS geometria_json,
        ST_Area(geometria::geography) / 10000 AS area_ha,
        fecha_creacion
      FROM parcelas
      ORDER BY fecha_creacion DESC
    `);
    
    // Transformamos la respuesta: convertimos geometria_json de string a objeto
    const parcelas = result.rows.map(row => ({
      ...row,
      geometria: JSON.parse(row.geometria_json),
    }));

    res.json(parcelas);
  } catch (error) {
    console.error('Error al obtener parcelas:', error);
    res.status(500).json({ error: 'Error interno del servidor' });
  }
});

// PUT /api/parcelas/:id
router.put('/:id', async (req: Request, res: Response) => {
  const { id } = req.params;
  const { nombre, propietario, cultivo } = req.body;

  try {
    const query = `
      UPDATE parcelas
      SET 
        nombre = COALESCE($1, nombre),
        propietario = COALESCE($2, propietario),
        cultivo = COALESCE($3, cultivo)
      WHERE id = $4
      RETURNING id, nombre, propietario, cultivo, ST_AsGeoJSON(geometria) as geometria, ST_Area(geometria::geography) / 10000 as area_ha
    `;
    const values = [nombre || null, propietario || null, cultivo || null, id];
    const result = await pool.query(query, values);

    if (result.rowCount === 0) {
      return res.status(404).json({ error: 'Parcela no encontrada' });
    }

    res.json(result.rows[0]);
  } catch (error) {
    console.error('Error al actualizar parcela:', error);
    res.status(500).json({ error: 'Error interno del servidor' });
  }
});

// DELETE /api/parcelas/:id
router.delete('/:id', async (req: Request, res: Response) => {
  const { id } = req.params;

  try {
    const result = await pool.query('DELETE FROM parcelas WHERE id = $1 RETURNING id', [id]);
    if (result.rowCount === 0) {
      return res.status(404).json({ error: 'Parcela no encontrada' });
    }
    res.json({ mensaje: 'Parcela eliminada', id: Number(id) });
  } catch (error) {
    console.error('Error al eliminar parcela:', error);
    res.status(500).json({ error: 'Error interno del servidor' });
  }
});

// PUT /api/parcelas/:id (editar atributos y/o geometría)
// PUT /api/parcelas/:id/geometry (editar SOLO geometría)
router.put('/:id/geometry', async (req: Request, res: Response) => {
  const { id } = req.params;
  const { geometria } = req.body;

  if (!geometria) {
    return res.status(400).json({ error: 'Se requiere el campo geometria' });
  }

  try {
    const query = `
      UPDATE parcelas
      SET geometria = ST_GeomFromGeoJSON($1)
      WHERE id = $2
      RETURNING id, nombre, propietario, cultivo, ST_AsGeoJSON(geometria) as geometria, ST_Area(geometria::geography) / 10000 as area_ha
    `;
    const values = [JSON.stringify(geometria), id];
    const result = await pool.query(query, values);

    if (result.rowCount === 0) {
      return res.status(404).json({ error: 'Parcela no encontrada' });
    }

    res.json(result.rows[0]);
  } catch (error) {
    console.error('Error al actualizar geometría:', error);
    res.status(500).json({ error: 'Error interno del servidor' });
  }
});
export default router;