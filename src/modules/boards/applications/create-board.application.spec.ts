import { Test, TestingModule } from '@nestjs/testing';
import { CreateBoardApplicationImpl } from './create-board.application';
import { BOARD_TYPES } from '../interfaces/types';
import { BoardMapper } from '../mapper/boards.mapper';

describe('CreateBoardApplicationImpl', () => {
  let app: CreateBoardApplicationImpl;

  const mockService = {
    create: jest.fn(),
  };

  beforeEach(async () => {
    jest.clearAllMocks();
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        CreateBoardApplicationImpl,
        {
          provide: BOARD_TYPES.services.CreateBoardService,
          useValue: mockService,
        },
      ],
    }).compile();

    app = module.get<CreateBoardApplicationImpl>(CreateBoardApplicationImpl);
  });

  it('should be defined', () => {
    expect(app).toBeDefined();
  });

  it('should create a board and map to response', async () => {
    const mockModel = { id: 'b-1', name: 'Board 1' };
    mockService.create.mockResolvedValue(mockModel);
    jest.spyOn(BoardMapper, 'toResponse').mockReturnValue(mockModel as any);

    const dto = {
      name: 'Board 1',
      workspaceId: 'ws-1',
      projectId: 'p-1',
      createdBy: 'u-1',
      viewType: 'list',
    } as any;
    const result = await app.create(dto);

    expect(mockService.create).toHaveBeenCalledWith(dto);
    expect(BoardMapper.toResponse).toHaveBeenCalledWith(mockModel);
    expect(result).toEqual(mockModel);
  });
});
