import { BoardViewType } from '../entities/board.entity';

export class BoardModel {
  constructor(
    public readonly id: string,
    public readonly workspaceId: string,
    public readonly projectId: string,
    public readonly name: string,
    public readonly viewType: BoardViewType,
    public readonly createdBy: string,
    public readonly updatedBy: string | null,
    public readonly createdAt: Date,
    public readonly updatedAt: Date,
  ) {}
}
