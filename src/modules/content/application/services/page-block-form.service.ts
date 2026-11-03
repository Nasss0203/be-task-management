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
import type { DatabaseProperty } from 'src/modules/database/domain/aggregates/database/database-property.entity';
import { PropertyType } from 'src/modules/database/domain/enums/property-type.enum';
import type { DatabaseRepository } from 'src/modules/database/domain/repositories/database.repository';
import { AuthorizationService } from 'src/modules/permission/application/services/authorization.service';
import { PERMISSIONS } from 'src/modules/permission/constants/permission.constant';
import { PageBlockType } from 'src/shared/domain/page-block-type.enum';
import type { PageBlockJson } from 'src/shared/domain/page-block.types';
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

export const QUIZ_PROPERTY_TYPES = new Set<PropertyType>([
  PropertyType.TITLE,
  PropertyType.TEXT,
  PropertyType.NUMBER,
  PropertyType.SELECT,
  PropertyType.MULTI_SELECT,
  PropertyType.STATUS,
  PropertyType.CHECKBOX,
]);

export const QUIZ_SHOW_RESULTS = ['none', 'score', 'results'] as const;
export type QuizShowResult = (typeof QUIZ_SHOW_RESULTS)[number];

const MAX_ANSWER_LENGTH = 5000;

const MAX_LABEL_LENGTH = 200;
const MAX_MESSAGE_LENGTH = 500;

export interface SectionFormConfig {
  databaseId: string;
  submitLabel: string | null;
  successMessage: string | null;
  respondentPropertyId: string | null;
}

export interface SectionQuizConfig {
  showResult: QuizShowResult;
  maxAttempts: number | null;
  scorePropertyId: string;
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

export function sectionQuizOf(
  dataConfig: PageBlockJson | undefined,
): SectionQuizConfig | null {
  const config = record(record(dataConfig).quiz);
  if (typeof config.score_property_id !== 'string') return null;

  return {
    showResult: QUIZ_SHOW_RESULTS.includes(config.show_result as QuizShowResult)
      ? (config.show_result as QuizShowResult)
      : 'score',
    maxAttempts:
      typeof config.max_attempts === 'number' ? config.max_attempts : null,
    scorePropertyId: config.score_property_id,
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

export function assertAnswerKeyValue(
  property: DatabaseProperty,
  value: unknown,
): void {
  const options = new Set(
    property.getOptions().map((option) => option.getId()),
  );
  const isOption = (id: unknown) => typeof id === 'string' && options.has(id);

  const valid = (() => {
    switch (property.getType()) {
      case PropertyType.SELECT:
      case PropertyType.STATUS:
        return isOption(value);
      case PropertyType.MULTI_SELECT:
        return (
          Array.isArray(value) &&
          value.length > 0 &&
          value.every(isOption) &&
          new Set(value).size === value.length
        );
      case PropertyType.CHECKBOX:
        return typeof value === 'boolean';
      case PropertyType.NUMBER:
        return typeof value === 'number' && Number.isFinite(value);
      case PropertyType.TITLE:
      case PropertyType.TEXT:
        return (
          typeof value === 'string' &&
          value.trim() !== '' &&
          value.length <= MAX_ANSWER_LENGTH
        );
      default:
        return false;
    }
  })();

  if (!valid) {
    throw new BadRequestException('correct_value does not fit this question');
  }
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

  async answerKeyDatabase(
    section: PageBlock,
    userId: string,
    context?: PersistenceContext,
  ): Promise<Database> {
    const { database } = await this.formDatabase(section, context);

    const allowed = await this.authorization.authorize({
      userId,
      permissions: [PERMISSIONS.PAGE_BLOCK_UPDATE],
      target: { type: 'page', id: database.getPageId() },
    });

    if (!allowed) {
      throw new ForbiddenException(
        'You need edit access to the page of this database',
      );
    }

    return database;
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

      await this.assertValidQuiz(section.next, database, section, context);
    } else if (Object.keys(formConfig).length > 0) {
      throw new BadRequestException('form.database_id is required');
    } else if (record(section.next).quiz) {
      throw new BadRequestException('Turn the section into a form first');
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

    if (
      sectionQuizOf(parent.getDataConfig())?.scorePropertyId ===
      field.propertyId
    ) {
      throw new BadRequestException('The score column cannot be a question');
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

  private async assertValidQuiz(
    next: PageBlockJson,
    database: Database,
    section: { pageId: string; sectionId: string | null },
    context?: PersistenceContext,
  ): Promise<void> {
    const raw = record(next).quiz;
    if (raw === undefined || raw === null) return;

    const config = record(raw);
    const quiz = sectionQuizOf(next);
    const maxAttempts = config.max_attempts;

    if (!QUIZ_SHOW_RESULTS.includes(config.show_result as QuizShowResult)) {
      throw new BadRequestException(
        'quiz.show_result must be none, score or results',
      );
    }

    if (
      maxAttempts !== undefined &&
      maxAttempts !== null &&
      !(Number.isInteger(maxAttempts) && (maxAttempts as number) > 0)
    ) {
      throw new BadRequestException(
        'quiz.max_attempts must be a positive whole number',
      );
    }

    const scoreProperty = database
      .getProperties()
      .find((item) => item.getId() === quiz?.scorePropertyId);

    if (!quiz || scoreProperty?.getType() !== PropertyType.NUMBER) {
      throw new BadRequestException(
        'quiz.score_property_id must be a number property of the form database',
      );
    }

    if (database.getPageId() === section.pageId) {
      throw new BadRequestException(
        'Move the answers database to its own page before turning on quiz',
      );
    }

    if (!section.sectionId) return;

    const children = await this.pageBlockRepo.findActiveChildren(
      section.sectionId,
      context,
    );

    if (
      children.some(
        (child) =>
          child.getType() === PageBlockType.FORM_FIELD &&
          formFieldOf(child.getDataConfig())?.propertyId ===
            quiz.scorePropertyId,
      )
    ) {
      throw new BadRequestException('The score column cannot be a question');
    }
  }
}
