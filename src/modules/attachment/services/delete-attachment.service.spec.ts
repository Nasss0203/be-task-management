import { Test, TestingModule } from '@nestjs/testing';
import { ATTACHMENT_TYPES } from '../interfaces/types';
import { DeleteAttachmentServiceImpl } from './delete-attachment.service';

describe('DeleteAttachmentServiceImpl', () => {
  let service: DeleteAttachmentServiceImpl;

  const mockRepository = {
    delete: jest.fn(),
  };

  beforeEach(async () => {
    jest.clearAllMocks();

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        DeleteAttachmentServiceImpl,
        {
          provide: ATTACHMENT_TYPES.repositories.DeleteAttachmentRepository,
          useValue: mockRepository,
        },
      ],
    }).compile();

    service = module.get<DeleteAttachmentServiceImpl>(
      DeleteAttachmentServiceImpl,
    );
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('execute', () => {
    it('should call repository.delete', async () => {
      await service.execute('att-1');

      expect(mockRepository.delete).toHaveBeenCalledWith('att-1');
    });
  });
});
