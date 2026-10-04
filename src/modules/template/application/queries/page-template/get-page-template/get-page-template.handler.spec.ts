/* eslint-disable @typescript-eslint/no-unsafe-assignment */
import { ForbiddenException, NotFoundException } from '@nestjs/common';

import type { AuthorizationService } from 'src/modules/permission/application/services/authorization.service';
import { PageTemplate } from '../../../../domain/aggregates/page-template/page-template.aggregate';
import { TemplateStatus } from '../../../../domain/enums/template-status.enum';
import { TemplateVisibility } from '../../../../domain/enums/template-visibility.enum';
import type { PageTemplateRepository } from '../../../../domain/repositories/page-template.repository';
import { GetPageTemplateHandler } from './get-page-template.handler';
import { GetPageTemplateQuery } from './get-page-template.query';

describe('GetPageTemplateHandler', () => {
  let repository: jest.Mocked<PageTemplateRepository>;
  let authorizationService: jest.Mocked<AuthorizationService>;
  let handler: GetPageTemplateHandler;

  const template = PageTemplate.restore({
    id: 'template-1',
    sourcePageId: 'page-1',
    workspaceId: 'workspace-1',
    name: 'Template',
    description: null,
    icon: null,
    coverUrl: null,
    createdBy: 'creator-1',
    status: TemplateStatus.PUBLISHED,
    visibility: TemplateVisibility.PRIVATE,
    createdAt: new Date('2026-01-01T00:00:00.000Z'),
    updatedAt: new Date('2026-01-02T00:00:00.000Z'),
  });

  beforeEach(() => {
    repository = { findById: jest.fn() } as any;
    authorizationService = { authorize: jest.fn() } as any;
    handler = new GetPageTemplateHandler(repository, authorizationService);
  });

  it('returns the existing DTO for an authorized template creator', async () => {
    repository.findById.mockResolvedValue(template);
    authorizationService.authorize.mockResolvedValue(false);

    await expect(
      handler.execute(new GetPageTemplateQuery('template-1', 'creator-1')),
    ).resolves.toEqual(
      expect.objectContaining({
        id: 'template-1',
        workspace_id: 'workspace-1',
        created_by: 'creator-1',
      }),
    );
  });

  it('throws NotFoundException when the template does not exist', async () => {
    repository.findById.mockResolvedValue(null);

    await expect(
      handler.execute(new GetPageTemplateQuery('missing', 'user-1')),
    ).rejects.toBeInstanceOf(NotFoundException);
  });

  it('throws ForbiddenException for an unauthorized private template', async () => {
    repository.findById.mockResolvedValue(template);
    authorizationService.authorize.mockResolvedValue(false);

    await expect(
      handler.execute(new GetPageTemplateQuery('template-1', 'reader-1')),
    ).rejects.toBeInstanceOf(ForbiddenException);
  });
});
