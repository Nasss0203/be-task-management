import { Controller, Get, Inject, Param, Patch, Post } from '@nestjs/common';
import { Auth } from 'src/common/decorator/auth.decorator';
import { ApprovePageEditRequestCommand } from 'src/modules/content/application/commands/page-edit-request/approve-page-edit-request/approve-page-edit-request.command';
import { ApprovePageEditRequestHandler } from 'src/modules/content/application/commands/page-edit-request/approve-page-edit-request/approve-page-edit-request.handler';
import { CreatePageEditRequestCommand } from 'src/modules/content/application/commands/page-edit-request/create-page-edit-request/create-page-edit-request.command';
import { CreatePageEditRequestHandler } from 'src/modules/content/application/commands/page-edit-request/create-page-edit-request/create-page-edit-request.handler';
import { RejectPageEditRequestCommand } from 'src/modules/content/application/commands/page-edit-request/reject-page-edit-request/reject-page-edit-request.command';
import { RejectPageEditRequestHandler } from 'src/modules/content/application/commands/page-edit-request/reject-page-edit-request/reject-page-edit-request.handler';
import { GetMyPageEditRequestsHandler } from 'src/modules/content/application/queries/page-edit-request/get-my-page-edit-requests/get-my-page-edit-requests.handler';
import { GetMyPageEditRequestsQuery } from 'src/modules/content/application/queries/page-edit-request/get-my-page-edit-requests/get-my-page-edit-requests.query';

import { GetPageEditRequestsHandler } from 'src/modules/content/application/queries/page-edit-request/get-page-edit-requests/get-page-edit-requests.handler';
import { GetPageEditRequestsQuery } from 'src/modules/content/application/queries/page-edit-request/get-page-edit-requests/get-page-edit-requests.query';
import { CONTENT_TYPES } from 'src/modules/content/content.types';
import { type IAuth } from 'src/types/auth';

@Controller()
export class PageEditRequestController {
  constructor(
    @Inject(CONTENT_TYPES.applications.CreatePageEditRequestHandler)
    private readonly createPageEditRequestHandler: CreatePageEditRequestHandler,

    @Inject(CONTENT_TYPES.applications.GetPageEditRequestsHandler)
    private readonly getPageEditRequestsHandler: GetPageEditRequestsHandler,

    @Inject(CONTENT_TYPES.applications.ApprovePageEditRequestHandler)
    private readonly approvePageEditRequestHandler: ApprovePageEditRequestHandler,
    @Inject(CONTENT_TYPES.applications.RejectPageEditRequestHandler)
    private readonly rejectPageEditRequestHandler: RejectPageEditRequestHandler,
    @Inject(CONTENT_TYPES.applications.GetMyPageEditRequestsHandler)
    private readonly getMyPageEditRequestsHandler: GetMyPageEditRequestsHandler,
  ) {}

  @Post('page/:pageId/edit-requests')
  async create(
    @Param('pageId') pageId: string,

    @Auth() userId: IAuth,
  ) {
    return this.createPageEditRequestHandler.execute(
      new CreatePageEditRequestCommand(userId.id, pageId),
    );
  }

  @Get('page/:pageId/edit-requests')
  async findByPage(
    @Param('pageId')
    pageId: string,

    @Auth() userId: IAuth,
  ) {
    return this.getPageEditRequestsHandler.execute(
      new GetPageEditRequestsQuery(userId.id, pageId),
    );
  }

  @Patch('page-edit-requests/:requestId/approve')
  async approve(@Param('requestId') requestId: string, @Auth() userId: IAuth) {
    return this.approvePageEditRequestHandler.execute(
      new ApprovePageEditRequestCommand(userId.id, requestId),
    );
  }

  @Patch('page-edit-requests/:requestId/reject')
  async reject(@Param('requestId') requestId: string, @Auth() userId: IAuth) {
    return this.rejectPageEditRequestHandler.execute(
      new RejectPageEditRequestCommand(userId.id, requestId),
    );
  }

  @Get('page-edit-requests/mine')
  async getMine(@Auth() userId: IAuth) {
    return this.getMyPageEditRequestsHandler.execute(
      new GetMyPageEditRequestsQuery(userId.id),
    );
  }
}
