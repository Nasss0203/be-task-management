import { BadRequestException } from '@nestjs/common';
import { PageIntentExtractionService } from './page-intent-extraction.service';
import type { PageIntentExtractor } from './page-intent.port';

describe('PageIntentExtractionService', () => {
  const extract = jest.fn();
  const service = new PageIntentExtractionService({ extract } as PageIntentExtractor);

  beforeEach(() => jest.clearAllMocks());

  it('delegates the raw instruction only', async () => {
    extract.mockResolvedValue({ result: { intent: 'OTHER' } });
    await service.extract('Thêm heading vào page Release 2.0');
    expect(extract).toHaveBeenCalledWith('Thêm heading vào page Release 2.0');
  });

  it.each(['', '  ', 'x'.repeat(4001)])('rejects invalid input', (instruction) => {
    expect(() => service.extract(instruction)).toThrow(BadRequestException);
    expect(extract).not.toHaveBeenCalled();
  });
});
