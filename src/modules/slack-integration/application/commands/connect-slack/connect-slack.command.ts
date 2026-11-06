export class ConnectSlackCommand {
  constructor(
    public readonly code: string | null,
    public readonly state: string | null,
    public readonly error: string | null,
  ) {}
}
