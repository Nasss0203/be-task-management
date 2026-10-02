import { PageTemplateResponseDto } from '../page-template/page-template.response.dto';
import { PageTemplateBlockResponseDto } from '../template-block/page-template-block.response.dto';
import { TemplateVersionResponseDto } from '../template-version/template-version.response.dto';

export class TemplatePreviewResponseDto {
  template: PageTemplateResponseDto;
  version: TemplateVersionResponseDto;
  blocks: PageTemplateBlockResponseDto[];

  constructor(input: {
    template: PageTemplateResponseDto;
    version: TemplateVersionResponseDto;
    blocks: PageTemplateBlockResponseDto[];
  }) {
    this.template = input.template;
    this.version = input.version;
    this.blocks = input.blocks;
  }
}
