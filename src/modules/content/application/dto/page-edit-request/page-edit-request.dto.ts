import { PageEditRequestStatus } from 'src/modules/content/domain/constants/page-edit-request-status.constant';
import { PageEditRequest } from 'src/modules/content/domain/entities/page-edit-request.entity';

export class PageEditRequestDto {
  id: string;
  pageId: string;
  pageShareId: string;
  userId: string;
  status: PageEditRequestStatus;
  reviewedBy: string | null;
  reviewedAt: Date | null;
  createdAt: Date;
  updatedAt: Date;

  static fromDomain(request: PageEditRequest): PageEditRequestDto {
    return {
      id: request.getId(),
      pageId: request.getPageId(),
      pageShareId: request.getPageShareId(),
      userId: request.getUserId(),
      status: request.getStatus(),
      reviewedBy: request.getReviewedBy(),
      reviewedAt: request.getReviewedAt(),
      createdAt: request.getCreatedAt(),
      updatedAt: request.getUpdatedAt(),
    };
  }
}
