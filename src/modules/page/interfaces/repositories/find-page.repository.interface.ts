import { EntityManager } from 'typeorm';
import { PageModel } from '../../domain/models/page.model';

export type PageRestoreLookup = {
  id: string;
  workspaceId: string;
  deletedAt: Date | null;
  workspaceDeletedAt: Date | null;
};

export interface FindPageRepository {
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
