import { EntityManager } from 'typeorm';
import { PageModel } from '../../domain/models/page.model';

export type SavePageInput = Pick<
  PageModel,
  'slug' | 'title' | 'created_by' | 'workspace_id'
> &
  Partial<
    Pick<PageModel, 'id' | 'createdAt' | 'updatedAt' | 'is_template' | 'blocks'>
  >;

export interface PageRepository {
  save(
    page: PageModel | SavePageInput,
    manager: EntityManager,
  ): Promise<PageModel>;
}
