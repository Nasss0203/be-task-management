export class PageFavorite {
  private constructor(
    private readonly id: string,
    private readonly userId: string,
    private readonly pageId: string,
    private readonly createdAt: Date,
  ) {}

  static create(params: { userId: string; pageId: string }): PageFavorite {
    return new PageFavorite(
      crypto.randomUUID(),
      params.userId,
      params.pageId,
      new Date(),
    );
  }

  static restore(params: {
    id: string;
    userId: string;
    pageId: string;
    createdAt: Date;
  }): PageFavorite {
    return new PageFavorite(
      params.id,
      params.userId,
      params.pageId,
      params.createdAt,
    );
  }

  getId(): string {
    return this.id;
  }

  getUserId(): string {
    return this.userId;
  }

  getPageId(): string {
    return this.pageId;
  }

  getCreatedAt(): Date {
    return this.createdAt;
  }
}
