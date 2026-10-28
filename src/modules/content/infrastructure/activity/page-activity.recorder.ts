import { Inject, Injectable } from '@nestjs/common';
import { ACTIVITY_TYPES } from 'src/modules/activity/activity.types';
import {
  ActivityAction,
  ActivityEntityType,
} from 'src/modules/activity/domain/entities/activity.entity';
import type { ActivityRepository } from 'src/modules/activity/domain/repositories/activity.repository';
import type {
  PageActivityRecorder,
  PageEdit,
} from 'src/modules/content/application/ports/page-activity-recorder.port';
import type { PersistenceContext } from 'src/shared/domain/persistence-context';

// plan-v2 §11 #5: one row per actor, Page and action within this window.
export const PAGE_EDIT_WINDOW_MS = 5 * 60 * 1000;

@Injectable()
export class ActivityPageActivityRecorder implements PageActivityRecorder {
  constructor(
    @Inject(ACTIVITY_TYPES.repositories.ActivityRepository)
    private readonly activities: ActivityRepository,
  ) {}

  async record(edit: PageEdit, context?: PersistenceContext): Promise<void> {
    if (!edit.actorId) return;
    const onBlock = edit.action.startsWith('PAGE_BLOCK_');
    const kind = edit.kind ? { kind: edit.kind } : {};
    // Ids and a kind only: the activities API is not filtered by teamspace,
    // so no title or block text may be stored here (kế hoạch ghi activity A5).
    const metadata = onBlock
      ? { pageId: edit.pageId, ...kind }
      : edit.kind
        ? kind
        : null;

    await this.activities.recordPageEdit(
      {
        actorId: edit.actorId,
        pageId: edit.pageId,
        entityType: onBlock
          ? ActivityEntityType.PAGE_BLOCK
          : ActivityEntityType.PAGE,
        // A reorder has no single block: it is recorded on the Page's id.
        entityId: onBlock ? (edit.blockId ?? edit.pageId) : edit.pageId,
        action: ActivityAction[edit.action],
        metadata,
      },
      PAGE_EDIT_WINDOW_MS,
      context,
    );
  }
}
