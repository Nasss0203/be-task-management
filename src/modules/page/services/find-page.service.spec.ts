import { Test, TestingModule } from '@nestjs/testing';
import { FindPageServiceImpl } from './find-page.service';
import { PAGE_TYPES } from '../interfaces/types';

describe('FindPageServiceImpl', () => {
  let service: FindPageServiceImpl;

  const mockRepo = {
    findDeletedPages: jest.fn(),
    findOnePageForRestore: jest.fn(),
    findPageByWorkspaceId: jest.fn(),
    findPageById: jest.fn(),
    findPagesByIds: jest.fn(),
  };

  beforeEach(async () => {
    jest.clearAllMocks();
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        FindPageServiceImpl,
        {
          provide: PAGE_TYPES.repositories.FindPageRepository,
          useValue: mockRepo,
        },
      ],
    }).compile();

    service = module.get<FindPageServiceImpl>(FindPageServiceImpl);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  it('should find deleted pages', async () => {
    mockRepo.findDeletedPages.mockResolvedValue([{ id: 'page-1' }]);
    const result = await service.findDeletedPages('ws-1');
    expect(mockRepo.findDeletedPages).toHaveBeenCalledWith('ws-1', undefined);
    expect(result).toEqual([{ id: 'page-1' }]);
  });

  it('should find one page for restore', async () => {
    mockRepo.findOnePageForRestore.mockResolvedValue({ id: 'page-1' });
    const result = await service.findOnePageForRestore('ws-1', 'page-1');
    expect(mockRepo.findOnePageForRestore).toHaveBeenCalledWith(
      'ws-1',
      'page-1',
      undefined,
    );
    expect(result).toEqual({ id: 'page-1' });
  });

  it('should find page by workspace id', async () => {
    mockRepo.findPageByWorkspaceId.mockResolvedValue([{ id: 'page-1' }]);
    const result = await service.findPageByWorkspaceId('ws-1');
    expect(mockRepo.findPageByWorkspaceId).toHaveBeenCalledWith(
      'ws-1',
      undefined,
    );
    expect(result).toEqual([{ id: 'page-1' }]);
  });

  it('should find page by id', async () => {
    mockRepo.findPageById.mockResolvedValue({ id: 'page-1' });
    const result = await service.findPageById('page-1');
    expect(mockRepo.findPageById).toHaveBeenCalledWith('page-1', undefined);
    expect(result).toEqual({ id: 'page-1' });
  });
});
