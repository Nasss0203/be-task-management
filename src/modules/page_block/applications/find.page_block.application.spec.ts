import { Test, TestingModule } from '@nestjs/testing';
import { FindPageBlockApplicationImpl } from './find.page_block.application';
import { PAGE_BLOCK_TYPES } from '../interfaces/types';
import { PageBlockMapper } from '../mapper/page_block.mapper';

describe('FindPageBlockApplicationImpl', () => {
  let app: FindPageBlockApplicationImpl;

  const mockService = {
    findAllByPageId: jest.fn(),
    findDeletedPageBlocks: jest.fn(),
  };

  beforeEach(async () => {
    jest.clearAllMocks();
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        FindPageBlockApplicationImpl,
        { provide: PAGE_BLOCK_TYPES.services.FindPageBlockService, useValue: mockService },
      ],
    }).compile();

    app = module.get<FindPageBlockApplicationImpl>(FindPageBlockApplicationImpl);
  });

  it('should be defined', () => {
    expect(app).toBeDefined();
  });

  it('should find all by page id', async () => {
    mockService.findAllByPageId.mockResolvedValue([{ id: 'pb-1' }]);
    jest.spyOn(PageBlockMapper, 'toResponse').mockReturnValue({ id: 'pb-1' } as any);

    const result = await app.findAllByPageId('page-1');
    expect(mockService.findAllByPageId).toHaveBeenCalledWith('page-1');
    expect(result).toEqual([{ id: 'pb-1' }]);
  });

  it('should find deleted page blocks', async () => {
    mockService.findDeletedPageBlocks.mockResolvedValue([{ id: 'pb-1' }]);
    jest.spyOn(PageBlockMapper, 'toResponse').mockReturnValue({ id: 'pb-1' } as any);

    const result = await app.findDeletedPageBlocks('ws-1', 'page-1');
    expect(mockService.findDeletedPageBlocks).toHaveBeenCalledWith('ws-1', 'page-1');
    expect(result).toEqual([{ id: 'pb-1' }]);
  });
});
