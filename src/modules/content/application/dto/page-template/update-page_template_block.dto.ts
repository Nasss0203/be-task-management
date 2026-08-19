import { PartialType } from '@nestjs/swagger';
import { CreatePageTemplateBlockDto } from './create-page_template_block.dto';

export class UpdatePageTemplateBlockDto extends PartialType(
  CreatePageTemplateBlockDto,
) {}
