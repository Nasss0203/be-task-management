import { PropertyType } from '../../enums/property-type.enum';
import { DatabaseProperty } from './database-property.entity';
import { PropertyOption } from './property-option.entity';

describe('DatabaseProperty.getDefaultOption', () => {
  it('returns the option with the lowest numeric position', () => {
    const property = new DatabaseProperty(
      'status',
      'database',
      'Status',
      PropertyType.STATUS,
      false,
      true,
      '0',
      [
        new PropertyOption('done', 'Done', null, '10'),
        new PropertyOption('todo', 'Todo', null, '2'),
        new PropertyOption('doing', 'Doing', null, '5'),
      ],
    );

    expect(property.getDefaultOption()?.getId()).toBe('todo');
  });

  it('returns undefined when there are no options', () => {
    const property = new DatabaseProperty(
      'status',
      'database',
      'Status',
      PropertyType.STATUS,
      false,
      true,
      '0',
    );

    expect(property.getDefaultOption()).toBeUndefined();
  });
});
