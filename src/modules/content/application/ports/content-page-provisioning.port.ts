import { PersistenceContext } from 'src/shared/infrastructure/persistence/persistence-context';

export type CreateDefaultPageInput = {
  workspaceId: string;
  title: string;
  slug: string;
  createdBy: string;
};

export interface ContentPageProvisioningPort {
  createDefaultPage(
    input: CreateDefaultPageInput,
    context?: PersistenceContext,
  ): Promise<void>;
}
