import { Test, TestingModule } from '@nestjs/testing';
import { WorkspaceTemplatesServiceImpl } from './workspace_templates.service';
import { WORKSPACE_TEMPLATE_TYPES } from '../interfaces/types';
import { NotFoundException } from '@nestjs/common';

describe('WorkspaceTemplatesServiceImpl', () => {
  let service: WorkspaceTemplatesServiceImpl;

  const mockWorkspaceTemplateRepo = {
    findAll: jest.fn(),
    findOne: jest.fn(),
  };

  beforeEach(async () => {
    jest.clearAllMocks();

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        WorkspaceTemplatesServiceImpl,
        {
          provide: WORKSPACE_TEMPLATE_TYPES.repositories.WorkspaceTemplatesRepository,
          useValue: mockWorkspaceTemplateRepo,
        },
      ],
    }).compile();

    service = module.get<WorkspaceTemplatesServiceImpl>(WorkspaceTemplatesServiceImpl);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('findAll', () => {
    it('should return all templates', async () => {
      const mockTemplates = [{ id: '1' }, { id: '2' }];
      mockWorkspaceTemplateRepo.findAll.mockResolvedValue(mockTemplates);

      const result = await service.findAll();

      expect(mockWorkspaceTemplateRepo.findAll).toHaveBeenCalledWith(undefined);
      expect(result).toEqual(mockTemplates);
    });

    it('should pass conditions to repository', async () => {
      const mockTemplates = [{ id: '1' }];
      mockWorkspaceTemplateRepo.findAll.mockResolvedValue(mockTemplates);
      
      const condition = { status: 'PUBLISHED' } as any;
      const result = await service.findAll(condition);

      expect(mockWorkspaceTemplateRepo.findAll).toHaveBeenCalledWith(condition);
      expect(result).toEqual(mockTemplates);
    });
  });

  describe('findOne', () => {
    it('should throw NotFoundException if template not found', async () => {
      mockWorkspaceTemplateRepo.findOne.mockResolvedValue(null);

      await expect(service.findOne('1')).rejects.toThrow(NotFoundException);
      expect(mockWorkspaceTemplateRepo.findOne).toHaveBeenCalledWith('1');
    });

    it('should return template if found', async () => {
      const mockTemplate = { id: '1' };
      mockWorkspaceTemplateRepo.findOne.mockResolvedValue(mockTemplate);

      const result = await service.findOne('1');

      expect(mockWorkspaceTemplateRepo.findOne).toHaveBeenCalledWith('1');
      expect(result).toEqual(mockTemplate);
    });
  });
});
