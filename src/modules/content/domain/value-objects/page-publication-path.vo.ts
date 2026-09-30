import { BadRequestException } from '@nestjs/common';

export class PagePublicationPath {
  private constructor(private readonly value: string) {}

  static create(value: string): PagePublicationPath {
    const trimmed = value.trim();

    if (trimmed.includes('?') || trimmed.includes('#')) {
      throw new BadRequestException(
        'Publication path cannot contain query or fragment',
      );
    }

    let normalized = trimmed.length === 0 ? '/' : trimmed;

    if (!normalized.startsWith('/')) {
      normalized = `/${normalized}`;
    }

    let decoded: string;
    try {
      decoded = decodeURIComponent(normalized);
    } catch {
      throw new BadRequestException('Invalid publication path encoding');
    }
    if (
      normalized.length > 2048 ||
      decoded.includes('//') ||
      /[\\\\\s?#]/.test(decoded) ||
      decoded.split('/').some((segment) => segment === '.' || segment === '..')
    ) {
      throw new BadRequestException('Invalid publication path');
    }

    if (normalized.length > 1) {
      normalized = normalized.replace(/\/+$/, '');
    }

    return new PagePublicationPath(normalized);
  }

  getValue(): string {
    return this.value;
  }
}
