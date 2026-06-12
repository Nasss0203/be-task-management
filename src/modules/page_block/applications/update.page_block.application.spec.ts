import { Test, TestingModule } from '@nestjs/testing';
import { UpdatePageBlockApplicationImpl } from './update.page_block.application';
import { PAGE_BLOCK_TYPES } from '../interfaces/types';
import { WORKSPACE_TYPES } from 'src/modules/workspaces/interfaces/types';
import { HttpException } from '@nestjs/common';
import { PageBlockMapper } from '../mapper/page_block.mapper';

describe('UpdatePageBlockApplicationImpl', () => {
  let app: UpdatePageBlockApplicationImpl;

  const mockUow = {
    runInTransaction: jest.fn((cb) => cb()),
  };

  const mockService = {
    update: jest.fn(),
    reorder: jest.fn(),
  };

  beforeEach(async () => {
    jest.clearAllMocks();
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        UpdatePageBlockApplicationImpl,
        { provide: PAGE_BLOCK_TYPES.services.UpdatePageBlockService, useValue: mockService },
        { provide: WORKSPACE_TYPES.uow.UnitOfWork, useValue: mockUow },
      ],
    }).compile();

    app = module.get<UpdatePageBlockApplicationImpl>(UpdatePageBlockApplicationImpl);
  });

  it('should be defined', () => {
    expect(app).toBeDefined();
  });

  it('should update page block', async () => {
    mockService.update.mockResolvedValue({ id: 'pb-1' });
    jest.spyOn(PageBlockMapper, 'toResponse').mockReturnValue({ id: 'pb-1' } as any);

    const dto = { id: 'pb-1', title: 'Test Block' } as any;
    const result = await app.update(dto);

    expect(mockService.update).toHaveBeenCalled();
    expect(result).toEqual({ id: 'pb-1' });
  });

  it('should throw if update id missing', async () => {
    const dto = { title: 'Test Block' } as any;
    await expect(app.update(dto)).rejects.toThrow(HttpException);
  });

  it('should reorder page block', async () => {
    mockService.reorder.mockResolvedValue([{ id: 'pb-1' }]);
    jest.spyOn(PageBlockMapper, 'toResponse').mockReturnValue({ id: 'pb-1' } as any);

    const dto = { page_id: 'page-1', blocks: [] } as any;
    const result = await app.reorder(dto);

    expect(mockService.reorder).toHaveBeenCalled();
    expect(result).toEqual([{ id: 'pb-1' }]);
  });

  it('should throw if reorder page_id missing', async () => {
    const dto = { blocks: [] } as any;
    await expect(app.reorder(dto)).rejects.toThrow(HttpException);
  });
});
