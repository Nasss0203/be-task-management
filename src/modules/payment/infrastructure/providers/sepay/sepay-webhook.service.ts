import {
  Injectable,
  InternalServerErrorException,
  UnauthorizedException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { createHmac, timingSafeEqual } from 'node:crypto';

export interface VerifySepayWebhookSignatureParams {
  rawBody: Buffer;
  signature: string | undefined;
  timestamp: string | undefined;
}

const MAX_TIMESTAMP_DIFFERENCE_SECONDS = 5 * 60;

@Injectable()
export class SepayWebhookService {
  constructor(private readonly configService: ConfigService) {}

  verifySignature(params: VerifySepayWebhookSignatureParams): void {
    const secret = this.configService
      .get<string>('SEPAY_WEBHOOK_SECRET')
      ?.trim();

    if (!secret) {
      throw new InternalServerErrorException(
        'SePay webhook secret is not configured',
      );
    }

    const signature = params.signature?.trim().toLowerCase();
    const timestamp = params.timestamp?.trim();

    if (!signature || !timestamp) {
      throw new UnauthorizedException('Missing SePay webhook signature');
    }

    const timestampSeconds = Number(timestamp);

    if (!Number.isSafeInteger(timestampSeconds) || timestampSeconds <= 0) {
      throw new UnauthorizedException('Invalid SePay webhook timestamp');
    }

    const currentTimestampSeconds = Math.floor(Date.now() / 1000);

    if (
      Math.abs(currentTimestampSeconds - timestampSeconds) >
      MAX_TIMESTAMP_DIFFERENCE_SECONDS
    ) {
      throw new UnauthorizedException('SePay webhook request has expired');
    }

    const expectedDigest = createHmac('sha256', secret)
      .update(`${timestamp}.`)
      .update(params.rawBody)
      .digest('hex');

    const expectedSignature = `sha256=${expectedDigest}`;
    const receivedBuffer = Buffer.from(signature, 'utf8');
    const expectedBuffer = Buffer.from(expectedSignature, 'utf8');

    if (
      receivedBuffer.length !== expectedBuffer.length ||
      !timingSafeEqual(receivedBuffer, expectedBuffer)
    ) {
      throw new UnauthorizedException('Invalid SePay webhook signature');
    }
  }
}
