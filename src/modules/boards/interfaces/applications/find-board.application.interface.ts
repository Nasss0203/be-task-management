import { BoardResponseDto } from '../../dto/response/board.response.dto';

export interface FindBoardApplication {
  findById(id: string): Promise<BoardResponseDto>;
  findAllByProjectId(
    projectId: string,
    workspaceId: string,
  ): Promise<BoardResponseDto[]>;

  findDeletedBoards(
    workspaceId: string,
    projectId?: string,
  ): Promise<BoardResponseDto[]>;
}
