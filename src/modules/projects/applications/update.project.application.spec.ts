import { Test, TestingModule } from '@nestjs/testing';
import { UpdateProjectApplicationImpl } from './update.project.application';
import { PROJECT_TYPES } from '../interfaces/types';

describe('UpdateProjectApplicationImpl', () => {
  let application: UpdateProjectApplicationImpl;

  const mockUpdateProjectService = {
    execute: jest.fn(),
  };

  beforeEach(async () => {
    jest.clearAllMocks();

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        UpdateProjectApplicationImpl,
        {
          provide: PROJECT_TYPES.services.UpdateProjectService,
          useValue: mockUpdateProjectService,
        },
      ],
    }).compile();

    application = module.get<UpdateProjectApplicationImpl>(
      UpdateProjectApplicationImpl,
    );
  });

  it('should be defined', () => {
    expect(application).toBeDefined();
  });

  describe('execute', () => {
    it('should call execute on service', async () => {
      const mockProject = { id: '1', name: 'Updated' } as any;
      const dto = { name: 'Updated' } as any;
      mockUpdateProjectService.execute.mockResolvedValue(mockProject);

      const result = await application.execute('1', 'workspace-1', dto);

      expect(mockUpdateProjectService.execute).toHaveBeenCalledWith(
        '1',
        'workspace-1',
        dto,
      );
      expect(result).toEqual(mockProject);
    });
  });
});
