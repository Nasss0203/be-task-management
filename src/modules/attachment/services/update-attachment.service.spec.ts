import { NotFoundException } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import { ATTACHMENT_TYPES } from '../interfaces/types';
import { UpdateAttachmentServiceImpl } from './update-attachment.service';

describe('UpdateAttachmentServiceImpl', () => {
  let service: UpdateAttachmentServiceImpl;

  const mockFindRepository = {
    findReadyById: jest.fn(),
  };

  const mockUpdateRepository = {
    update: jest.fn(),
  };

  beforeEach(async () => {
    jest.clearAllMocks();

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        UpdateAttachmentServiceImpl,
        {
          provide: ATTACHMENT_TYPES.repositories.FindAttachmentRepository,
          useValue: mockFindRepository,
        },
        {
          provide: ATTACHMENT_TYPES.repositories.UpdateAttachmentRepository,
          useValue: mockUpdateRepository,
        },
      ],
    }).compile();

    service = module.get<UpdateAttachmentServiceImpl>(
      UpdateAttachmentServiceImpl,
    );
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('execute', () => {
    it('should throw NotFoundException if attachment not found', async () => {
      mockFindRepository.findReadyById.mockResolvedValue(null);

      await expect(
        service.execute('att-1', { fileName: 'new.png' }),
      ).rejects.toThrow(NotFoundException);
    });

    it('should call updateRepository.update', async () => {
      mockFindRepository.findReadyById.mockResolvedValue({
        id: 'att-1',
        fileName: 'old.png',
      });
      mockUpdateRepository.update.mockResolvedValue({
        id: 'att-1',
        fileName: 'new.png',
      });

      const result = await service.execute('att-1', { fileName: 'new.png' });

      expect(mockUpdateRepository.update).toHaveBeenCalledWith({
        id: 'att-1',
        fileName: 'new.png',
      });
      expect(result).toEqual({ id: 'att-1', fileName: 'new.png' });
    });
  });
});
