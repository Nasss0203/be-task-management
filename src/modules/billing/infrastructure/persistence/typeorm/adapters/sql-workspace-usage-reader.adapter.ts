import { Injectable } from '@nestjs/common';
import { DataSource } from 'typeorm';

import { AiGenerationStatus } from 'src/modules/ai_assistant/domain/enums/ai-generation-status.enum';
import { AttachmentStatus } from 'src/modules/attachment/domain/enums/attachment-status.enum';
import { WorkspaceInviteStatus } from 'src/modules/workspace/domain/enums/workspace-invite-status.enum';
import { WorkspaceInviteType } from 'src/modules/workspace/domain/enums/workspace-invite-type.enum';
import { WorkspaceMembershipType } from 'src/modules/workspace/domain/enums/workspace-membership-type.enum';
import type {
  UsagePeriod,
  WorkspaceUsage,
  WorkspaceUsageReader,
} from '../../../../application/ports/workspace-usage-reader.port';

const ASK_EVENT_KIND = 'ASK';
const ASK_EVENT_ERROR_STATUS = 'ERROR';

const USAGE_SQL = `SELECT
  (SELECT COUNT(*)::int FROM workspace_members wm
    WHERE wm.workspace_id = $1 AND wm.membership_type = $4)
  + (SELECT COUNT(*)::int FROM workspace_invites wi
    WHERE wi.workspace_id = $1 AND wi.type = $5 AND wi.status = $6
      AND wi.expires_at > $7) AS members,
  (SELECT COUNT(*)::int FROM teamspaces t
    WHERE t.workspace_id = $1 AND t.deleted_at IS NULL) AS teamspaces,
  (SELECT COALESCE(SUM(a.size), 0)::text FROM attachments a
    WHERE a.workspace_id = $1 AND a.status = $8) AS storage_bytes,
  (SELECT COUNT(*)::int FROM ai_generations g
    WHERE g.workspace_id = $1 AND g.status <> $9
      AND g.created_at >= $2 AND g.created_at < $3)
  + (SELECT COUNT(*)::int FROM ai_ask_events e
    WHERE e.workspace_id = $1 AND e.kind = $10 AND e.generation_id IS NULL
      AND e.status <> $11 AND e.created_at >= $2 AND e.created_at < $3)
    AS ai_requests`;

type UsageRow = {
  members: number;
  teamspaces: number;
  storage_bytes: string;
  ai_requests: number;
};

@Injectable()
export class SqlWorkspaceUsageReader implements WorkspaceUsageReader {
  constructor(private readonly dataSource: DataSource) {}

  async getUsage(
    workspaceId: string,
    aiPeriod: UsagePeriod,
    now: Date,
  ): Promise<WorkspaceUsage> {
    const rows: UsageRow[] = await this.dataSource.query(USAGE_SQL, [
      workspaceId,
      aiPeriod.start,
      aiPeriod.end,
      WorkspaceMembershipType.MEMBER,
      WorkspaceInviteType.EMAIL,
      WorkspaceInviteStatus.PENDING,
      now,
      AttachmentStatus.READY,
      AiGenerationStatus.FAILED,
      ASK_EVENT_KIND,
      ASK_EVENT_ERROR_STATUS,
    ]);
    const row = rows[0];

    return {
      members: row?.members ?? 0,
      teamspaces: row?.teamspaces ?? 0,
      storageBytes: Number(row?.storage_bytes ?? 0),
      aiRequests: row?.ai_requests ?? 0,
    };
  }
}
