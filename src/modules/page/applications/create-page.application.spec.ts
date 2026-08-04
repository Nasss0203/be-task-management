import { Test, TestingModule } from '@nestjs/testing';
import { CreatePageApplicationImpl } from './create-page.application';
import { PAGE_TYPES } from '../interfaces/types';
import { PageMapper } from '../mapper/page.mapper';

describe('CreatePageApplicationImpl', () => {
  let app: CreatePageApplicationImpl;

  const mockUow = {
    runInTransaction: jest.fn((cb) => cb()),
  };

  const mockService = {
    create: jest.fn(),
  };

  beforeEach(async () => {
    jest.clearAllMocks();
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        CreatePageApplicationImpl,
        { provide: PAGE_TYPES.uow.UnitOfWork, useValue: mockUow },
        {
          provide: PAGE_TYPES.services.CreatePageService,
          useValue: mockService,
        },
      ],
    }).compile();

    app = module.get<CreatePageApplicationImpl>(CreatePageApplicationImpl);
  });

  it('should be defined', () => {
    expect(app).toBeDefined();
  });

  it('should create page', async () => {
    mockService.create.mockResolvedValue({ id: 'page-1' });
    jest
      .spyOn(PageMapper, 'toResponse')
      .mockReturnValue({ id: 'page-1' } as any);

    const dto = { title: 'Test Page' } as any;
    const result = await app.create(dto);

    expect(mockService.create).toHaveBeenCalled();
    expect(result).toEqual({ id: 'page-1' });
  });
});
