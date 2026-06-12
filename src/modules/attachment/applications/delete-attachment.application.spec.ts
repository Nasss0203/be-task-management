import { Test, TestingModule } from '@nestjs/testing';
import { ATTACHMENT_TYPES } from '../interfaces/types';
import { DeleteAttachmentApplicationImpl } from './delete-attachment.application';

describe('DeleteAttachmentApplicationImpl', () => {
  let app: DeleteAttachmentApplicationImpl;

  const mockDeleteAttachmentService = {
    execute: jest.fn(),
  };

  beforeEach(async () => {
    jest.clearAllMocks();

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        DeleteAttachmentApplicationImpl,
        {
          provide: ATTACHMENT_TYPES.services.DeleteAttachmentService,
          useValue: mockDeleteAttachmentService,
        },
      ],
    }).compile();

    app = module.get<DeleteAttachmentApplicationImpl>(
      DeleteAttachmentApplicationImpl,
    );
  });

  it('should be defined', () => {
    expect(app).toBeDefined();
  });

  describe('execute', () => {
    it('should call deleteService.execute', async () => {
      await app.execute('att-1', 'user-1');

      expect(mockDeleteAttachmentService.execute).toHaveBeenCalledWith('att-1');
    });
  });
});
