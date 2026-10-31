import {
  BadRequestException,
  ForbiddenException,
  Inject,
  Injectable,
} from '@nestjs/common';
import { CONTENT_TYPES } from 'src/modules/content/content.types';
import type { PageBlock } from 'src/modules/content/domain/entities/page-block.entity';
import type { PageBlockRepository } from 'src/modules/content/domain/repositories/page-block.repository';
import type { PageRepository } from 'src/modules/content/domain/repositories/page.repository';
import { DATABASE_TYPES } from 'src/modules/database/database.types';
import type { Database } from 'src/modules/database/domain/aggregates/database/database.aggregate';
import { PropertyType } from 'src/modules/database/domain/enums/property-type.enum';
import type { DatabaseRepository } from 'src/modules/database/domain/repositories/database.repository';
import { AuthorizationService } from 'src/modules/permission/application/services/authorization.service';
import { PERMISSIONS } from 'src/modules/permission/constants/permission.constant';
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

const CONDITION_PROPERTY_TYPES = new Set<PropertyType>([
  PropertyType.SELECT,
  PropertyType.STATUS,
]);

const MAX_LABEL_LENGTH = 200;
const MAX_MESSAGE_LENGTH = 500;

export interface SectionFormConfig {
  databaseId: string;
  submitLabel: string | null;
  successMessage: string | null;
  respondentPropertyId: string | null;
}

export interface FormFieldCondition {
  propertyId: string;
  optionId: string;
}

/** Maps an option of the question to the source option that shows it. */
export interface FormOptionConditions {
  propertyId: string;
  options: Record<string, string>;
}

export interface FormFieldConfig {
  propertyId: string;
  required: boolean;
  showWhen: FormFieldCondition | null;
  optionConditions: FormOptionConditions | null;
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
    respondentPropertyId:
      typeof config.respondent_property_id === 'string'
        ? config.respondent_property_id
        : null,
  };
}

export function formFieldOf(
  dataConfig: PageBlockJson | undefined,
): FormFieldConfig | null {
  const config = record(dataConfig);
  if (typeof config.property_id !== 'string') return null;

  const showWhen = record(config.show_when);
  const optionConditions = record(config.option_conditions);

  return {
    propertyId: config.property_id,
    required: config.required === true,
    showWhen:
      typeof showWhen.property_id === 'string' &&
      typeof showWhen.option_id === 'string'
        ? { propertyId: showWhen.property_id, optionId: showWhen.option_id }
        : null,
    optionConditions:
      typeof optionConditions.property_id === 'string'
        ? {
            propertyId: optionConditions.property_id,
            options: Object.fromEntries(
              Object.entries(record(optionConditions.options)).filter(
                (entry): entry is [string, string] =>
                  typeof entry[1] === 'string',
              ),
            ),
          }
        : null,
  };
}

@Injectable()
export class PageBlockFormService {
  constructor(
    @Inject(CONTENT_TYPES.repositories.PageBlockRepository)
    private readonly pageBlockRepo: PageBlockRepository,

    @Inject(CONTENT_TYPES.repositories.PageRepository)
    private readonly pageRepo: PageRepository,

    @Inject(DATABASE_TYPES.repositories.DatabaseRepository)
    private readonly databaseRepository: DatabaseRepository,

    private readonly authorization: AuthorizationService,
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
      database: await this.databaseInWorkspace(
        form.databaseId,
        section.getPageId(),
        context,
      ),
    };
  }

  private async databaseInWorkspace(
    databaseId: string,
    pageId: string,
    context?: PersistenceContext,
  ): Promise<Database> {
    const database = await this.databaseRepository.findById(
      databaseId,
      context,
    );
    const databasePage = database
      ? await this.pageRepo.findById(database.getPageId(), context)
      : null;
    const formPage = await this.pageRepo.findById(pageId, context);

    if (
      !database ||
      !databasePage ||
      databasePage.getWorkspaceId() !== formPage?.getWorkspaceId()
    ) {
      throw new BadRequestException(
        'A form can only fill a database in its own workspace',
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
      userId: string;
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
      const database = await this.databaseInWorkspace(
        next.databaseId,
        section.pageId,
        context,
      );

      if (
        next.databaseId !== current?.databaseId &&
        database.getPageId() !== section.pageId &&
        !(await this.authorization.authorize({
          userId: section.userId,
          permissions: [PERMISSIONS.PAGE_BLOCK_UPDATE],
          target: { type: 'page', id: database.getPageId() },
        }))
      ) {
        throw new ForbiddenException(
          'You need edit access to the page of this database',
        );
      }

      if (
        next.respondentPropertyId &&
        database
          .getProperties()
          .find((item) => item.getId() === next.respondentPropertyId)
          ?.getType() !== PropertyType.PERSON
      ) {
        throw new BadRequestException(
          'form.respondent_property_id must be a person property',
        );
      }
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

  async assertColumnFree(
    parent: PageBlock,
    dataConfig: PageBlockJson | undefined,
    context?: PersistenceContext,
  ): Promise<void> {
    const propertyId = formFieldOf(dataConfig)?.propertyId;
    const questions = await this.pageBlockRepo.findActiveChildren(
      parent.getId(),
      context,
    );

    if (
      questions.some(
        (question) =>
          question.getType() === PageBlockType.FORM_FIELD &&
          formFieldOf(question.getDataConfig())?.propertyId === propertyId,
      )
    ) {
      throw new BadRequestException('This column already has a question');
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

    if (config.option_conditions) {
      const source = database
        .getProperties()
        .find((item) => item.getId() === field.optionConditions?.propertyId);
      const sourceOptions = new Set(
        source?.getOptions().map((option) => option.getId()),
      );
      const ownOptions = new Set(
        property.getOptions().map((option) => option.getId()),
      );

      if (
        property.getType() !== PropertyType.MULTI_SELECT ||
        !field.optionConditions ||
        field.optionConditions.propertyId === field.propertyId ||
        !source ||
        !CONDITION_PROPERTY_TYPES.has(source.getType()) ||
        Object.entries(field.optionConditions.options).some(
          ([option, sourceOption]) =>
            !ownOptions.has(option) || !sourceOptions.has(sourceOption),
        )
      ) {
        throw new BadRequestException(
          'option_conditions must tie options of a multiple choice question to a single choice question',
        );
      }
    }

    if (config.show_when === undefined || config.show_when === null) return;

    const source = database
      .getProperties()
      .find((item) => item.getId() === field.showWhen?.propertyId);

    if (
      !field.showWhen ||
      field.showWhen.propertyId === field.propertyId ||
      !source ||
      !CONDITION_PROPERTY_TYPES.has(source.getType()) ||
      !source
        .getOptions()
        .some((option) => option.getId() === field.showWhen?.optionId)
    ) {
      throw new BadRequestException(
        'show_when must name an option of a single choice question',
      );
    }
  }
}
