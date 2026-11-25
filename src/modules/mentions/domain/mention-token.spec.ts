import { mentionTokensToText, parseMentionedUserIds } from './mention-token';

const LAN = '11111111-1111-4111-8111-111111111111';
const MINH = '22222222-2222-4222-8222-222222222222';

describe('mention tokens', () => {
  it('reads each mentioned user once, ignoring plain @text', () => {
    const body = `Hi @[Lan](user:${LAN}) and @[Minh](user:${MINH}), again @[Lan](user:${LAN}). @someone`;

    expect(parseMentionedUserIds(body)).toEqual([LAN, MINH]);
  });

  it('ignores malformed tokens', () => {
    expect(
      parseMentionedUserIds('@[Lan](user:not-a-uuid) @[](user:x)'),
    ).toEqual([]);
  });

  it('turns tokens into readable text for notifications', () => {
    expect(mentionTokensToText(`Ping @[Lan](user:${LAN})!`)).toBe('Ping @Lan!');
  });

  it('shows page and database mentions without leaking their tokens', () => {
    const body = `@[Lan](user:${LAN}) see @[page](page:${MINH}) and @[database](database:${LAN})`;

    expect(mentionTokensToText(body)).toBe('@Lan see @page and @database');
  });

  it('does not reveal a label written into a page or database token', () => {
    expect(mentionTokensToText(`@[Secret plan](page:${MINH})`)).toBe('@page');
  });

  it('still notifies only mentioned users', () => {
    expect(
      parseMentionedUserIds(
        `@[page](page:${MINH}) @[database](database:${MINH}) @[Lan](user:${LAN})`,
      ),
    ).toEqual([LAN]);
  });
});
