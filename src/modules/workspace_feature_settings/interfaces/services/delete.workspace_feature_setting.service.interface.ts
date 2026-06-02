import { EntityManager } from 'typeorm';

export interface DeleteWorkspaceFeatureSettingService {
  delete(id: string, manager?: EntityManager): Promise<void>;
}
