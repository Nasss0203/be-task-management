export type CreateTemplatePriceParams = {
  amount: number;
  currency: string;
};

export class TemplatePrice {
  private constructor(
    private readonly amount: number,
    private readonly currency: 'VND',
  ) {}

  static create(params: CreateTemplatePriceParams): TemplatePrice {
    if (!Number.isSafeInteger(params.amount) || params.amount < 0) {
      throw new Error(
        'Template price amount must be a non-negative safe integer',
      );
    }

    if (typeof params.currency !== 'string') {
      throw new Error('Template price currency is required');
    }

    const currency = params.currency.trim().toUpperCase();

    if (currency !== 'VND') {
      throw new Error('Template pricing currently supports VND only');
    }

    return new TemplatePrice(params.amount, currency);
  }

  static free(): TemplatePrice {
    return TemplatePrice.create({
      amount: 0,
      currency: 'VND',
    });
  }

  getAmount(): number {
    return this.amount;
  }

  getCurrency(): 'VND' {
    return this.currency;
  }

  isZero(): boolean {
    return this.amount === 0;
  }

  equals(other: TemplatePrice): boolean {
    return this.amount === other.amount && this.currency === other.currency;
  }
}
