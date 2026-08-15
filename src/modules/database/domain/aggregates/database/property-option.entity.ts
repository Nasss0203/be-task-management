export class PropertyOption {
  constructor(
    readonly id: string,
    private name: string,
    private color: string | null,
    private position: string,
  ) {
    this.validateName(name);
  }

  getId(): string {
    return this.id;
  }

  getName(): string {
    return this.name;
  }

  getColor(): string | null {
    return this.color;
  }

  getPosition(): string {
    return this.position;
  }

  rename(name: string): void {
    this.validateName(name);

    this.name = name.trim();
  }

  changeColor(color: string | null): void {
    this.color = color;
  }

  changePosition(position: string): void {
    this.position = position;
  }

  private validateName(name: string): void {
    if (!name.trim()) {
      throw new Error('Property option name is required');
    }
  }
}
