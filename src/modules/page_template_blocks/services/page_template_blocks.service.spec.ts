import { Test, TestingModule } from '@nestjs/testing';
import { PageTemplateBlocksServiceImpl } from './page_template_blocks.service';
import { PAGE_TEMPLATE_BLOCK_TYPES } from '../interfaces/types';

describe('PageTemplateBlocksServiceImpl', () => {
  let service: PageTemplateBlocksServiceImpl;

  const mockRepo = {
    findByTemplateId: jest.fn(),
  };

  beforeEach(async () => {
    jest.clearAllMocks();
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        PageTemplateBlocksServiceImpl,
        {
          provide:
            PAGE_TEMPLATE_BLOCK_TYPES.repositories.PageTemplateBlocksRepository,
          useValue: mockRepo,
        },
      ],
    }).compile();

    service = module.get<PageTemplateBlocksServiceImpl>(
      PageTemplateBlocksServiceImpl,
    );
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  it('should find by template id', async () => {
    mockRepo.findByTemplateId.mockResolvedValue([{ id: 'ptb-1' }]);
    const result = await service.findByTemplateId('pt-1');
    expect(mockRepo.findByTemplateId).toHaveBeenCalledWith('pt-1');
    expect(result).toEqual([{ id: 'ptb-1' }]);
  });
});
