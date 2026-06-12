import { HttpException, HttpStatus } from '@nestjs/common';
import { FindWorkspaceServiceImpl } from './find.workspace.service';

describe('FindWorkspaceServiceImpl', () => {
  let service: FindWorkspaceServiceImpl;

  const findWorkspaceRepository = {
    findWorkspacesByUserId: jest.fn(),
    findOneWorkspaceById: jest.fn(),
  };

  beforeEach(() => {
    jest.resetAllMocks();
    service = new FindWorkspaceServiceImpl(findWorkspaceRepository as any);
  });

  it('finds all workspaces by user id', async () => {
    const userId = 'user-123';
    const mockWorkspaces = [{ id: 'workspace-1', name: 'Workspace 1' }];
    
    findWorkspaceRepository.findWorkspacesByUserId.mockResolvedValue(mockWorkspaces);

    const result = await service.findAllByUserId(userId);

    expect(findWorkspaceRepository.findWorkspacesByUserId).toHaveBeenCalledWith(userId);
    expect(result).toEqual(mockWorkspaces);
  });

  it('finds one workspace by workspace id', async () => {
    const userId = 'user-123';
    const workspaceId = 'workspace-123';
    const mockWorkspace = { id: 'workspace-123', name: 'Workspace 1' };
    
    findWorkspaceRepository.findOneWorkspaceById.mockResolvedValue(mockWorkspace);

    const result = await service.findOneByWorkspaceId(userId, workspaceId);

    expect(findWorkspaceRepository.findOneWorkspaceById).toHaveBeenCalledWith(userId, workspaceId);
    expect(result).toEqual(mockWorkspace);
  });

  it('throws NOT_FOUND exception if workspace is not found by id', async () => {
    const userId = 'user-123';
    const workspaceId = 'workspace-123';
    
    findWorkspaceRepository.findOneWorkspaceById.mockResolvedValue(null);

    await expect(service.findOneByWorkspaceId(userId, workspaceId)).rejects.toMatchObject({
      status: HttpStatus.NOT_FOUND,
    });
    
    expect(findWorkspaceRepository.findOneWorkspaceById).toHaveBeenCalledWith(userId, workspaceId);
  });
});
