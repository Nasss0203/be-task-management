import { Controller, Get, Param, ParseUUIDPipe, Query } from '@nestjs/common';
import { Auth } from 'src/common/decorator/auth.decorator';
import { ReadRateLimit } from 'src/common/decorator/rate-limit.decorator';
import { RequirePermissions } from 'src/common/decorator/require-permissions.decorator';
import { ResponseMessage } from 'src/common/decorator/response-message.decorator';
import { WorkspaceContext } from 'src/common/decorator/workspace-context.decorator';
import {
  ListMentionCandidatesHandler,
  MentionCandidateResponseDto,
} from 'src/modules/mentions/application/queries/list-mention-candidates/list-mention-candidates.handler';
import { ListMentionCandidatesQuery } from 'src/modules/mentions/application/queries/list-mention-candidates/list-mention-candidates.query';
import { PERMISSIONS } from 'src/modules/permission/constants/permission.constant';
import { type IAuth } from 'src/types/auth';

@Controller()
export class MentionController {
  constructor(
    private readonly listMentionCandidatesHandler: ListMentionCandidatesHandler,
  ) {}

  /** Người có thể nhắc tới trong comment của page (gợi ý khi gõ `@`). */
  @Get('page/:pageId/mention-candidates')
  @ReadRateLimit()
  @WorkspaceContext({ source: 'resource', type: 'page', key: 'pageId' })
  @RequirePermissions(PERMISSIONS.PAGE_COMMENT_CREATE)
  @ResponseMessage('List mention candidates')
  listCandidates(
    @Auth() auth: IAuth,
    @Param('pageId', ParseUUIDPipe) pageId: string,
    @Query('q') search?: string,
  ): Promise<MentionCandidateResponseDto[]> {
    return this.listMentionCandidatesHandler.execute(
      new ListMentionCandidatesQuery(
        pageId,
        typeof search === 'string' ? search : '',
        auth.id,
      ),
    );
  }
}
