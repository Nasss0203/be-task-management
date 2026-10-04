/* eslint-disable @typescript-eslint/no-unsafe-assignment, @typescript-eslint/unbound-method, @typescript-eslint/require-await */
import { ForbiddenException, NotFoundException } from '@nestjs/common';

import type { AuthorizationService } from 'src/modules/permission/application/services/authorization.service';
import { PERMISSIONS } from 'src/modules/permission/constants/permission.constant';
import { TemplateVersion } from '../../../../domain/aggregates/template-version/template-version.aggregate';
import type { TemplateVersionRepository } from '../../../../domain/repositories/template-version.repository';
import type { PageTemplateResponseDto } from '../../../dto/page-template/page-template.response.dto';
import type { GetPageTemplateHandler } from '../../page-template/get-page-template/get-page-template.handler';
import { ListTemplateVersionsHandler } from './list-template-versions.handler';
import { ListTemplateVersionsQuery } from './list-template-versions.query';

describe('ListTemplateVersionsHandler', () => {
  let getPageTemplateHandler: jest.Mocked<GetPageTemplateHandler>;
  let repository: jest.Mocked<TemplateVersionRepository>;
  let authorizationService: jest.Mocked<AuthorizationService>;
  let handler: ListTemplateVersionsHandler;

  const template = {
    id: 'template-1',
    workspace_id: 'workspace-1',
    created_by: 'creator-1',
  } as PageTemplateResponseDto;

  const createVersion = (
    id: string,
    versionNumber: number,
    createdBy: string,
    published: boolean,
    templateId = 'template-1',
  ) => {
    const version = TemplateVersion.create({
      id,
      templateId,
      versionNumber,
      createdBy,
    });
    if (published) version.publish();
    return version;
  };

  beforeEach(() => {
    getPageTemplateHandler = { execute: jest.fn() } as any;
    repository = { findByTemplateId: jest.fn() } as any;
    authorizationService = { authorize: jest.fn() } as any;
    handler = new ListTemplateVersionsHandler(
      getPageTemplateHandler,
      repository,
      authorizationService,
    );
    getPageTemplateHandler.execute.mockResolvedValue(template);
  });

  it('returns draft and published versions newest-first for the template creator', async () => {
    repository.findByTemplateId.mockResolvedValue([
      createVersion('version-1', 1, 'creator-1', true),
      createVersion('version-3', 3, 'creator-1', false),
      createVersion('version-2', 2, 'creator-1', true),
    ]);

    const result = await handler.execute(
      new ListTemplateVersionsQuery('template-1', 'creator-1'),
    );

    expect(result.items.map(({ id }) => id)).toEqual([
      'version-3',
      'version-2',
      'version-1',
    ]);
    expect(repository.findByTemplateId).toHaveBeenCalledWith('template-1');
  });

  it('allows a workspace owner to see draft versions', async () => {
    repository.findByTemplateId.mockResolvedValue([
      createVersion('version-2', 2, 'creator-1', false),
      createVersion('version-1', 1, 'creator-1', true),
    ]);
    authorizationService.authorize.mockResolvedValue(true);

    const result = await handler.execute(
      new ListTemplateVersionsQuery('template-1', 'owner-1'),
    );

    expect(result.items.map(({ id }) => id)).toEqual([
      'version-2',
      'version-1',
    ]);
    expect(authorizationService.authorize).toHaveBeenCalledWith(
      expect.objectContaining({
        permissions: [PERMISSIONS.WORKSPACE_UPDATE],
      }),
    );
  });

  it('hides another user draft from a normal workspace reader', async () => {
    repository.findByTemplateId.mockResolvedValue([
      createVersion('version-3', 3, 'creator-1', false),
      createVersion('version-2', 2, 'creator-1', true),
      createVersion('version-1', 1, 'creator-1', true),
    ]);
    authorizationService.authorize.mockImplementation(async ({ permissions }) =>
      permissions.includes(PERMISSIONS.WORKSPACE_READ),
    );

    const result = await handler.execute(
      new ListTemplateVersionsQuery('template-1', 'reader-1'),
    );

    expect(result.items.map(({ id }) => id)).toEqual([
      'version-2',
      'version-1',
    ]);
  });

  it('keeps an own draft visible under the existing preview rule', async () => {
    repository.findByTemplateId.mockResolvedValue([
      createVersion('version-2', 2, 'reader-1', false),
      createVersion('version-1', 1, 'creator-1', true),
    ]);
    authorizationService.authorize.mockResolvedValue(false);

    const result = await handler.execute(
      new ListTemplateVersionsQuery('template-1', 'reader-1'),
    );

    expect(result.items.map(({ id }) => id)).toEqual([
      'version-2',
      'version-1',
    ]);
  });

  it('does not return a version outside the requested template', async () => {
    repository.findByTemplateId.mockResolvedValue([
      createVersion('version-1', 1, 'creator-1', true),
      createVersion('foreign-version', 99, 'creator-1', true, 'template-2'),
    ]);

    const result = await handler.execute(
      new ListTemplateVersionsQuery('template-1', 'creator-1'),
    );

    expect(result.items.map(({ id }) => id)).toEqual(['version-1']);
  });

  it.each([
    new NotFoundException('Page template not found'),
    new ForbiddenException('No template access'),
  ])(
    'propagates template access failure without querying versions',
    async (error) => {
      getPageTemplateHandler.execute.mockRejectedValue(error);

      await expect(
        handler.execute(new ListTemplateVersionsQuery('template-1', 'user-1')),
      ).rejects.toBe(error);
      expect(repository.findByTemplateId).not.toHaveBeenCalled();
    },
  );
});
