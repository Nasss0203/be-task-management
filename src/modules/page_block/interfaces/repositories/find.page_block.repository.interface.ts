import { EntityManager } from 'typeorm';
import { PageBlockModel } from '../../domain/models/page_block.model';

export interface FindPageBlockRepository {
  findAllByWorkspaceId(
    workspaceId: string,
    manager?: EntityManager,
  ): Promise<PageBlockModel[]>;
}
