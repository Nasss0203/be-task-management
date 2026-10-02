import { PersistenceContext } from 'src/shared/domain/persistence-context';
import { PageTemplateBlock } from '../entities/page-template-block.entity';

export interface PageTemplateBlockRepository {
  create(
    block: PageTemplateBlock,
    context?: PersistenceContext,
  ): Promise<PageTemplateBlock>;

  save(
    block: PageTemplateBlock,
    context?: PersistenceContext,
  ): Promise<PageTemplateBlock>;

  findById(
    id: string,
    context?: PersistenceContext,
  ): Promise<PageTemplateBlock | null>;

  findByVersionId(
    versionId: string,
    context?: PersistenceContext,
  ): Promise<PageTemplateBlock[]>;

  deleteById(id: string, context?: PersistenceContext): Promise<void>;

  deleteByVersionId(
    versionId: string,
    context?: PersistenceContext,
  ): Promise<void>;

  saveMany(
    blocks: PageTemplateBlock[],
    context?: PersistenceContext,
  ): Promise<PageTemplateBlock[]>;
}
