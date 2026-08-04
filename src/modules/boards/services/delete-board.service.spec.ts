import { Test, TestingModule } from '@nestjs/testing';
import { DeleteBoardServiceImpl } from './delete-board.service';
import { BOARD_TYPES } from '../interfaces/types';

describe('DeleteBoardServiceImpl', () => {
  let service: DeleteBoardServiceImpl;

  const mockRepo = {
    softDeleteBoard: jest.fn(),
    restoreBoard: jest.fn(),
  };

  beforeEach(async () => {
    jest.clearAllMocks();
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        DeleteBoardServiceImpl,
        {
          provide: BOARD_TYPES.repositories.DeleteBoardRepository,
          useValue: mockRepo,
        },
      ],
    }).compile();

    service = module.get<DeleteBoardServiceImpl>(DeleteBoardServiceImpl);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  it('should soft delete board', async () => {
    await service.softDeleteBoard({ boardId: 'b-1', deletedBy: 'u-1' });
    expect(mockRepo.softDeleteBoard).toHaveBeenCalledWith(
      { boardId: 'b-1', deletedBy: 'u-1' },
      undefined,
    );
  });

  it('should restore board', async () => {
    await service.restoreBoard({ boardId: 'b-1' });
    expect(mockRepo.restoreBoard).toHaveBeenCalledWith(
      { boardId: 'b-1' },
      undefined,
    );
  });
});
