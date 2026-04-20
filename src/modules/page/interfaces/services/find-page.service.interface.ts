import { EntityManager } from 'typeorm';
import { PageModel } from '../../domain/models/page.model';

export interface FindPageService {
  findPageByWorkspaceId(
    userId: string,
    workspaceId: string,
    manager?: EntityManager,
  ): Promise<PageModel>;
}
