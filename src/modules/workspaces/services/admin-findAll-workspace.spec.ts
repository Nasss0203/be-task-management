import { AdminFindAllWorkspaceServiceImpl } from './admin-findAll-workspace.service';

describe('AdminFindAllWorkspaceServiceImpl', () => {
  let service: AdminFindAllWorkspaceServiceImpl;

  const adminFindAllWorkspaceRepository = {
    findAllWorkspace: jest.fn(),
  };

  beforeEach(() => {
    jest.resetAllMocks();
    service = new AdminFindAllWorkspaceServiceImpl(
      adminFindAllWorkspaceRepository as any,
    );
  });

  it('finds all workspace with given filter', async () => {
    const filter = { page: 1, limit: 10 };
    const mockResponse = {
      items: [],
      meta: { total: 0, page: 1, limit: 10, totalPages: 0 },
    };

    adminFindAllWorkspaceRepository.findAllWorkspace.mockResolvedValue(
      mockResponse,
    );

    const result = await service.findAllWorkspace(filter as any);

    expect(
      adminFindAllWorkspaceRepository.findAllWorkspace,
    ).toHaveBeenCalledWith(filter, undefined);
    expect(result).toEqual(mockResponse);
  });

  it('finds all workspace with given filter and manager', async () => {
    const filter = { page: 1, limit: 10 };
    const manager = {} as any;
    const mockResponse = {
      items: [],
      meta: { total: 0, page: 1, limit: 10, totalPages: 0 },
    };

    adminFindAllWorkspaceRepository.findAllWorkspace.mockResolvedValue(
      mockResponse,
    );

    const result = await service.findAllWorkspace(filter as any, manager);

    expect(
      adminFindAllWorkspaceRepository.findAllWorkspace,
    ).toHaveBeenCalledWith(filter, manager);
    expect(result).toEqual(mockResponse);
  });
});
