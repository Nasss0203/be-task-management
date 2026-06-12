import { Test, TestingModule } from '@nestjs/testing';
import { BoardsController } from './boards.controller';
import { BoardsService } from '../boards.service';
import { BOARD_TYPES } from '../interfaces/types';

describe('BoardsController', () => {
  let controller: BoardsController;

  const mockApp = { findById: jest.fn(), findAllByProjectId: jest.fn(), findDeletedBoards: jest.fn() };
  const mockCreateBoardApplication = { create: jest.fn() };
  const mockCreateBoardAndAttachToPageApplication = { execute: jest.fn() };
  const mockDeleteBoardApplication = { delete: jest.fn(), restore: jest.fn() };
  const mockFindBoardApplication = mockApp;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [BoardsController],
      providers: [
        { provide: BoardsService, useValue: {} },
        { provide: BOARD_TYPES.applications.FindBoardApplication, useValue: mockApp },
        { provide: BOARD_TYPES.applications.CreateBoardApplication, useValue: mockCreateBoardApplication },
        { provide: BOARD_TYPES.applications.CreateBoardAndAttachToPageApplication, useValue: mockCreateBoardAndAttachToPageApplication },
        { provide: BOARD_TYPES.applications.DeleteBoardApplication, useValue: mockDeleteBoardApplication },
      ],
    }).compile();

    controller = module.get<BoardsController>(BoardsController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });
});
