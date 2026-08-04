import { Test, TestingModule } from '@nestjs/testing';
import { FindPageApplicationImpl } from './find-page.application';
import { PAGE_TYPES } from '../interfaces/types';
import { PageMapper } from '../mapper/page.mapper';

describe('FindPageApplicationImpl', () => {
  let app: FindPageApplicationImpl;

  const mockService = {
    findDeletedPages: jest.fn(),
    findPageByWorkspaceId: jest.fn(),
  };

  beforeEach(async () => {
    jest.clearAllMocks();
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        FindPageApplicationImpl,
        { provide: PAGE_TYPES.services.FindPageService, useValue: mockService },
      ],
    }).compile();

    app = module.get<FindPageApplicationImpl>(FindPageApplicationImpl);
  });

  it('should be defined', () => {
    expect(app).toBeDefined();
  });

  it('should find deleted pages', async () => {
    mockService.findDeletedPages.mockResolvedValue([{ id: 'page-1' }]);
    jest
      .spyOn(PageMapper, 'toResponse')
      .mockReturnValue({ id: 'page-1' } as any);

    const result = await app.findDeletedPages('ws-1');
    expect(mockService.findDeletedPages).toHaveBeenCalledWith('ws-1');
    expect(result).toEqual([{ id: 'page-1' }]);
  });

  it('should find page by workspace id', async () => {
    mockService.findPageByWorkspaceId.mockResolvedValue({ id: 'page-1' });
    jest
      .spyOn(PageMapper, 'toResponse')
      .mockReturnValue({ id: 'page-1' } as any);

    const result = await app.findPageByWorkspaceId('ws-1');
    expect(mockService.findPageByWorkspaceId).toHaveBeenCalledWith('ws-1');
    expect(result).toEqual({ id: 'page-1' });
  });
});
