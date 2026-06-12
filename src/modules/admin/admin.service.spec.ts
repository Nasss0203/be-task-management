import { Test, TestingModule } from '@nestjs/testing';
import { AdminService } from './admin.service';

describe('AdminService', () => {
  let service: AdminService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [AdminService],
    }).compile();

    service = module.get<AdminService>(AdminService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  it('create should return string', () => {
    expect(service.create({} as any)).toEqual('This action adds a new admin');
  });

  it('findAll should return string', () => {
    expect(service.findAll()).toEqual('This action returns all admin');
  });

  it('findOne should return string', () => {
    expect(service.findOne(1)).toEqual('This action returns a #1 admin');
  });

  it('update should return string', () => {
    expect(service.update(1, {} as any)).toEqual('This action updates a #1 admin');
  });

  it('remove should return string', () => {
    expect(service.remove(1)).toEqual('This action removes a #1 admin');
  });
});
