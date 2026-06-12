import { Test, TestingModule } from '@nestjs/testing';
import { UpdatePageApplicationImpl } from './update-page.application';
import { PAGE_TYPES } from '../interfaces/types';
import { PageMapper } from '../mapper/page.mapper';

describe('UpdatePageApplicationImpl', () => {
  let app: UpdatePageApplicationImpl;

  const mockUow = {
    runInTransaction: jest.fn((cb) => cb()),
  };

  const mockService = {
    update: jest.fn(),
  };

  beforeEach(async () => {
    jest.clearAllMocks();
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        UpdatePageApplicationImpl,
        { provide: PAGE_TYPES.uow.UnitOfWork, useValue: mockUow },
        { provide: PAGE_TYPES.services.UpdatePageService, useValue: mockService },
      ],
    }).compile();

    app = module.get<UpdatePageApplicationImpl>(UpdatePageApplicationImpl);
  });

  it('should be defined', () => {
    expect(app).toBeDefined();
  });

  it('should update page', async () => {
    mockService.update.mockResolvedValue({ id: 'page-1' });
    jest.spyOn(PageMapper, 'toResponse').mockReturnValue({ id: 'page-1' } as any);

    const dto = { title: 'Test Page' } as any;
    const result = await app.update('page-1', dto);

    expect(mockService.update).toHaveBeenCalled();
    expect(result).toEqual({ id: 'page-1' });
  });
});
