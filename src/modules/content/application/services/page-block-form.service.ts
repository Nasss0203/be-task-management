import { BadRequestException, Inject, Injectable } from '@nestjs/common';
import { CONTENT_TYPES } from 'src/modules/content/content.types';
import type { PageBlock } from 'src/modules/content/domain/entities/page-block.entity';
import type { PageBlockRepository } from 'src/modules/content/domain/repositories/page-block.repository';
import { DATABASE_TYPES } from 'src/modules/database/database.types';
import type { Database } from 'src/modules/database/domain/aggregates/database/database.aggregate';
import { PropertyType } from 'src/modules/database/domain/enums/property-type.enum';
import type { DatabaseRepository } from 'src/modules/database/domain/repositories/database.repository';
import type { PageBlockJson } from 'src/shared/domain/page-block.types';
import { PageBlockType } from 'src/shared/domain/page-block-type.enum';
import type { PersistenceContext } from 'src/shared/infrastructure/persistence/persistence-context';

export const FORM_FIELD_PROPERTY_TYPES = new Set<PropertyType>([
  PropertyType.TITLE,
  PropertyType.TEXT,
  PropertyType.NUMBER,
  PropertyType.SELECT,
  PropertyType.MULTI_SELECT,
  PropertyType.STATUS,
  PropertyType.DATE,
  PropertyType.CHECKBOX,
  PropertyType.URL,
  PropertyType.EMAIL,
  PropertyType.PHONE,
]);

const MAX_LABEL_LENGTH = 200;
const MAX_MESSAGE_LENGTH = 500;

export interface SectionFormConfig {
  databaseId: string;
  submitLabel: string | null;
  successMessage: string | null;
}

export interface FormFieldConfig {
  propertyId: string;
  required: boolean;
}

function record(json: unknown): Record<string, unknown> {
  return json && typeof json === 'object' && !Array.isArray(json)
    ? (json as Record<string, unknown>)
    : {};
}

function optionalText(
  value: unknown,
  name: string,
  maxLength: number,
): string | null {
  if (value === undefined || value === null || value === '') return null;
  if (typeof value !== 'string' || value.length > maxLength) {
    throw new BadRequestException(
      `${name} must be text of at most ${maxLength} characters`,
    );
  }
  return value;
}

export function sectionFormOf(
  dataConfig: PageBlockJson | undefined,
): SectionFormConfig | null {
  const form = record(dataConfig).form;
  if (!form || typeof form !== 'object' || Array.isArray(form)) return null;

  const config = form as Record<string, unknown>;
  if (typeof config.database_id !== 'string') return null;

  return {
    databaseId: config.database_id,
    submitLabel:
      typeof config.submit_label === 'string' ? config.submit_label : null,
    successMessage:
      typeof config.success_message === 'string'
        ? config.success_message
        : null,
  };
}

export function formFieldOf(
  dataConfig: PageBlockJson | undefined,
): FormFieldConfig | null {
  const config = record(dataConfig);
  if (typeof config.property_id !== 'string') return null;
  return { propertyId: config.property_id, required: config.required === true };
}

@Injectable()
export class PageBlockFormService {
  constructor(
    @Inject(CONTENT_TYPES.repositories.PageBlockRepository)
    private readonly pageBlockRepo: PageBlockRepository,

    @Inject(DATABASE_TYPES.repositories.DatabaseRepository)
    private readonly databaseRepository: DatabaseRepository,
  ) {}

  async formDatabase(
    section: PageBlock,
    context?: PersistenceContext,
  ): Promise<{ form: SectionFormConfig; database: Database }> {
    const form =
      section.getType() === PageBlockType.SECTION
        ? sectionFormOf(section.getDataConfig())
        : null;

    if (!form) {
      throw new BadRequestException('This section is not a form');
    }

    return {
      form,
      database: await this.databaseOnPage(
        form.databaseId,
        section.getPageId(),
        context,
      ),
    };
  }

  private async databaseOnPage(
    databaseId: string,
    pageId: string,
    context?: PersistenceContext,
  ): Promise<Database> {
    const database = await this.databaseRepository.findById(
      databaseId,
      context,
    );

    if (!database || database.getPageId() !== pageId) {
      throw new BadRequestException(
        'A form can only fill a database on its own page',
      );
    }

    return database;
  }

  async assertValidSectionForm(
    section: {
      pageId: string;
      sectionId: string | null;
      current: PageBlockJson;
      next: PageBlockJson | undefined;
    },
    context?: PersistenceContext,
  ): Promise<void> {
    if (section.next === undefined) return;

    const current = sectionFormOf(section.current);
    const next = sectionFormOf(section.next);
    const formConfig = record(record(section.next).form);

    if (next) {
      optionalText(formConfig.submit_label, 'submit_label', MAX_LABEL_LENGTH);
      optionalText(
        formConfig.success_message,
        'success_message',
        MAX_MESSAGE_LENGTH,
      );
      await this.databaseOnPage(next.databaseId, section.pageId, context);
    } else if (Object.keys(formConfig).length > 0) {
      throw new BadRequestException('form.database_id is required');
    }

    if (!section.sectionId || current?.databaseId === next?.databaseId) return;

    const children = await this.pageBlockRepo.findActiveChildren(
      section.sectionId,
      context,
    );

    if (
      children.some((child) => child.getType() === PageBlockType.FORM_FIELD)
    ) {
      throw new BadRequestException(
        'Remove the questions before changing the form database',
      );
    }
  }

  async assertValidFormField(
    parent: PageBlock,
    dataConfig: PageBlockJson | undefined,
    context?: PersistenceContext,
  ): Promise<void> {
    const field = formFieldOf(dataConfig);

    if (!field) {
      throw new BadRequestException('A question needs data_config.property_id');
    }

    const { database } = await this.formDatabase(parent, context);
    const property = database
      .getProperties()
      .find((item) => item.getId() === field.propertyId);

    if (!property || !FORM_FIELD_PROPERTY_TYPES.has(property.getType())) {
      throw new BadRequestException(
        'A question must use a supported property of the form database',
      );
    }

    const config = record(dataConfig);
    optionalText(config.placeholder, 'placeholder', MAX_LABEL_LENGTH);
    optionalText(config.help_text, 'help_text', MAX_MESSAGE_LENGTH);

    if (config.required !== undefined && typeof config.required !== 'boolean') {
      throw new BadRequestException('required must be true or false');
    }
  }
}
