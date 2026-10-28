export class CreatePageAccessRequestCommand {
  constructor(
    public readonly userId: string,
    public readonly pageId: string,
    public readonly token?: string,
    public readonly site?: { subdomain: string; path: string },
    /** `edit`: xin quyền sửa (site luôn là sửa). Mặc định xin quyền xem. */
    public readonly intent: 'view' | 'edit' = 'view',
  ) {}
}
