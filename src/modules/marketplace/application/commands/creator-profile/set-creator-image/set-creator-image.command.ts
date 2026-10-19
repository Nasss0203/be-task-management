export interface CreatorImageUpload {
  buffer: Buffer;
  size: number;
}

export class SetCreatorImageCommand {
  constructor(
    public readonly userId: string,
    public readonly kind: string,
    public readonly file: CreatorImageUpload | null,
  ) {}
}
