import { EntityManager } from 'typeorm';
import { PageModel } from '../../domain/models/page.model';

export type UpdatePageInput = {
  id: string;
  title?: string;
  slug?: string | null;
  icon?: string | null;
  cover_url?: string | null;
};

export interface UpdatePageRepository {
  save(page: UpdatePageInput, manager?: EntityManager): Promise<PageModel>;
}
