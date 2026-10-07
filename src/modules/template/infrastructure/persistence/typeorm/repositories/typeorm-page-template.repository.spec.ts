import 'reflect-metadata';
import type { DataSource } from 'typeorm';
import { TemplateStatus } from '../../../../domain/enums/template-status.enum';
import { TemplateVisibility } from '../../../../domain/enums/template-visibility.enum';
import { TemplateVersionStatus } from '../../../../domain/enums/template-version-status.enum';
import { TemplateListScope } from '../../../../presentation/http/requests/list-page-templates.request';
import { ListPageTemplatesHandler } from '../../../../application/queries/page-template/list-page-templates/list-page-templates.handler';
import { ListPageTemplatesQuery } from '../../../../application/queries/page-template/list-page-templates/list-page-templates.query';
import type { AuthorizationService } from 'src/modules/permission/application/services/authorization.service';
import { TypeOrmPageTemplateRepository } from './typeorm-page-template.repository';

describe('Template list represented version', () => {
  const now = new Date('2026-10-01T00:00:00Z');
  const template = {
    id: 'template-id',
    sourcePageId: null,
    workspaceId: 'workspace-id',
    name: 'Snapshot',
    description: null,
    icon: null,
    coverUrl: null,
    createdBy: 'creator-id',
    status: TemplateStatus.DRAFT,
    visibility: TemplateVisibility.PUBLIC,
    createdAt: now,
    updatedAt: now,
  };
  const published = {
    id: 'published-v1',
    templateId: template.id,
    versionNumber: 1,
    status: TemplateVersionStatus.PUBLISHED,
    createdBy: template.createdBy,
    snapshotHash: null,
    publishedAt: now,
    createdAt: now,
    updatedAt: now,
  };
  const draft = {
    ...published,
    id: 'draft-v2',
    versionNumber: 2,
    status: TemplateVersionStatus.DRAFT,
    publishedAt: null,
  };

  function setup(rows = [template], versions = [published, draft]) {
    let versionStatus: TemplateVersionStatus | undefined;
    const templateQb = {
      where: jest.fn().mockReturnThis(),
      andWhere: jest.fn().mockReturnThis(),
      orderBy: jest.fn().mockReturnThis(),
      addOrderBy: jest.fn().mockReturnThis(),
      take: jest.fn().mockReturnThis(),
      getMany: jest.fn().mockResolvedValue(rows),
    };
    const versionQb = {
      distinctOn: jest.fn().mockReturnThis(),
      where: jest.fn().mockReturnThis(),
      orderBy: jest.fn().mockReturnThis(),
      addOrderBy: jest.fn().mockReturnThis(),
      andWhere: jest.fn(
        (
          _sql: string,
          params: { versionStatus: TemplateVersionStatus },
        ): unknown => {
          versionStatus = params.versionStatus;
          return versionQb;
        },
      ),
      getMany: jest.fn(() =>
        Promise.resolve(
          versions
            .filter((v) => !versionStatus || v.status === versionStatus)
            .sort((a, b) => b.versionNumber - a.versionNumber)
            .slice(0, 1),
        ),
      ),
    };
    const ormRepo = {
      createQueryBuilder: jest.fn().mockReturnValue(templateQb),
      manager: {
        getRepository: jest.fn().mockReturnValue({
          createQueryBuilder: jest.fn().mockReturnValue(versionQb),
        }),
      },
    };
    const source = { getRepository: jest.fn().mockReturnValue(ormRepo) };
    return {
      repository: new TypeOrmPageTemplateRepository(
        source as unknown as DataSource,
      ),
      versionQb,
      source,
      ormRepo,
    };
  }

  it.each([TemplateListScope.MINE, TemplateListScope.WORKSPACE])(
    '%s selects the latest working version in one batch',
    async (scope) => {
      const { repository, versionQb } = setup();
      const result = await repository.findMany({
        scope,
        userId: 'creator-id',
        limit: 20,
      });
      expect(result.versions.get(template.id)?.getId()).toBe(draft.id);
      expect(result.versions.get(template.id)?.getStatus()).toBe(
        TemplateVersionStatus.DRAFT,
      );
      expect(versionQb.distinctOn).toHaveBeenCalledWith(['version.templateId']);
      expect(versionQb.where).toHaveBeenCalledWith(
        'version.templateId IN (:...templateIds)',
        { templateIds: [template.id] },
      );
      expect(versionQb.addOrderBy).toHaveBeenCalledWith(
        'version.versionNumber',
        'DESC',
      );
      expect(versionQb.getMany).toHaveBeenCalledTimes(1);
      expect(versionQb.andWhere).not.toHaveBeenCalled();
    },
  );

  it('public scope selects published v1 instead of draft v2', async () => {
    const { repository, versionQb } = setup();
    const result = await repository.findMany({
      scope: TemplateListScope.PUBLIC,
      userId: 'creator-id',
      limit: 20,
    });
    expect(versionQb.andWhere).toHaveBeenCalledWith(
      'version.status = :versionStatus',
      {
        versionStatus: TemplateVersionStatus.PUBLISHED,
      },
    );
    expect(result.versions.get(template.id)?.getId()).toBe(published.id);
    expect(result.versions.get(template.id)?.getStatus()).toBe(
      TemplateVersionStatus.PUBLISHED,
    );
  });

  it('skips the version query for an empty template page', async () => {
    const { repository, versionQb } = setup([]);
    const result = await repository.findMany({
      scope: TemplateListScope.MINE,
      userId: 'creator-id',
      limit: 20,
    });
    expect(result.versions.size).toBe(0);
    expect(versionQb.getMany).not.toHaveBeenCalled();
  });

  it.each([{ versions: [] }, { versions: [published] }])(
    'maps the selected version to the list DTO independently of template status',
    async ({ versions }) => {
      const { repository } = setup([template], versions);
      const handler = new ListPageTemplatesHandler(
        repository,
        {} as AuthorizationService,
      );
      const response = await handler.execute(
        new ListPageTemplatesQuery('creator-id', TemplateListScope.MINE),
      );
      expect(response.items[0].status).toBe(TemplateStatus.DRAFT);
      if (versions.length === 0) {
        expect(response.items[0].version).toBeNull();
      } else {
        expect(response.items[0].version).toMatchObject({
          id: published.id,
          version_number: 1,
          status: TemplateVersionStatus.PUBLISHED,
        });
      }
    },
  );

  it('uses the supplied persistence manager for both queries', async () => {
    const { repository, ormRepo, source } = setup();
    const manager = { getRepository: jest.fn().mockReturnValue(ormRepo) };
    await repository.findMany(
      { scope: TemplateListScope.MINE, userId: 'creator-id', limit: 20 },
      manager,
    );
    expect(manager.getRepository).toHaveBeenCalledTimes(1);
    expect(ormRepo.manager.getRepository).toHaveBeenCalledTimes(1);
    expect(source.getRepository).not.toHaveBeenCalled();
  });
});
