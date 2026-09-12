import type { PersistenceContext } from 'src/shared/infrastructure/persistence/persistence-context';

import type { PageShareSetting } from '../entities/page-share-setting.entity';

export interface PageShareSettingRepository {
  findByPageId(
    pageId: string,
    context?: PersistenceContext,
  ): Promise<PageShareSetting | null>;

  save(
    setting: PageShareSetting,
    context?: PersistenceContext,
  ): Promise<PageShareSetting>;
}
