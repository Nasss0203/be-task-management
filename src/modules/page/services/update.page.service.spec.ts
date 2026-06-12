import { Test, TestingModule } from '@nestjs/testing';
import { UpdatePageServiceImpl } from './update.page.service';
import { PAGE_TYPES } from '../interfaces/types';
import { EntityManager } from 'typeorm';

describe('UpdatePageServiceImpl', () => {
  let service: UpdatePageServiceImpl;

  const mockRepo = {
    save: jest.fn(),
  };

  const mockFindRepo = {
    findPageById: jest.fn(),
  };

  beforeEach(async () => {
    jest.clearAllMocks();
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        UpdatePageServiceImpl,
        { provide: PAGE_TYPES.repositories.UpdatePageRepository, useValue: mockRepo },
        { provide: PAGE_TYPES.repositories.FindPageRepository, useValue: mockFindRepo },
      ],
    }).compile();

    service = module.get<UpdatePageServiceImpl>(UpdatePageServiceImpl);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  it('should update page', async () => {
    mockFindRepo.findPageById.mockResolvedValue({ id: 'page-1' });
    mockRepo.save.mockResolvedValue({ id: 'page-1' });
    const dto = { title: 'Test Page' } as any;
    
    const result = await service.update('page-1', dto, {} as EntityManager);
    
    expect(mockRepo.save).toHaveBeenCalledWith({ id: 'page-1', title: 'Test Page' }, {});
    expect(result).toEqual({ id: 'page-1' });
  });
});
