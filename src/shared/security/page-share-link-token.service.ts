import { Injectable, OnModuleInit } from '@nestjs/common';
import { createHmac, timingSafeEqual } from 'crypto';

interface VerifiedToken {
  linkId: string;
}

@Injectable()
export class PageShareLinkTokenService implements OnModuleInit {
  private secret!: string;

  onModuleInit(): void {
    const secret = process.env.SHARE_LINK_SECRET;

    if (!secret) {
      throw new Error(
        'SHARE_LINK_SECRET is not set. ' +
          'Refusing to start without it, ' +
          'since it is required to sign/verify ' +
          'page share link tokens.',
      );
    }

    this.secret = secret;
  }

  generate(linkId: string): string {
    const linkIdPart = this.toBase64Url(Buffer.from(linkId, 'utf8'));

    const signature = this.sign(linkId);

    return `${linkIdPart}.${signature}`;
  }

  verify(token: string): VerifiedToken | null {
    if (!token) {
      return null;
    }

    const parts = token.split('.');

    if (parts.length !== 2) {
      return null;
    }

    const [linkIdPart, signaturePart] = parts;

    if (!linkIdPart || !signaturePart) {
      return null;
    }

    let linkId: string;

    try {
      linkId = this.fromBase64Url(linkIdPart).toString('utf8');
    } catch {
      return null;
    }

    const expectedSignature = this.sign(linkId);

    if (!this.safeEqual(signaturePart, expectedSignature)) {
      return null;
    }

    return {
      linkId,
    };
  }

  private sign(linkId: string): string {
    const payload = `page-share-link:${linkId}`;

    const hmac = createHmac('sha256', this.secret);

    hmac.update(payload);

    return this.toBase64Url(hmac.digest());
  }

  private safeEqual(a: string, b: string): boolean {
    const bufA = Buffer.from(a, 'utf8');

    const bufB = Buffer.from(b, 'utf8');

    if (bufA.length !== bufB.length) {
      return false;
    }

    return timingSafeEqual(bufA, bufB);
  }

  private toBase64Url(buffer: Buffer): string {
    return buffer
      .toString('base64')
      .replace(/\+/g, '-')
      .replace(/\//g, '_')
      .replace(/=+$/, '');
  }

  private fromBase64Url(value: string): Buffer {
    let base64 = value.replace(/-/g, '+').replace(/_/g, '/');

    while (base64.length % 4) {
      base64 += '=';
    }

    return Buffer.from(base64, 'base64');
  }
}
