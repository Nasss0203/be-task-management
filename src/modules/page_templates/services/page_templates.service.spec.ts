import { Test, TestingModule } from '@nestjs/testing';
import { PageTemplatesServiceImpl } from './page_templates.service';
import { PAGE_TEMPLATE_TYPES } from '../interfaces/types';
import { NotFoundException } from '@nestjs/common';

describe('PageTemplatesServiceImpl', () => {
  let service: PageTemplatesServiceImpl;

  const mockRepo = {
    findOne: jest.fn(),
  };

  beforeEach(async () => {
    jest.clearAllMocks();
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        PageTemplatesServiceImpl,
        { provide: PAGE_TEMPLATE_TYPES.repositories.PageTemplatesRepository, useValue: mockRepo },
      ],
    }).compile();

    service = module.get<PageTemplatesServiceImpl>(PageTemplatesServiceImpl);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  it('should find one page template', async () => {
    mockRepo.findOne.mockResolvedValue({ id: 'pt-1' });
    const result = await service.findOne('pt-1');
    expect(mockRepo.findOne).toHaveBeenCalledWith('pt-1');
    expect(result).toEqual({ id: 'pt-1' });
  });

  it('should throw if page template not found', async () => {
    mockRepo.findOne.mockResolvedValue(null);
    await expect(service.findOne('pt-1')).rejects.toThrow(NotFoundException);
  });
});
