import { BoardViewType } from '../domain/entities/board.entity';

export class CreateBoardDto {
  workspaceId: string;
  projectId: string;
  name: string;
  viewType: BoardViewType;
  createdBy: string;
}
