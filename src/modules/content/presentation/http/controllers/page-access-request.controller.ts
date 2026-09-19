import {
  Body,
  Controller,
  Get,
  Inject,
  Param,
  Patch,
  Post,
} from '@nestjs/common';

import { Auth } from 'src/common/decorator/auth.decorator';
import { type IAuth } from 'src/types/auth';

import { ApprovePageAccessRequestCommand } from 'src/modules/content/application/commands/page-access-request/approve-page-access-request/approve-page-access-request.command';
import {
  ApprovePageAccessRequestHandler,
  ApprovePageAccessRequestResult,
} from 'src/modules/content/application/commands/page-access-request/approve-page-access-request/approve-page-access-request.handler';
import { CreatePageAccessRequestCommand } from 'src/modules/content/application/commands/page-access-request/create-page-access-request/create-page-access-request.command';
import {
  CreatePageAccessRequestHandler,
  CreatePageAccessRequestResult,
} from 'src/modules/content/application/commands/page-access-request/create-page-access-request/create-page-access-request.handler';
import { RejectPageAccessRequestCommand } from 'src/modules/content/application/commands/page-access-request/reject-page-access-request/reject-page-access-request.command';
import {
  RejectPageAccessRequestHandler,
  RejectPageAccessRequestResult,
} from 'src/modules/content/application/commands/page-access-request/reject-page-access-request/reject-page-access-request.handler';
import { ApprovePageAccessRequestRequestDto } from 'src/modules/content/application/dto/page-access-request/request/approve-page-access-request.request.dto';
import { CreatePageAccessRequestRequestDto } from 'src/modules/content/application/dto/page-access-request/request/create-page-access-request.request.dto';
import {
  GetPageAccessRequestItem,
  GetPageAccessRequestsHandler,
} from 'src/modules/content/application/queries/page-access-request/get-page-access-requests/get-page-access-requests.handler';
import { GetPageAccessRequestsQuery } from 'src/modules/content/application/queries/page-access-request/get-page-access-requests/get-page-access-requests.query';
import { CONTENT_TYPES } from 'src/modules/content/content.types';

@Controller()
export class PageAccessRequestController {
  constructor(
    @Inject(CONTENT_TYPES.applications.CreatePageAccessRequestHandler)
    private readonly createPageAccessRequestHandler: CreatePageAccessRequestHandler,

    @Inject(CONTENT_TYPES.applications.ApprovePageAccessRequestHandler)
    private readonly approvePageAccessRequestHandler: ApprovePageAccessRequestHandler,

    @Inject(CONTENT_TYPES.applications.RejectPageAccessRequestHandler)
    private readonly rejectPageAccessRequestHandler: RejectPageAccessRequestHandler,

    @Inject(CONTENT_TYPES.applications.GetPageAccessRequestsHandler)
    private readonly getPageAccessRequestsHandler: GetPageAccessRequestsHandler,
  ) {}

  @Post('page/:pageId/access-requests')
  async create(
    @Param('pageId')
    pageId: string,

    @Body()
    body: CreatePageAccessRequestRequestDto,

    @Auth()
    user: IAuth,
  ): Promise<CreatePageAccessRequestResult> {
    return this.createPageAccessRequestHandler.execute(
      new CreatePageAccessRequestCommand(user.id, pageId, body.token),
    );
  }

  @Patch('page-access-requests/:requestId/approve')
  async approve(
    @Param('requestId')
    requestId: string,
    @Body()
    body: ApprovePageAccessRequestRequestDto,
    @Auth()
    user: IAuth,
  ): Promise<ApprovePageAccessRequestResult> {
    return this.approvePageAccessRequestHandler.execute(
      new ApprovePageAccessRequestCommand(
        user.id,
        requestId,
        body.access_level,
      ),
    );
  }

  @Patch('page-access-requests/:requestId/reject')
  async reject(
    @Param('requestId')
    requestId: string,

    @Auth()
    user: IAuth,
  ): Promise<RejectPageAccessRequestResult> {
    return this.rejectPageAccessRequestHandler.execute(
      new RejectPageAccessRequestCommand(user.id, requestId),
    );
  }

  @Get('page/:pageId/access-requests')
  async getPendingRequests(
    @Param('pageId')
    pageId: string,

    @Auth()
    user: IAuth,
  ): Promise<GetPageAccessRequestItem[]> {
    return this.getPageAccessRequestsHandler.execute(
      new GetPageAccessRequestsQuery(user.id, pageId),
    );
  }
}
