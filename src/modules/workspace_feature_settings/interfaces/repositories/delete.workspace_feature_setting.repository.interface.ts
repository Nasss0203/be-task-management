import { EntityManager } from 'typeorm';

export interface DeleteWorkspaceFeatureSettingRepository {
  softDelete(id: string, manager?: EntityManager): Promise<void>;
}
