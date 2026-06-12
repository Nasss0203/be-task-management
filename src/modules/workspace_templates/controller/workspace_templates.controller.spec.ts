import { Test, TestingModule } from '@nestjs/testing';
import { WorkspaceTemplatesController } from './workspace_templates.controller';
import { WORKSPACE_TEMPLATE_TYPES } from '../interfaces/types';
import { TemplateStatus, TemplateVisibility } from 'src/common/enum/template.enum';

describe('WorkspaceTemplatesController', () => {
  let controller: WorkspaceTemplatesController;

  const mockWorkspaceTemplatesService = {
    findAll: jest.fn(),
    findOne: jest.fn(),
  };

  beforeEach(async () => {
    jest.clearAllMocks();

    const module: TestingModule = await Test.createTestingModule({
      controllers: [WorkspaceTemplatesController],
      providers: [
        {
          provide: WORKSPACE_TEMPLATE_TYPES.services.WorkspaceTemplatesService,
          useValue: mockWorkspaceTemplatesService,
        },
      ],
    }).compile();

    controller = module.get<WorkspaceTemplatesController>(WorkspaceTemplatesController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  describe('findAll', () => {
    it('should call findAll with PUBLISHED and PUBLIC conditions', async () => {
      const mockTemplates = [{ id: '1' }];
      mockWorkspaceTemplatesService.findAll.mockResolvedValue(mockTemplates);

      const result = await controller.findAll();

      expect(mockWorkspaceTemplatesService.findAll).toHaveBeenCalledWith({
        status: TemplateStatus.PUBLISHED,
        visibility: TemplateVisibility.PUBLIC,
      });
      expect(result).toEqual(mockTemplates);
    });
  });

  describe('findOne', () => {
    it('should call findOne with correct id', async () => {
      const mockTemplate = { id: '1' };
      mockWorkspaceTemplatesService.findOne.mockResolvedValue(mockTemplate);

      const result = await controller.findOne('1');

      expect(mockWorkspaceTemplatesService.findOne).toHaveBeenCalledWith('1');
      expect(result).toEqual(mockTemplate);
    });
  });
});
