export class PagePublicationPath {
  private constructor(private readonly value: string) {}

  static create(value: string): PagePublicationPath {
    const trimmed = value.trim();

    if (trimmed.includes('?') || trimmed.includes('#')) {
      throw new Error('Publication path cannot contain query or fragment');
    }

    let normalized = trimmed.length === 0 ? '/' : trimmed;

    if (!normalized.startsWith('/')) {
      normalized = `/${normalized}`;
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
