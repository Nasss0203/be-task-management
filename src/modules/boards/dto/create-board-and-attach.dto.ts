import { IsNotEmpty, IsUUID } from 'class-validator';
import { CreateBoardDto } from './create-board.dto';

export class CreateBoardAndAttachDto extends CreateBoardDto {
  @IsUUID()
  @IsNotEmpty()
  blockId: string;
}
