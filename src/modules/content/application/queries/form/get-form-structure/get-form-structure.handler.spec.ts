import type { PageBlockFormService } from 'src/modules/content/application/services/page-block-form.service';
import type { PageBlockRepository } from 'src/modules/content/domain/repositories/page-block.repository';
import { PageBlockType } from 'src/shared/domain/page-block-type.enum';
import { GetFormStructureHandler } from './get-form-structure.handler';
import { GetFormStructureQuery } from './get-form-structure.query';

const property = (id: string, name: string) => ({
  getId: () => id,
  getName: () => name,
  getType: () => 'TEXT',
  getPosition: () => '0',
  getOptions: () => [],
});

describe('GetFormStructureHandler', () => {
  it('returns only the columns used by questions', async () => {
    const section = { getId: () => 'section' };
    const repo = {
      findById: jest.fn().mockResolvedValue(section),
      findActiveChildren: jest.fn().mockResolvedValue([
        {
          getType: () => PageBlockType.FORM_FIELD,
          getDataConfig: () => ({ property_id: 'name' }),
        },
        {
          getType: () => PageBlockType.TEXT,
          getDataConfig: () => ({ property_id: 'salary' }),
        },
      ]),
    };
    const forms = {
      formDatabase: jest.fn().mockResolvedValue({
        database: {
          getId: () => 'db',
          getProperties: () => [
            property('name', 'Name'),
            property('salary', 'Salary'),
          ],
        },
      }),
    };
    const handler = new GetFormStructureHandler(
      repo as unknown as PageBlockRepository,
      forms as unknown as PageBlockFormService,
    );

    const result = await handler.execute(new GetFormStructureQuery('section'));

    expect(result.id).toBe('db');
    expect(result.properties.map((item) => item.id)).toEqual(['name']);
    expect(result).not.toHaveProperty('pageId');
  });
});
