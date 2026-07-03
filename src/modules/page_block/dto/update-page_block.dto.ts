import { PartialType } from '@nestjs/swagger';
import { CreatePageBlockDto } from './create-page_block.dto';
import { IsOptional, IsUUID } from 'class-validator';

export class UpdatePageBlockDto extends PartialType(CreatePageBlockDto) {
  @IsOptional()
  @IsUUID()
  id?: string;
}
