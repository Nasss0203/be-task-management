import type { PageBlockFormService } from 'src/modules/content/application/services/page-block-form.service';
import type { PageBlockRepository } from 'src/modules/content/domain/repositories/page-block.repository';
import type { CreateDatabaseRowHandler } from 'src/modules/database/application/commands/create-database-row/create-database-row.handler';
import type { SetRowValueHandler } from 'src/modules/database/application/commands/set-row-value/set-row-value.handler';
import type { UnitOfWork } from 'src/shared/infrastructure/persistence/unit-of-work.interface';
import { SubmitFormResponseCommand } from './submit-form-response.command';
import { SubmitFormResponseHandler } from './submit-form-response.handler';

describe('SubmitFormResponseHandler', () => {
  const submit = async (respondentPropertyId: string | null) => {
    const setRowValue = { execute: jest.fn() };
    const handler = new SubmitFormResponseHandler(
      {
        findById: jest.fn().mockResolvedValue({ getId: () => 'section' }),
        findActiveChildren: jest.fn().mockResolvedValue([]),
      } as unknown as PageBlockRepository,
      {
        runInTransaction: (work: (context: unknown) => unknown) => work({}),
      } as unknown as UnitOfWork,
      {
        formDatabase: jest.fn().mockResolvedValue({
          form: { respondentPropertyId, successMessage: null },
          database: {
            getId: () => 'db',
            getProperties: () => [{ getId: () => 'person' }],
          },
        }),
      } as unknown as PageBlockFormService,
      {
        execute: jest.fn().mockResolvedValue({ id: 'row' }),
      } as unknown as CreateDatabaseRowHandler,
      setRowValue as unknown as SetRowValueHandler,
    );

    await handler.execute(new SubmitFormResponseCommand('section', {}, 'user'));

    return setRowValue.execute;
  };

  it('records who submitted when the form has a respondent column', async () => {
    const setValue = await submit('person');

    expect(setValue).toHaveBeenCalledWith(
      expect.objectContaining({ propertyId: 'person', value: ['user'] }),
      expect.anything(),
    );
  });

  it('records nobody on a form without one', async () => {
    expect(await submit(null)).not.toHaveBeenCalled();
  });

  it('ignores a respondent column that was deleted', async () => {
    expect(await submit('gone')).not.toHaveBeenCalled();
  });
});
