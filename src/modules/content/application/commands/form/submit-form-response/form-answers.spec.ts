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

describe('cleanFormAnswers with option_conditions', () => {
  const team: FormQuestion = {
    propertyId: 'team',
    label: 'Team',
    required: true,
    type: PropertyType.SELECT,
  };
  const skills: FormQuestion = {
    propertyId: 'skills',
    label: 'Skills',
    required: true,
    type: PropertyType.MULTI_SELECT,
    optionIds: ['react', 'node', 'git'],
    optionConditions: {
      propertyId: 'team',
      options: { react: 'fe', node: 'be' },
    },
  };

  it('keeps only the options of the chosen answer and untied ones', () => {
    expect(
      cleanFormAnswers([team, skills], {
        team: 'be',
        skills: ['react', 'node', 'git'],
      }),
    ).toEqual({ team: 'be', skills: ['node', 'git'] });
  });

  it('requires an answer among the options of the chosen answer', () => {
    expect(() =>
      cleanFormAnswers([team, skills], { team: 'fe', skills: ['node'] }),
    ).toThrow('"Skills" is required');
  });

  it('skips the question when the chosen answer has no options', () => {
    const tied = {
      ...skills,
      optionIds: ['react'],
    };

    expect(cleanFormAnswers([team, tied], { team: 'be' })).toEqual({
      team: 'be',
    });
  });
});

describe('cleanFormAnswers with show_when', () => {
  const team: FormQuestion = {
    propertyId: 'team',
    label: 'Team',
    required: true,
    type: PropertyType.SELECT,
  };
  const skills: FormQuestion = {
    propertyId: 'skills',
    label: 'Skills',
    required: true,
    type: PropertyType.TEXT,
    showWhen: { propertyId: 'team', optionId: 'fe' },
  };

  it('requires a shown question', () => {
    expect(() => cleanFormAnswers([team, skills], { team: 'fe' })).toThrow(
      '"Skills" is required',
    );
  });

  it('skips and drops a hidden question', () => {
    expect(
      cleanFormAnswers([team, skills], { team: 'be', skills: 'React' }),
    ).toEqual({ team: 'be' });
  });

  it('hides a question whose source is hidden too', () => {
    const next: FormQuestion = {
      ...skills,
      propertyId: 'next',
      label: 'Next',
      showWhen: { propertyId: 'skills', optionId: 'x' },
    };

    expect(
      cleanFormAnswers([team, skills, next], { team: 'be', next: 'y' }),
    ).toEqual({ team: 'be' });
  });

  it('ignores a condition on a later question', () => {
    expect(() => cleanFormAnswers([skills, team], { team: 'be' })).toThrow(
      '"Skills" is required',
    );
  });
});

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
