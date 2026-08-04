import { Test, TestingModule } from '@nestjs/testing';
import { PageBlockController } from './page_block.controller';
import { PAGE_BLOCK_TYPES } from '../interfaces/types';

describe('PageBlockController', () => {
  let controller: PageBlockController;

  const mockApp = {
    findAllByPageId: jest.fn(),
    findDeletedPageBlocks: jest.fn(),
  };
  const mockCreateApp = { create: jest.fn() };
  const mockUpdateApp = { update: jest.fn(), reorder: jest.fn() };
  const mockDeleteApp = { delete: jest.fn(), restore: jest.fn() };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [PageBlockController],
      providers: [
        {
          provide: PAGE_BLOCK_TYPES.applications.FindPageBlockApplication,
          useValue: mockApp,
        },
        {
          provide: PAGE_BLOCK_TYPES.applications.CreatePageBlockApplication,
          useValue: mockCreateApp,
        },
        {
          provide: PAGE_BLOCK_TYPES.applications.UpdatePageBlockApplication,
          useValue: mockUpdateApp,
        },
        {
          provide: PAGE_BLOCK_TYPES.applications.DeletePageBlockApplication,
          useValue: mockDeleteApp,
        },
      ],
    }).compile();

    controller = module.get<PageBlockController>(PageBlockController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });
});
