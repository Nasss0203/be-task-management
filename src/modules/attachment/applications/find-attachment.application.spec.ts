import { Test, TestingModule } from '@nestjs/testing';
import { ATTACHMENT_TYPES } from '../interfaces/types';
import { AttachmentMapper } from '../mapper/attachment.mapper';
import { FindAttachmentApplicationImpl } from './find-attachment.application';

describe('FindAttachmentApplicationImpl', () => {
  let app: FindAttachmentApplicationImpl;

  const mockFindAttachmentService = {
    findByTask: jest.fn(),
  };

  beforeEach(async () => {
    jest.clearAllMocks();

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        FindAttachmentApplicationImpl,
        {
          provide: ATTACHMENT_TYPES.services.FindAttachmentService,
          useValue: mockFindAttachmentService,
        },
      ],
    }).compile();

    app = module.get<FindAttachmentApplicationImpl>(
      FindAttachmentApplicationImpl,
    );
  });

  it('should be defined', () => {
    expect(app).toBeDefined();
  });

  describe('findByTask', () => {
    it('should map and return attachments', async () => {
      mockFindAttachmentService.findByTask.mockResolvedValue([{ id: 'att-1' }]);

      const originalMapper = AttachmentMapper.toResponse;
      AttachmentMapper.toResponse = jest.fn().mockReturnValue({ mapped: true });

      const result = await app.findByTask('task-1');

      expect(mockFindAttachmentService.findByTask).toHaveBeenCalledWith(
        'task-1',
      );
      expect(result).toEqual([{ mapped: true }]);

      AttachmentMapper.toResponse = originalMapper;
    });
  });
});
