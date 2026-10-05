import { PageTemplateResponseDto } from '../page-template/page-template.response.dto';
import { PageTemplateBlockResponseDto } from '../template-block/page-template-block.response.dto';
import { TemplateVersionResponseDto } from '../template-version/template-version.response.dto';
import { PageTemplateDatabaseResponseDto } from './page-template-database.response.dto';

export class TemplatePreviewResponseDto {
  template: PageTemplateResponseDto;
  version: TemplateVersionResponseDto;
  blocks: PageTemplateBlockResponseDto[];
  databases: PageTemplateDatabaseResponseDto[];

  constructor(input: {
    template: PageTemplateResponseDto;
    version: TemplateVersionResponseDto;
    blocks: PageTemplateBlockResponseDto[];
    databases: PageTemplateDatabaseResponseDto[];
  }) {
    this.template = input.template;
    this.version = input.version;
    this.blocks = input.blocks;
    this.databases = input.databases;
  }
}
