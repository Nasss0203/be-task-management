export class SetTemplateLikeCommand {
  constructor(
    public readonly templateId: string,
    public readonly userId: string,
    public readonly liked: boolean,
  ) {}
}
