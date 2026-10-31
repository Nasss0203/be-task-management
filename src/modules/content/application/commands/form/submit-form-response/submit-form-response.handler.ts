import { Inject, Injectable, NotFoundException } from '@nestjs/common';
import {
  formFieldOf,
  PageBlockFormService,
} from 'src/modules/content/application/services/page-block-form.service';
import { CONTENT_TYPES } from 'src/modules/content/content.types';
import type { PageBlockRepository } from 'src/modules/content/domain/repositories/page-block.repository';
import { CreateDatabaseRowCommand } from 'src/modules/database/application/commands/create-database-row/create-database-row.command';
import { CreateDatabaseRowHandler } from 'src/modules/database/application/commands/create-database-row/create-database-row.handler';
import { SetRowValueCommand } from 'src/modules/database/application/commands/set-row-value/set-row-value.command';
import { SetRowValueHandler } from 'src/modules/database/application/commands/set-row-value/set-row-value.handler';
import type { RowValueData } from 'src/modules/database/domain/aggregates/row/row-value.type';
import { PageBlockType } from 'src/shared/domain/page-block-type.enum';
import { PERSISTENCE_TYPES } from 'src/shared/infrastructure/persistence/persistence.types';
import type { UnitOfWork } from 'src/shared/infrastructure/persistence/unit-of-work.interface';
import { cleanFormAnswers, type FormQuestion } from './form-answers';
import { SubmitFormResponseCommand } from './submit-form-response.command';

export interface SubmitFormResponseResult {
  row_id: string;
  success_message: string | null;
}

@Injectable()
export class SubmitFormResponseHandler {
  constructor(
    @Inject(CONTENT_TYPES.repositories.PageBlockRepository)
    private readonly pageBlockRepo: PageBlockRepository,

    @Inject(PERSISTENCE_TYPES.UnitOfWork)
    private readonly uow: UnitOfWork,

    private readonly forms: PageBlockFormService,
    private readonly createRow: CreateDatabaseRowHandler,
    private readonly setRowValue: SetRowValueHandler,
  ) {}

  async execute(
    command: SubmitFormResponseCommand,
  ): Promise<SubmitFormResponseResult> {
    return this.uow.runInTransaction(async (context) => {
      const section = await this.pageBlockRepo.findById(
        command.sectionBlockId,
        context,
      );

      if (!section) {
        throw new NotFoundException('Form not found');
      }

      const { form, database } = await this.forms.formDatabase(
        section,
        context,
      );
      const properties = new Map(
        database
          .getProperties()
          .map((property) => [property.getId(), property]),
      );
      const children = await this.pageBlockRepo.findActiveChildren(
        section.getId(),
        context,
      );

      const questions: FormQuestion[] = children.flatMap((child) => {
        const field =
          child.getType() === PageBlockType.FORM_FIELD
            ? formFieldOf(child.getDataConfig())
            : null;
        const property = field ? properties.get(field.propertyId) : undefined;
        if (!field || !property) return [];

        const content = (child.getContent() ?? {}) as Record<string, unknown>;
        const label = typeof content.label === 'string' ? content.label : '';
        const condition = field.showWhen;
        const conditionHolds =
          condition &&
          properties
            .get(condition.propertyId)
            ?.getOptions()
            .some((option) => option.getId() === condition.optionId);

        const optionRule = field.optionConditions;
        const sourceOptions = optionRule
          ? properties
              .get(optionRule.propertyId)
              ?.getOptions()
              .map((option) => option.getId())
          : undefined;

        return [
          {
            propertyId: field.propertyId,
            label: label || property.getName(),
            required: field.required,
            type: property.getType(),
            showWhen: conditionHolds ? condition : null,
            optionIds: property.getOptions().map((option) => option.getId()),
            // A mapping to a deleted option must not hide the option for good.
            optionConditions:
              optionRule && sourceOptions
                ? {
                    propertyId: optionRule.propertyId,
                    options: Object.fromEntries(
                      Object.entries(optionRule.options).filter(([, source]) =>
                        sourceOptions.includes(source),
                      ),
                    ),
                  }
                : null,
          },
        ];
      });

      const answers = cleanFormAnswers(questions, command.answers);
      const row = await this.createRow.execute(
        new CreateDatabaseRowCommand(database.getId()),
        context,
      );

      for (const [propertyId, value] of Object.entries(answers)) {
        await this.setRowValue.execute(
          new SetRowValueCommand(row.id, propertyId, value as RowValueData),
          context,
        );
      }

      if (
        form.respondentPropertyId &&
        properties.has(form.respondentPropertyId)
      ) {
        await this.setRowValue.execute(
          new SetRowValueCommand(row.id, form.respondentPropertyId, [
            command.userId,
          ]),
          context,
        );
      }

      return { row_id: row.id, success_message: form.successMessage };
    });
  }
}
