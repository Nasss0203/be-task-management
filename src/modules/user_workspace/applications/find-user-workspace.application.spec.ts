import { Test, TestingModule } from '@nestjs/testing';
import { USER_WORKSPACE_TYPES } from '../interfaces/types';
import { FindAllMemberApplicationImpl } from './find-user-workspace.application';

describe('FindAllMemberApplicationImpl', () => {
  let app: FindAllMemberApplicationImpl;

  const mockFindMemberService = {
    findAllMember: jest.fn(),
    findMemberInWorkspace: jest.fn(),
  };

  beforeEach(async () => {
    jest.clearAllMocks();

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        FindAllMemberApplicationImpl,
        {
          provide: USER_WORKSPACE_TYPES.services.FindMemberService,
          useValue: mockFindMemberService,
        },
      ],
    }).compile();

    app = module.get<FindAllMemberApplicationImpl>(FindAllMemberApplicationImpl);
  });

  it('should be defined', () => {
    expect(app).toBeDefined();
  });

  describe('findAllMember', () => {
    it('should return mapped members', async () => {
      const mockMember = { id: 'm-1', user: { id: 'u-1', email: 'a@a.com', full_name: 'A', avatar_url: '' }, joined_at: new Date() } as any;
      mockFindMemberService.findAllMember.mockResolvedValue([mockMember]);

      const result = await app.findAllMember('ws-1');

      expect(mockFindMemberService.findAllMember).toHaveBeenCalledWith('ws-1');
      expect(Array.isArray(result)).toBe(true);
      expect(result[0]).toHaveProperty('id', 'm-1');
    });
  });

  describe('findMemberInWorkspace', () => {
    it('should return mapped member if found', async () => {
      const mockMember = { id: 'm-1', user: { id: 'u-1', email: 'a@a.com', full_name: 'A', avatar_url: '' }, joined_at: new Date() } as any;
      mockFindMemberService.findMemberInWorkspace.mockResolvedValue(mockMember);

      const result = await app.findMemberInWorkspace('ws-1', 'u-1');

      expect(mockFindMemberService.findMemberInWorkspace).toHaveBeenCalledWith('ws-1', 'u-1');
      expect(result).toHaveProperty('id', 'm-1');
    });

    it('should return null if not found', async () => {
      mockFindMemberService.findMemberInWorkspace.mockResolvedValue(null);

      const result = await app.findMemberInWorkspace('ws-1', 'u-1');

      expect(result).toBeNull();
    });
  });
});
