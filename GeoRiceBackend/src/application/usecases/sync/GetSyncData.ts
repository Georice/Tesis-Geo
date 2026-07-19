import { ISyncRepository } from '../../../domain/repositories/ISyncRepository';
import { AuthContext } from '../../../shared/types/AuthContext';

export interface SyncResponseDto {
  timestamp:   string;
  incremental: boolean;
  since:       string | null;
  usuarioId:   string;
  rol:         string;
  parcelas:    unknown[];
  zonas:       unknown[];
  capas:       unknown[];
  actividades: unknown[];
  ciclos:      unknown[];
  productos:   unknown[];
}

export class GetSyncData {
  constructor(private repo: ISyncRepository) {}

  async execute(ctx: AuthContext, since: Date | null): Promise<SyncResponseDto> {
    const data = await this.repo.getSyncData(ctx, since);
    return {
      timestamp:   new Date().toISOString(),
      incremental: !!since,
      since:       since?.toISOString() ?? null,
      usuarioId:   ctx.usuarioId,
      rol:         ctx.rol,
      ...data,
    };
  }
}
