import { Test, TestingModule } from '@nestjs/testing';
import { PageTemplateBlocksController } from './page_template_blocks.controller';
import { PAGE_TEMPLATE_BLOCK_TYPES } from '../interfaces/types';

describe('PageTemplateBlocksController', () => {
  let controller: PageTemplateBlocksController;

  const mockService = {
    findByTemplateId: jest.fn(),
  };

  beforeEach(async () => {
    jest.clearAllMocks();
    const module: TestingModule = await Test.createTestingModule({
      controllers: [PageTemplateBlocksController],
      providers: [
        { provide: PAGE_TEMPLATE_BLOCK_TYPES.services.PageTemplateBlocksService, useValue: mockService },
      ],
    }).compile();

    controller = module.get<PageTemplateBlocksController>(PageTemplateBlocksController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  it('should find by template id', async () => {
    mockService.findByTemplateId.mockResolvedValue([{ id: 'ptb-1' }]);
    const result = await controller.findByTemplateId('pt-1');
    expect(mockService.findByTemplateId).toHaveBeenCalledWith('pt-1');
    expect(result).toEqual([{ id: 'ptb-1' }]);
  });
});
