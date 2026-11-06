import { Injectable, UnauthorizedException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { createHmac, timingSafeEqual } from 'crypto';

const MAX_REQUEST_AGE_SECONDS = 5 * 60;

export type SlackSignedRequest = {
  rawBody: Buffer;
  signature?: string;
  timestamp?: string;
};

@Injectable()
export class SlackRequestVerifier {
  constructor(private readonly configService: ConfigService) {}

  verify({ rawBody, signature, timestamp }: SlackSignedRequest): void {
    const sentAt = Number(timestamp);
    const age = Math.abs(Date.now() / 1000 - sentAt);

    if (
      !signature ||
      !Number.isFinite(sentAt) ||
      age > MAX_REQUEST_AGE_SECONDS
    ) {
      throw new UnauthorizedException('Invalid Slack request');
    }

    const expected = Buffer.from(
      `v0=${createHmac(
        'sha256',
        this.configService.getOrThrow<string>('SLACK_SIGNING_SECRET'),
      )
        .update(`v0:${timestamp}:${rawBody.toString('utf8')}`)
        .digest('hex')}`,
    );
    const received = Buffer.from(signature);

    if (
      received.length !== expected.length ||
      !timingSafeEqual(received, expected)
    ) {
      throw new UnauthorizedException('Invalid Slack request');
    }
  }
}
