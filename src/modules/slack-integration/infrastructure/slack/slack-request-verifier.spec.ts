import { UnauthorizedException } from '@nestjs/common';
import { createHmac } from 'crypto';

import { SlackRequestVerifier } from './slack-request-verifier';

describe('SlackRequestVerifier', () => {
  const secret = 'signing-secret';
  const verifier = new SlackRequestVerifier({
    getOrThrow: () => secret,
  } as never);
  const rawBody = Buffer.from('payload=%7B%22type%22%3A%22block_actions%22%7D');
  const now = () => String(Math.floor(Date.now() / 1000));
  const sign = (timestamp: string, body = rawBody, key = secret) =>
    `v0=${createHmac('sha256', key)
      .update(`v0:${timestamp}:${body.toString()}`)
      .digest('hex')}`;

  it('accepts a request signed by Slack', () => {
    const timestamp = now();

    expect(() =>
      verifier.verify({ rawBody, timestamp, signature: sign(timestamp) }),
    ).not.toThrow();
  });

  it.each([
    ['a missing signature', () => ({ timestamp: now(), signature: undefined })],
    [
      'a wrong secret',
      () => {
        const timestamp = now();
        return { timestamp, signature: sign(timestamp, rawBody, 'other') };
      },
    ],
    [
      'a changed body',
      () => {
        const timestamp = now();
        return { timestamp, signature: sign(timestamp, Buffer.from('x')) };
      },
    ],
    [
      'a replayed old request',
      () => {
        const timestamp = String(Math.floor(Date.now() / 1000) - 10 * 60);
        return { timestamp, signature: sign(timestamp) };
      },
    ],
  ])('rejects %s', (_label, request) => {
    expect(() => verifier.verify({ rawBody, ...request() })).toThrow(
      UnauthorizedException,
    );
  });
});
