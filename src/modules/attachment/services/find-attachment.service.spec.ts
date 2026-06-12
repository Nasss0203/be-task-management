import { Test, TestingModule } from '@nestjs/testing';
import { ATTACHMENT_TYPES } from '../interfaces/types';
import { FindAttachmentServiceImpl } from './find-attachment.service';

describe('FindAttachmentServiceImpl', () => {
  let service: FindAttachmentServiceImpl;

  const mockRepository = {
    findReadyById: jest.fn(),
    findByTask: jest.fn(),
  };

  beforeEach(async () => {
    jest.clearAllMocks();

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        FindAttachmentServiceImpl,
        {
          provide: ATTACHMENT_TYPES.repositories.FindAttachmentRepository,
          useValue: mockRepository,
        },
      ],
    }).compile();

    service = module.get<FindAttachmentServiceImpl>(FindAttachmentServiceImpl);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('findReadyById', () => {
    it('should return attachment', async () => {
      mockRepository.findReadyById.mockResolvedValue({ id: 'att-1' });

      const result = await service.findReadyById('att-1');

      expect(mockRepository.findReadyById).toHaveBeenCalledWith('att-1');
      expect(result).toEqual({ id: 'att-1' });
    });
  });

  describe('findByTask', () => {
    it('should return attachments by task', async () => {
      mockRepository.findByTask.mockResolvedValue([{ id: 'att-1' }]);

      const result = await service.findByTask('task-1');

      expect(mockRepository.findByTask).toHaveBeenCalledWith('task-1');
      expect(result).toEqual([{ id: 'att-1' }]);
    });
  });
});
