import { EntityManager } from 'typeorm';
import { PageModel } from '../../domain/models/page.model';
import { PageRestoreLookup } from '../repositories/find-page.repository.interface';

export interface FindPageService {
  findPageById(pageId: string, manager?: EntityManager): Promise<PageModel>;

  findPageByWorkspaceId(
    workspaceId: string,
    manager?: EntityManager,
  ): Promise<PageModel>;

  findDeletedPages(
    workspaceId: string,
    manager?: EntityManager,
  ): Promise<PageModel[]>;

  findOnePageForRestore(
    workspaceId: string,
    pageId: string,
    manager?: EntityManager,
  ): Promise<PageRestoreLookup | null>;
}
