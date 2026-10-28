import { PersistenceContext } from 'src/shared/domain/persistence-context';
import { Mention } from '../entities/mention.entity';
import { MentionSourceType } from '../enums/mention-source-type.enum';

export interface MentionRepository {
  saveMany(mentions: Mention[], context?: PersistenceContext): Promise<void>;

  findBySource(
    sourceType: MentionSourceType,
    sourceId: string,
    context?: PersistenceContext,
  ): Promise<Mention[]>;

  deleteByIds(ids: string[], context?: PersistenceContext): Promise<void>;

  deleteBySources(
    sourceType: MentionSourceType,
    sourceIds: string[],
    context?: PersistenceContext,
  ): Promise<void>;
}
