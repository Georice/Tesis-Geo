import { AuthContext } from '../../shared/types/AuthContext';

// El sync offline expone filas de tabla casi crudas para que el cliente
// móvil las cachee localmente; no son entidades de dominio con invariantes,
// son un extracto de replicación. Por eso el contrato usa `unknown[]` en vez
// de forzar una forma de dominio que no aplica a este caso de uso.
export interface SyncDataResult {
  parcelas:    unknown[];
  zonas:       unknown[];
  capas:       unknown[];
  actividades: unknown[];
  ciclos:      unknown[];
  productos:   unknown[];
}

export interface ISyncRepository {
  getSyncData(ctx: AuthContext, since: Date | null): Promise<SyncDataResult>;
}
