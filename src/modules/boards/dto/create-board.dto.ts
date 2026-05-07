import {
  IsEnum,
  IsNotEmpty,
  IsOptional,
  IsString,
  IsUUID,
} from 'class-validator';
import { BoardViewType } from '../domain/entities/board.entity';

export class CreateBoardDto {
  @IsUUID()
  @IsNotEmpty()
  workspaceId: string;

  @IsUUID()
  @IsNotEmpty()
  projectId: string;

  @IsString()
  @IsNotEmpty()
  name: string;

  @IsEnum(BoardViewType)
  viewType: BoardViewType;

  /** Set server-side from auth; not required on HTTP body. */
  @IsOptional()
  @IsUUID()
  createdBy?: string;
}
