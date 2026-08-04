import { Test, TestingModule } from '@nestjs/testing';
import { DeletePageBlockServiceImpl } from './delete.page-block.service';
import { PAGE_BLOCK_TYPES } from '../interfaces/types';

describe('DeletePageBlockServiceImpl', () => {
  let service: DeletePageBlockServiceImpl;

  const mockRepo = {
    softDeletePageBlock: jest.fn(),
    restorePageBlock: jest.fn(),
  };

  beforeEach(async () => {
    jest.clearAllMocks();
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        DeletePageBlockServiceImpl,
        {
          provide: PAGE_BLOCK_TYPES.repositories.DeletePageBlockRepository,
          useValue: mockRepo,
        },
      ],
    }).compile();

    service = module.get<DeletePageBlockServiceImpl>(
      DeletePageBlockServiceImpl,
    );
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  it('should soft delete page block', async () => {
    await service.softDeletePageBlock({ blockId: 'pb-1', deletedBy: 'u-1' });
    expect(mockRepo.softDeletePageBlock).toHaveBeenCalledWith(
      { blockId: 'pb-1', deletedBy: 'u-1' },
      undefined,
    );
  });

  it('should restore page block', async () => {
    await service.restorePageBlock({ blockId: 'pb-1' });
    expect(mockRepo.restorePageBlock).toHaveBeenCalledWith(
      { blockId: 'pb-1' },
      undefined,
    );
  });
});
