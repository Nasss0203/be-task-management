import { BadRequestException } from '@nestjs/common';
import { PropertyType } from 'src/modules/database/domain/enums/property-type.enum';
import { cleanFormAnswers, type FormQuestion } from './form-answers';

const question = (
  propertyId: string,
  type: PropertyType,
  required = false,
): FormQuestion => ({ propertyId, label: propertyId, required, type });

const questions = [
  question('name', PropertyType.TITLE, true),
  question('email', PropertyType.EMAIL),
  question('site', PropertyType.URL),
  question('age', PropertyType.NUMBER),
  question('agree', PropertyType.CHECKBOX),
];

describe('cleanFormAnswers', () => {
  it('keeps answered questions, trims text and drops empty optional ones', () => {
    expect(
      cleanFormAnswers(questions, {
        name: '  Lan  ',
        email: 'lan@example.com',
        site: '',
        age: 21,
        agree: false,
      }),
    ).toEqual({ name: 'Lan', email: 'lan@example.com', age: 21 });
  });

  it('refuses a missing required answer', () => {
    expect(() => cleanFormAnswers(questions, { name: '   ' })).toThrow(
      '"name" is required',
    );
  });

  it('refuses answers to questions the form does not ask', () => {
    expect(() =>
      cleanFormAnswers(questions, { name: 'Lan', status: 'done' }),
    ).toThrow(BadRequestException);
  });

  it.each([
    ['email', 'not-an-email'],
    ['site', 'javascript:alert(1)'],
    ['age', '21'],
    ['name', 'x'.repeat(5001)],
  ])('refuses a badly formatted %s', (propertyId, value) => {
    expect(() =>
      cleanFormAnswers(questions, { name: 'Lan', [propertyId]: value }),
    ).toThrow(BadRequestException);
  });

  it('needs a ticked box for a required checkbox', () => {
    const consent = [question('agree', PropertyType.CHECKBOX, true)];
    expect(() => cleanFormAnswers(consent, { agree: false })).toThrow(
      '"agree" is required',
    );
    expect(cleanFormAnswers(consent, { agree: true })).toEqual({ agree: true });
  });
});
