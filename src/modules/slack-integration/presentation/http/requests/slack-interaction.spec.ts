import { parseSlackInteraction } from './slack-interaction';

describe('parseSlackInteraction', () => {
  const commentId = '3f1c2b7e-8d4a-4c1e-9b2f-6a7d8e9f0a1b';
  const base = { team: { id: 'T1' }, user: { id: 'U1', team_id: 'T1' } };
  const parse = (payload: unknown) =>
    parseSlackInteraction(JSON.stringify(payload));

  it('reads a Reply on page click', () => {
    expect(
      parse({
        ...base,
        type: 'block_actions',
        trigger_id: 'trigger-1',
        actions: [{ action_id: 'reply_on_page', value: commentId }],
      }),
    ).toEqual({
      kind: 'open-reply',
      slackTeamId: 'T1',
      slackUserId: 'U1',
      triggerId: 'trigger-1',
      commentId,
    });
  });

  it('reads the submitted reply', () => {
    expect(
      parse({
        ...base,
        type: 'view_submission',
        view: {
          callback_id: 'reply_on_page_submit',
          private_metadata: commentId,
          state: { values: { reply: { body: { value: 'Looks good' } } } },
        },
      }),
    ).toEqual({
      kind: 'submit-reply',
      slackTeamId: 'T1',
      slackUserId: 'U1',
      commentId,
      body: 'Looks good',
    });
  });

  it.each([
    ['broken JSON', 'not json'],
    [
      'a comment id that is not a uuid',
      JSON.stringify({
        ...base,
        type: 'block_actions',
        trigger_id: 'trigger-1',
        actions: [{ action_id: 'reply_on_page', value: 'x' }],
      }),
    ],
    [
      'another button',
      JSON.stringify({
        ...base,
        type: 'block_actions',
        trigger_id: 'trigger-1',
        actions: [{ action_id: 'other', value: commentId }],
      }),
    ],
    ['an unknown interaction', JSON.stringify({ ...base, type: 'shortcut' })],
  ])('ignores %s', (_label, payload) => {
    expect(parseSlackInteraction(payload)).toBeNull();
  });
});
