import { Test, TestingModule } from '@nestjs/testing';
import { PageController } from './page.controller';
import { PageService } from '../page.service';
import { PAGE_TYPES } from '../interfaces/types';

describe('PageController', () => {
  let controller: PageController;

  const mockApp = {
    findPageByWorkspaceId: jest.fn(),
    findDeletedPages: jest.fn(),
  };
  const mockCreatePageApplication = { create: jest.fn() };
  const mockUpdatePageApplication = { update: jest.fn() };
  const mockDeletePageApplication = { delete: jest.fn(), restore: jest.fn() };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [PageController],
      providers: [
        { provide: PageService, useValue: {} },
        {
          provide: PAGE_TYPES.applications.FindPageApplication,
          useValue: mockApp,
        },
        {
          provide: PAGE_TYPES.applications.CreatePageApplication,
          useValue: mockCreatePageApplication,
        },
        {
          provide: PAGE_TYPES.applications.UpdatePageApplication,
          useValue: mockUpdatePageApplication,
        },
        {
          provide: PAGE_TYPES.applications.DeletePageApplication,
          useValue: mockDeletePageApplication,
        },
      ],
    }).compile();

    controller = module.get<PageController>(PageController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });
});
