import { Test, TestingModule } from '@nestjs/testing';
import { ATTACHMENT_TYPES } from '../interfaces/types';
import { AttachmentMapper } from '../mapper/attachment.mapper';
import { UpdateAttachmentApplicationImpl } from './update-attachment.application';

describe('UpdateAttachmentApplicationImpl', () => {
  let app: UpdateAttachmentApplicationImpl;

  const mockUpdateAttachmentService = {
    execute: jest.fn(),
  };

  beforeEach(async () => {
    jest.clearAllMocks();

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        UpdateAttachmentApplicationImpl,
        {
          provide: ATTACHMENT_TYPES.services.UpdateAttachmentService,
          useValue: mockUpdateAttachmentService,
        },
      ],
    }).compile();

    app = module.get<UpdateAttachmentApplicationImpl>(
      UpdateAttachmentApplicationImpl,
    );
  });

  it('should be defined', () => {
    expect(app).toBeDefined();
  });

  describe('execute', () => {
    it('should call updateService.execute and return mapped response', async () => {
      mockUpdateAttachmentService.execute.mockResolvedValue({ id: 'att-1' });

      const originalMapper = AttachmentMapper.toResponse;
      AttachmentMapper.toResponse = jest.fn().mockReturnValue({ mapped: true });

      const result = await app.execute(
        'att-1',
        { fileName: 'new.png' },
        'user-1',
      );

      expect(mockUpdateAttachmentService.execute).toHaveBeenCalledWith(
        'att-1',
        { fileName: 'new.png' },
      );
      expect(result).toEqual({ mapped: true });

      AttachmentMapper.toResponse = originalMapper;
    });
  });
});
