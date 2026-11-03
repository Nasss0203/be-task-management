import { ForbiddenException, NotFoundException } from '@nestjs/common';
import type { PageBlockFormService } from 'src/modules/content/application/services/page-block-form.service';
import type { FormAnswerKeyRepository } from 'src/modules/content/domain/repositories/form-answer-key.repository';
import type { PageBlockRepository } from 'src/modules/content/domain/repositories/page-block.repository';
import { PropertyType } from 'src/modules/database/domain/enums/property-type.enum';
import { PageBlockType } from 'src/shared/domain/page-block-type.enum';
import { SetFormAnswerKeyCommand } from './set-form-answer-key.command';
import { SetFormAnswerKeyHandler } from './set-form-answer-key.handler';

describe('SetFormAnswerKeyHandler', () => {
  const setup = (options?: { allowed?: boolean; parent?: string }) => {
    const blocks: Record<string, unknown> = {
      section: { getId: () => 'section' },
      question: {
        getId: () => 'question',
        getType: () => PageBlockType.FORM_FIELD,
        getParentBlockId: () => options?.parent ?? 'section',
        getDataConfig: () => ({ property_id: 'city' }),
      },
    };
    const answerKeys = {
      save: jest.fn((key: unknown) => Promise.resolve(key)),
      deleteByFieldBlockId: jest.fn().mockResolvedValue(undefined),
    };
    const forms = {
      answerKeyDatabase: jest.fn(() =>
        options?.allowed === false
          ? Promise.reject(new ForbiddenException())
          : Promise.resolve({
              getProperties: () => [
                {
                  getId: () => 'city',
                  getType: () => PropertyType.SELECT,
                  getOptions: () => [{ getId: () => 'hanoi' }],
                },
              ],
            }),
      ),
    };
    const handler = new SetFormAnswerKeyHandler(
      {
        findById: jest.fn((id: string) => Promise.resolve(blocks[id] ?? null)),
      } as unknown as PageBlockRepository,
      answerKeys as unknown as FormAnswerKeyRepository,
      forms as unknown as PageBlockFormService,
    );

    return { handler, answerKeys };
  };

  const command = (value: unknown) =>
    new SetFormAnswerKeyCommand('section', 'question', value, 2, 'teacher');

  it('saves a correct option', async () => {
    const { handler, answerKeys } = setup();

    await expect(handler.execute(command('hanoi'))).resolves.toEqual({
      field_block_id: 'question',
      correct_value: 'hanoi',
      points: 2,
    });
    expect(answerKeys.save).toHaveBeenCalled();
  });

  it('refuses without edit access to the database page', async () => {
    const { handler, answerKeys } = setup({ allowed: false });

    await expect(handler.execute(command('hanoi'))).rejects.toBeInstanceOf(
      ForbiddenException,
    );
    expect(answerKeys.save).not.toHaveBeenCalled();
  });

  it('refuses a question of another section', async () => {
    const { handler } = setup({ parent: 'other' });

    await expect(handler.execute(command('hanoi'))).rejects.toBeInstanceOf(
      NotFoundException,
    );
  });

  it('removes the key on null', async () => {
    const { handler, answerKeys } = setup();

    await handler.execute(command(null));

    expect(answerKeys.deleteByFieldBlockId).toHaveBeenCalledWith('question');
    expect(answerKeys.save).not.toHaveBeenCalled();
  });
});
