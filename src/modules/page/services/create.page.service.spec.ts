import { Test, TestingModule } from '@nestjs/testing';
import { CreatePageServiceImpl } from './create.page.service';
import { PAGE_TYPES } from '../interfaces/types';
import { PAGE_BLOCK_TYPES } from 'src/modules/page_block/interfaces/types';
import { EntityManager } from 'typeorm';

describe('CreatePageServiceImpl', () => {
  let service: CreatePageServiceImpl;

  const mockRepo = {
    save: jest.fn(),
  };

  const mockCreatePageBlockService = {
    create: jest.fn(),
  };

  beforeEach(async () => {
    jest.clearAllMocks();
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        CreatePageServiceImpl,
        { provide: PAGE_TYPES.repositories.PageRepository, useValue: mockRepo },
        { provide: PAGE_BLOCK_TYPES.services.CreatePageBlockService, useValue: mockCreatePageBlockService },
      ],
    }).compile();

    service = module.get<CreatePageServiceImpl>(CreatePageServiceImpl);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  it('should create page', async () => {
    mockRepo.save.mockResolvedValue({ id: 'page-1' });
    const dto = { title: 'Test Page', workspaceId: 'ws-1' } as any;
    
    const result = await service.create(dto, {} as EntityManager);
    
    expect(mockRepo.save).toHaveBeenCalledWith(dto, {});
    expect(result).toEqual({ id: 'page-1' });
  });
});
