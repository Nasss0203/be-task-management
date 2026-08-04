import { Test, TestingModule } from '@nestjs/testing';
import { FindPageBlockServiceImpl } from './find.page_block.service';
import { PAGE_BLOCK_TYPES } from '../interfaces/types';

describe('FindPageBlockServiceImpl', () => {
  let service: FindPageBlockServiceImpl;

  const mockRepo = {
    findAllById: jest.fn(),
    findAllByPageId: jest.fn(),
    getNextOrderIndex: jest.fn(),
    findDeletedPageBlocks: jest.fn(),
    findOnePageBlockForRestore: jest.fn(),
  };

  beforeEach(async () => {
    jest.clearAllMocks();
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        FindPageBlockServiceImpl,
        {
          provide: PAGE_BLOCK_TYPES.repositories.FindPageBlockRepository,
          useValue: mockRepo,
        },
      ],
    }).compile();

    service = module.get<FindPageBlockServiceImpl>(FindPageBlockServiceImpl);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  it('should find all by id', async () => {
    mockRepo.findAllById.mockResolvedValue({ id: 'pb-1' });
    const result = await service.findAllById('pb-1');
    expect(mockRepo.findAllById).toHaveBeenCalledWith('pb-1', undefined);
    expect(result).toEqual({ id: 'pb-1' });
  });

  it('should find all by page id', async () => {
    mockRepo.findAllByPageId.mockResolvedValue([{ id: 'pb-1' }]);
    const result = await service.findAllByPageId('page-1');
    expect(mockRepo.findAllByPageId).toHaveBeenCalledWith('page-1', undefined);
    expect(result).toEqual([{ id: 'pb-1' }]);
  });

  it('should get next order index', async () => {
    mockRepo.getNextOrderIndex.mockResolvedValue(1);
    const result = await service.getNextOrderIndex('page-1');
    expect(mockRepo.getNextOrderIndex).toHaveBeenCalledWith(
      'page-1',
      undefined,
    );
    expect(result).toEqual(1);
  });

  it('should find deleted page blocks', async () => {
    mockRepo.findDeletedPageBlocks.mockResolvedValue([{ id: 'pb-1' }]);
    const result = await service.findDeletedPageBlocks('ws-1', 'page-1');
    expect(mockRepo.findDeletedPageBlocks).toHaveBeenCalledWith(
      'ws-1',
      'page-1',
    );
    expect(result).toEqual([{ id: 'pb-1' }]);
  });

  it('should find one page block for restore', async () => {
    mockRepo.findOnePageBlockForRestore.mockResolvedValue({ id: 'pb-1' });
    const result = await service.findOnePageBlockForRestore('ws-1', 'pb-1');
    expect(mockRepo.findOnePageBlockForRestore).toHaveBeenCalledWith(
      'ws-1',
      'pb-1',
    );
    expect(result).toEqual({ id: 'pb-1' });
  });
});
