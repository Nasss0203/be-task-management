import { PartialType } from '@nestjs/swagger';
import { CreatePageTemplateDto } from './create-page_template.dto';

export class UpdatePageTemplateDto extends PartialType(CreatePageTemplateDto) {}
