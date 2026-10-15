import { PageTemplateResponseDto } from '../page-template/page-template.response.dto';
import { PageTemplateBlockResponseDto } from '../template-block/page-template-block.response.dto';
import { TemplateVersionResponseDto } from '../template-version/template-version.response.dto';
import { PageTemplateDatabaseResponseDto } from './page-template-database.response.dto';

export class TemplatePreviewResponseDto {
  template: PageTemplateResponseDto;
  version: TemplateVersionResponseDto;
  blocks: PageTemplateBlockResponseDto[];
  databases: PageTemplateDatabaseResponseDto[];
  isDemo?: boolean;
  interactive?: boolean;
  demoConfig?: Record<string, any> | null;

  constructor(input: {
    template: PageTemplateResponseDto;
    version: TemplateVersionResponseDto;
    blocks: PageTemplateBlockResponseDto[];
    databases: PageTemplateDatabaseResponseDto[];
    isDemo?: boolean;
    interactive?: boolean;
    demoConfig?: Record<string, any> | null;
  }) {
    this.template = input.template;
    this.version = input.version;
    this.blocks = input.blocks;
    this.databases = input.databases;
    this.isDemo = input.isDemo;
    this.interactive = input.interactive;
    this.demoConfig = input.demoConfig;
  }
}
