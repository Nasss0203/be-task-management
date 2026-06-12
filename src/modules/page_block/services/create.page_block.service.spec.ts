import { Test, TestingModule } from '@nestjs/testing';
import { CreatePageBlockServiceImpl } from './create.page_block.service';
import { PAGE_BLOCK_TYPES } from '../interfaces/types';
import { EntityManager } from 'typeorm';
import { NotFoundException, BadRequestException } from '@nestjs/common';
import { PageBlockType } from '../domain/entities/page_block.entity';

describe('CreatePageBlockServiceImpl', () => {
  let service: CreatePageBlockServiceImpl;

  const mockRepo = {
    save: jest.fn(),
    shiftOrderIndexesForInsert: jest.fn(),
  };

  const mockFindRepo = {
    findAllById: jest.fn(),
    getNextOrderIndex: jest.fn(),
  };

  const mockUpdateRepo = {
    save: jest.fn(),
  };

  beforeEach(async () => {
    jest.clearAllMocks();
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        CreatePageBlockServiceImpl,
        { provide: PAGE_BLOCK_TYPES.repositories.CreatePageBlockRepository, useValue: mockRepo },
        { provide: PAGE_BLOCK_TYPES.repositories.FindPageBlockRepository, useValue: mockFindRepo },
        { provide: PAGE_BLOCK_TYPES.repositories.UpdatePageBlockRepository, useValue: mockUpdateRepo },
      ],
    }).compile();

    service = module.get<CreatePageBlockServiceImpl>(CreatePageBlockServiceImpl);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  it('should create page block without insert_after_block_id', async () => {
    mockFindRepo.getNextOrderIndex.mockResolvedValue(0);
    mockRepo.save.mockResolvedValue({ id: 'pb-1' });

    const dto = { page_id: 'page-1', title: 'Test Block', type: PageBlockType.TEXT } as any;
    const result = await service.create(dto, {} as EntityManager);

    expect(mockRepo.save).toHaveBeenCalledWith({ ...dto, order_index: 0 }, {});
    expect(result).toEqual({ id: 'pb-1' });
  });

  it('should add database view to block', async () => {
    mockFindRepo.findAllById.mockResolvedValue({ id: 'pb-1', type: PageBlockType.DATABASE_VIEW, data_config: null });
    mockUpdateRepo.save.mockResolvedValue({ id: 'pb-1' });

    const dto = { project_id: 'p-1', workspace_id: 'ws-1', board_id: 'b-1', view_type: 'list' } as any;
    const result = await service.addDatabaseViewToBlock('pb-1', dto, {} as EntityManager);

    expect(mockUpdateRepo.save).toHaveBeenCalledWith({
      id: 'pb-1',
      data_config: { project_id: 'p-1', workspace_id: 'ws-1', default_board_id: 'b-1', default_view_type: 'list' }
    }, {});
    expect(result).toEqual({ id: 'pb-1' });
  });
});
