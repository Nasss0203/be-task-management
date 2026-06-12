import { Test, TestingModule } from '@nestjs/testing';
import { PageTemplatesController } from './page_templates.controller';
import { PAGE_TEMPLATE_TYPES } from '../interfaces/types';

describe('PageTemplatesController', () => {
  let controller: PageTemplatesController;

  const mockService = {
    findOne: jest.fn(),
  };

  beforeEach(async () => {
    jest.clearAllMocks();
    const module: TestingModule = await Test.createTestingModule({
      controllers: [PageTemplatesController],
      providers: [
        { provide: PAGE_TEMPLATE_TYPES.services.PageTemplatesService, useValue: mockService },
      ],
    }).compile();

    controller = module.get<PageTemplatesController>(PageTemplatesController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  it('should find one page template', async () => {
    mockService.findOne.mockResolvedValue({ id: 'pt-1' });
    const result = await controller.findOne('pt-1');
    expect(mockService.findOne).toHaveBeenCalledWith('pt-1');
    expect(result).toEqual({ id: 'pt-1' });
  });
});
