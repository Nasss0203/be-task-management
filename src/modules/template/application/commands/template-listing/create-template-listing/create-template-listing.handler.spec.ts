import {
  BadRequestException,
  ConflictException,
  ForbiddenException,
  NotFoundException,
} from '@nestjs/common';

import type { AuthorizationService } from 'src/modules/permission/application/services/authorization.service';
import { PERMISSIONS } from 'src/modules/permission/constants/permission.constant';
import type { PersistenceContext } from 'src/shared/domain/persistence-context';
import type { UnitOfWork } from 'src/shared/infrastructure/persistence/unit-of-work.interface';
import { PageTemplate } from '../../../../domain/aggregates/page-template/page-template.aggregate';
import { TemplateListing } from '../../../../domain/aggregates/template-listing/template-listing.aggregate';
import { TemplateListingStatus } from '../../../../domain/enums/template-listing-status.enum';
import { TemplateOfferType } from '../../../../domain/enums/template-offer-type.enum';
import { TemplateVisibility } from '../../../../domain/enums/template-visibility.enum';
import type { PageTemplateRepository } from '../../../../domain/repositories/page-template.repository';
import type { TemplateListingRepository } from '../../../../domain/repositories/template-listing.repository';
import { CreateTemplateListingCommand } from './create-template-listing.command';
import { CreateTemplateListingHandler } from './create-template-listing.handler';

describe('CreateTemplateListingHandler', () => {
  let pageTemplates: jest.Mocked<Pick<PageTemplateRepository, 'findById'>>;
  let listings: jest.Mocked<
    Pick<TemplateListingRepository, 'findByTemplateId' | 'create'>
  >;
  let authorization: jest.Mocked<Pick<AuthorizationService, 'authorize'>>;
  let unitOfWork: jest.Mocked<UnitOfWork>;
  let handler: CreateTemplateListingHandler;
  let template: PageTemplate;
  const context: PersistenceContext = { transaction: 'listing-transaction' };
  const command = new CreateTemplateListingCommand('template-1', 'creator-1');

  beforeEach(() => {
    template = PageTemplate.create({
      id: 'template-1',
      sourcePageId: null,
      workspaceId: 'workspace-1',
      name: 'Template',
      createdBy: 'creator-1',
    });
    pageTemplates = { findById: jest.fn().mockResolvedValue(template) };
    listings = {
      findByTemplateId: jest.fn().mockResolvedValue(null),
      create: jest
        .fn<Promise<TemplateListing>, [TemplateListing, PersistenceContext?]>()
        .mockImplementation((listing) => Promise.resolve(listing)),
    };
    authorization = { authorize: jest.fn().mockResolvedValue(false) };
    unitOfWork = { runInTransaction: jest.fn() };
    unitOfWork.runInTransaction.mockImplementation((fn) => fn(context));
    handler = new CreateTemplateListingHandler(
      pageTemplates as PageTemplateRepository,
      listings as TemplateListingRepository,
      unitOfWork,
      authorization as AuthorizationService,
    );
  });

  it('creates a FREE DRAFT listing for the creator of a PRIVATE draft template without a version dependency', async () => {
    const result = await handler.execute(command);
    expect(template.getVisibility()).toBe(TemplateVisibility.PRIVATE);
    expect(result).toBeInstanceOf(TemplateListing);
    expect(result.getTemplateId()).toBe('template-1');
    expect(result.getCreatedBy()).toBe('creator-1');
    expect(result.getOfferType()).toBe(TemplateOfferType.FREE);
    expect(result.getStatus()).toBe(TemplateListingStatus.DRAFT);
    expect(result.getPublishedAt()).toBeNull();
    expect(listings.create).toHaveBeenCalledWith(result, context);
  });

  it('allows a workspace manager who is not the template creator', async () => {
    authorization.authorize.mockResolvedValue(true);
    const result = await handler.execute(
      new CreateTemplateListingCommand('template-1', 'manager-1'),
    );
    expect(result.getCreatedBy()).toBe('manager-1');
    expect(authorization.authorize).toHaveBeenCalledWith({
      userId: 'manager-1',
      permissions: [PERMISSIONS.WORKSPACE_UPDATE],
      target: { type: 'workspace', id: 'workspace-1' },
    });
  });

  it('passes the same transaction context to every repository operation and returns the persisted listing', async () => {
    const saved = TemplateListing.create({
      templateId: 'template-1',
      createdBy: 'creator-1',
    });
    listings.create.mockResolvedValue(saved);
    await expect(handler.execute(command)).resolves.toBe(saved);
    expect(unitOfWork.runInTransaction.mock.calls).toHaveLength(1);
    expect(pageTemplates.findById).toHaveBeenCalledWith('template-1', context);
    expect(listings.findByTemplateId).toHaveBeenCalledWith(
      'template-1',
      context,
    );
    expect(listings.create).toHaveBeenCalledWith(
      expect.any(TemplateListing),
      context,
    );
  });

  it('rejects a missing template before authorization or listing lookup', async () => {
    pageTemplates.findById.mockResolvedValue(null);
    await expect(handler.execute(command)).rejects.toBeInstanceOf(
      NotFoundException,
    );
    expect(authorization.authorize).not.toHaveBeenCalled();
    expect(listings.findByTemplateId).not.toHaveBeenCalled();
    expect(listings.create).not.toHaveBeenCalled();
  });

  it('rejects an archived template before authorization or listing lookup', async () => {
    template.archive();
    await expect(handler.execute(command)).rejects.toBeInstanceOf(
      BadRequestException,
    );
    expect(authorization.authorize).not.toHaveBeenCalled();
    expect(listings.findByTemplateId).not.toHaveBeenCalled();
    expect(listings.create).not.toHaveBeenCalled();
  });

  it('rejects a user without template management permission', async () => {
    await expect(
      handler.execute(
        new CreateTemplateListingCommand('template-1', 'reader-1'),
      ),
    ).rejects.toBeInstanceOf(ForbiddenException);
    expect(listings.findByTemplateId).not.toHaveBeenCalled();
    expect(listings.create).not.toHaveBeenCalled();
  });

  it('rejects an existing listing with a conflict', async () => {
    listings.findByTemplateId.mockResolvedValue(
      TemplateListing.create({
        templateId: 'template-1',
        createdBy: 'creator-1',
      }),
    );
    await expect(handler.execute(command)).rejects.toBeInstanceOf(
      ConflictException,
    );
    expect(listings.create).not.toHaveBeenCalled();
  });

  it('maps the listing template unique constraint race to a conflict', async () => {
    listings.create.mockRejectedValue({
      driverError: {
        code: '23505',
        constraint: 'UQ_template_listings_template_id',
      },
    });
    await expect(handler.execute(command)).rejects.toBeInstanceOf(
      ConflictException,
    );
  });

  it.each([
    new Error('Persistence failure'),
    { driverError: { code: '23505', constraint: 'another_constraint' } },
    {
      driverError: {
        code: '23503',
        constraint: 'UQ_template_listings_template_id',
      },
    },
  ])('propagates unrelated persistence errors unchanged: %p', async (error) => {
    listings.create.mockRejectedValue(error);
    await expect(handler.execute(command)).rejects.toBe(error);
  });
});
