import { Inject, Injectable } from '@nestjs/common';

import { CONTENT_TYPES } from 'src/modules/content/content.types';
import type { PageBlockRepository } from 'src/modules/content/domain/repositories/page-block.repository';
import type { PageRepository } from 'src/modules/content/domain/repositories/page.repository';
import type { PersistenceContext } from 'src/shared/infrastructure/persistence/persistence-context';

import type {
  ContentPageBlockSnapshot,
  ContentPageSnapshot,
  ContentPageSnapshotReaderPort,
} from '../ports/content-page-snapshot-reader.port';

@Injectable()
export class ContentPageSnapshotReaderService implements ContentPageSnapshotReaderPort {
  constructor(
    @Inject(CONTENT_TYPES.repositories.PageRepository)
    private readonly pageRepository: PageRepository,
    @Inject(CONTENT_TYPES.repositories.PageBlockRepository)
    private readonly pageBlockRepository: PageBlockRepository,
  ) {}

  async getPageSnapshot(
    pageId: string,
    context?: PersistenceContext,
  ): Promise<ContentPageSnapshot | null> {
    const page = await this.pageRepository.findById(pageId, context);

    if (!page) {
      return null;
    }

    const blocks = await this.pageBlockRepository.findByPageId(pageId, context);

    return {
      page: {
        id: page.getId(),
        workspaceId: page.getWorkspaceId(),
        title: page.getTitle(),
        icon: page.getIcon(),
        coverUrl: page.getCoverUrl(),
      },
      blocks: blocks.map(
        (block): ContentPageBlockSnapshot => ({
          sourceId: block.getId(),
          parentSourceId: block.getParentBlockId(),
          type: block.getType(),
          title: block.getTitle(),
          positionX: block.getPositionX(),
          positionY: block.getPositionY(),
          width: block.getWidth(),
          height: block.getHeight(),
          orderIndex: block.getOrderIndex(),
          content: block.getContent(),
          styleConfig: block.getStyleConfig(),
          dataConfig: block.getDataConfig(),
          isOpen: block.getIsOpen(),
        }),
      ),
    };
  }
}
