import { Test, TestingModule } from '@nestjs/testing';
import { CreateBoardAndAttachToPageApplicationImpl } from './create-board-page.application';
import { BOARD_TYPES } from '../interfaces/types';
import { PAGE_BLOCK_TYPES } from 'src/modules/page_block/interfaces/types';
import { WORKSPACE_TYPES } from 'src/modules/workspaces/interfaces/types';
import { BoardMapper } from '../mapper/boards.mapper';

describe('CreateBoardAndAttachToPageApplicationImpl', () => {
  let app: CreateBoardAndAttachToPageApplicationImpl;

  const mockUow = {
    runInTransaction: jest.fn((cb) => cb()),
  };

  const mockCreateBoardService = {
    create: jest.fn(),
  };

  const mockCreatePageBlockService = {
    addDatabaseViewToBlock: jest.fn(),
  };

  beforeEach(async () => {
    jest.clearAllMocks();
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        CreateBoardAndAttachToPageApplicationImpl,
        { provide: WORKSPACE_TYPES.uow.UnitOfWork, useValue: mockUow },
        {
          provide: BOARD_TYPES.services.CreateBoardService,
          useValue: mockCreateBoardService,
        },
        {
          provide: PAGE_BLOCK_TYPES.services.CreatePageBlockService,
          useValue: mockCreatePageBlockService,
        },
      ],
    }).compile();

    app = module.get<CreateBoardAndAttachToPageApplicationImpl>(
      CreateBoardAndAttachToPageApplicationImpl,
    );
  });

  it('should be defined', () => {
    expect(app).toBeDefined();
  });

  it('should execute and attach to page', async () => {
    const mockBoard = { id: 'b-1' };
    mockCreateBoardService.create.mockResolvedValue(mockBoard);
    jest.spyOn(BoardMapper, 'toResponse').mockReturnValue(mockBoard as any);

    const dto = {
      workspaceId: 'ws-1',
      projectId: 'p-1',
      name: 'Board 1',
      viewType: 'list',
      createdBy: 'u-1',
      blockId: 'block-1',
    } as any;

    const result = await app.execute(dto);

    expect(mockCreateBoardService.create).toHaveBeenCalled();
    expect(
      mockCreatePageBlockService.addDatabaseViewToBlock,
    ).toHaveBeenCalled();
    expect(result).toEqual(mockBoard);
  });
});
