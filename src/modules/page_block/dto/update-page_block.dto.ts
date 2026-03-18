import { PartialType } from '@nestjs/swagger';
import { CreatePageBlockDto } from './create-page_block.dto';

export class UpdatePageBlockDto extends PartialType(CreatePageBlockDto) {}
