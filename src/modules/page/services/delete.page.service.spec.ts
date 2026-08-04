import { Test, TestingModule } from '@nestjs/testing';
import { DeletePageServiceImpl } from './delete.page.service';
import { PAGE_TYPES } from '../interfaces/types';
import { EntityManager } from 'typeorm';

describe('DeletePageServiceImpl', () => {
  let service: DeletePageServiceImpl;

  const mockRepo = {
    softDeletePage: jest.fn(),
    restorePage: jest.fn(),
  };

  beforeEach(async () => {
    jest.clearAllMocks();
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        DeletePageServiceImpl,
        {
          provide: PAGE_TYPES.repositories.DeletePageRepository,
          useValue: mockRepo,
        },
      ],
    }).compile();

    service = module.get<DeletePageServiceImpl>(DeletePageServiceImpl);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  it('should soft delete page', async () => {
    await service.softDeletePage({ pageId: 'page-1', deletedBy: 'u-1' });
    expect(mockRepo.softDeletePage).toHaveBeenCalledWith(
      { pageId: 'page-1', deletedBy: 'u-1' },
      undefined,
    );
  });

  it('should restore page', async () => {
    await service.restorePage({ pageId: 'page-1' });
    expect(mockRepo.restorePage).toHaveBeenCalledWith(
      { pageId: 'page-1' },
      undefined,
    );
  });
});
