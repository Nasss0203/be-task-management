import { Test, TestingModule } from '@nestjs/testing';
import { UpdatePageBlockServiceImpl } from './update.page_block.service';
import { PAGE_BLOCK_TYPES } from '../interfaces/types';
import { EntityManager } from 'typeorm';

describe('UpdatePageBlockServiceImpl', () => {
  let service: UpdatePageBlockServiceImpl;

  const mockRepo = {
    save: jest.fn(),
    reorder: jest.fn(),
  };

  beforeEach(async () => {
    jest.clearAllMocks();
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        UpdatePageBlockServiceImpl,
        {
          provide: PAGE_BLOCK_TYPES.repositories.UpdatePageBlockRepository,
          useValue: mockRepo,
        },
      ],
    }).compile();

    service = module.get<UpdatePageBlockServiceImpl>(
      UpdatePageBlockServiceImpl,
    );
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  it('should update page block', async () => {
    mockRepo.save.mockResolvedValue({ id: 'pb-1' });
    const dto = { id: 'pb-1', title: 'Test Block' } as any;

    const result = await service.update(dto, {} as EntityManager);

    expect(mockRepo.save).toHaveBeenCalledWith(
      { id: 'pb-1', title: 'Test Block' },
      {},
    );
    expect(result).toEqual({ id: 'pb-1' });
  });

  it('should reorder page block', async () => {
    mockRepo.reorder.mockResolvedValue([{ id: 'pb-1' }]);
    const dto = { page_id: 'page-1', items: [] } as any;

    const result = await service.reorder(dto, {} as EntityManager);

    expect(mockRepo.reorder).toHaveBeenCalledWith('page-1', [], {});
    expect(result).toEqual([{ id: 'pb-1' }]);
  });
});
