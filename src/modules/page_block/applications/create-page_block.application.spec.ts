import { Test, TestingModule } from '@nestjs/testing';
import { CreatePageBlockApplicationImpl } from './create-page_block.application';
import { WORKSPACE_TYPES } from 'src/modules/workspaces/interfaces/types';
import { PAGE_BLOCK_TYPES } from '../interfaces/types';
import { PageBlockMapper } from '../mapper/page_block.mapper';

describe('CreatePageBlockApplicationImpl', () => {
  let app: CreatePageBlockApplicationImpl;

  const mockUow = {
    runInTransaction: jest.fn((cb) => cb()),
  };

  const mockService = {
    create: jest.fn(),
    addDatabaseViewToBlock: jest.fn(),
  };

  beforeEach(async () => {
    jest.clearAllMocks();
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        CreatePageBlockApplicationImpl,
        { provide: WORKSPACE_TYPES.uow.UnitOfWork, useValue: mockUow },
        { provide: PAGE_BLOCK_TYPES.services.CreatePageBlockService, useValue: mockService },
      ],
    }).compile();

    app = module.get<CreatePageBlockApplicationImpl>(CreatePageBlockApplicationImpl);
  });

  it('should be defined', () => {
    expect(app).toBeDefined();
  });

  it('should create page block', async () => {
    mockService.create.mockResolvedValue({ id: 'pb-1' });
    jest.spyOn(PageBlockMapper, 'toResponse').mockReturnValue({ id: 'pb-1' } as any);

    const dto = { title: 'Test Block' } as any;
    const result = await app.create(dto);

    expect(mockService.create).toHaveBeenCalled();
    expect(result).toEqual({ id: 'pb-1' });
  });

  it('should add database view to block', async () => {
    mockService.addDatabaseViewToBlock.mockResolvedValue({ id: 'pb-1' });
    jest.spyOn(PageBlockMapper, 'toResponse').mockReturnValue({ id: 'pb-1' } as any);

    const dto = { board_id: 'b-1' } as any;
    const result = await app.addDatabaseViewToBlock('pb-1', dto);

    expect(mockService.addDatabaseViewToBlock).toHaveBeenCalled();
    expect(result).toEqual({ id: 'pb-1' });
  });
});
