import Decimal from 'decimal.js';

export const POSITION_STEP = new Decimal(1000);
export const POSITION_SCALE = 15;

export function calculatePosition(params: {
  previousPosition: string | null;
  nextPosition: string | null;
}): string {
  const { previousPosition, nextPosition } = params;

  if (!previousPosition && !nextPosition) {
    return POSITION_STEP.toFixed(POSITION_SCALE);
  }

  if (!previousPosition && nextPosition) {
    return new Decimal(nextPosition)
      .minus(POSITION_STEP)
      .toFixed(POSITION_SCALE);
  }

  if (previousPosition && !nextPosition) {
    return new Decimal(previousPosition)
      .plus(POSITION_STEP)
      .toFixed(POSITION_SCALE);
  }

  return new Decimal(previousPosition!)
    .plus(nextPosition!)
    .dividedBy(2)
    .toFixed(POSITION_SCALE);
}

export function hasEnoughPositionGap(params: {
  previousPosition: string;
  nextPosition: string;
}): boolean {
  const gap = new Decimal(params.nextPosition).minus(params.previousPosition);
  const minimumGap = new Decimal(1).dividedBy(
    new Decimal(10).pow(POSITION_SCALE),
  );

  return gap.greaterThan(minimumGap);
}
