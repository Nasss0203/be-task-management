import { Inject, Injectable } from '@nestjs/common';
import { ACTIVITY_TYPES } from 'src/modules/activity/activity.types';
import {
  ActivityAction,
  ActivityEntityType,
} from 'src/modules/activity/domain/entities/activity.entity';
import type { ActivityRepository } from 'src/modules/activity/domain/repositories/activity.repository';
import type {
  DatabaseActivityRecorder,
  DatabaseEdit,
} from 'src/modules/database/application/ports/database-activity-recorder.port';
import type { DatabaseRepository } from 'src/modules/database/domain/repositories/database.repository';
import { DATABASE_TYPES } from 'src/modules/database/database.types';
import type { PersistenceContext } from 'src/shared/domain/persistence-context';

export const DATABASE_ROW_EDIT_WINDOW_MS = 5 * 60 * 1000;

@Injectable()
export class ActivityDatabaseActivityRecorder implements DatabaseActivityRecorder {
  constructor(
    @Inject(ACTIVITY_TYPES.repositories.ActivityRepository)
    private readonly activities: ActivityRepository,
    @Inject(DATABASE_TYPES.repositories.DatabaseRepository)
    private readonly databases: DatabaseRepository,
  ) {}

  async record(
    edit: DatabaseEdit,
    context?: PersistenceContext,
  ): Promise<void> {
    if (!edit.actorId) return;
    const pageId = await this.databases.findPageId(edit.databaseId, context);
    if (!pageId) return;

    const onRow = edit.action.startsWith('DATABASE_ROW_');
    const details = {
      databaseId: onRow ? edit.databaseId : undefined,
      propertyId: edit.propertyId,
      optionId: edit.optionId,
      kind: edit.kind,
    };
    const metadata = Object.fromEntries(
      Object.entries(details).filter(([, value]) => value !== undefined),
    );

    await this.activities.recordOnPage(
      {
        actorId: edit.actorId,
        pageId,
        entityType: onRow
          ? ActivityEntityType.DATABASE_ROW
          : ActivityEntityType.DATABASE,
        entityId: onRow ? (edit.rowId ?? edit.databaseId) : edit.databaseId,
        action: ActivityAction[edit.action],
        field: edit.field ?? null,
        metadata: Object.keys(metadata).length ? metadata : null,
      },
      edit.action === 'DATABASE_ROW_UPDATED'
        ? DATABASE_ROW_EDIT_WINDOW_MS
        : null,
      context,
    );
  }
}
