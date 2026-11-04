import { Inject, Injectable, NotFoundException } from '@nestjs/common';
import {
  formFieldOf,
  PageBlockFormService,
} from 'src/modules/content/application/services/page-block-form.service';
import { CONTENT_TYPES } from 'src/modules/content/content.types';
import type { PageBlockRepository } from 'src/modules/content/domain/repositories/page-block.repository';
import { PageBlockType } from 'src/shared/domain/page-block-type.enum';
import { GetFormStructureQuery } from './get-form-structure.query';

@Injectable()
export class GetFormStructureHandler {
  constructor(
    @Inject(CONTENT_TYPES.repositories.PageBlockRepository)
    private readonly pageBlockRepo: PageBlockRepository,

    private readonly forms: PageBlockFormService,
  ) {}

  async execute(query: GetFormStructureQuery) {
    const section = await this.pageBlockRepo.findById(query.sectionBlockId);

    if (!section) {
      throw new NotFoundException('Form not found');
    }

    const { database } = await this.forms.formDatabase(section);
    const children = await this.pageBlockRepo.findActiveChildren(
      section.getId(),
    );
    const questionPropertyIds = new Set(
      children.flatMap((child) => {
        const field =
          child.getType() === PageBlockType.FORM_FIELD
            ? formFieldOf(child.getDataConfig())
            : null;
        return field ? [field.propertyId] : [];
      }),
    );

    return {
      id: database.getId(),
      properties: database
        .getProperties()
        .filter((property) => questionPropertyIds.has(property.getId()))
        .map((property) => ({
          id: property.getId(),
          name: property.getName(),
          type: property.getType(),
          position: property.getPosition(),
          options: property.getOptions().map((option) => ({
            id: option.getId(),
            name: option.getName(),
            color: option.getColor(),
            position: option.getPosition(),
          })),
        })),
    };
  }
}
