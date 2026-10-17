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
  /** FULL_VERSION for a separate demo version, LIMITED for an allowlisted one. */
  demoScope?: 'FULL_VERSION' | 'LIMITED';
  /** How much content a LIMITED demo left out, for "buy to see more" UI. */
  hiddenContent?: { blocks: number; rows: number };

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
