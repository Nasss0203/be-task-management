import { Test, TestingModule } from '@nestjs/testing';
import { RolePermissionController } from './role_permission.controller';
import { RolePermissionService } from '../role_permission.service';

describe('RolePermissionController', () => {
  let controller: RolePermissionController;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [RolePermissionController],
      providers: [
        {
          provide: RolePermissionService,
          useValue: {},
        },
      ],
    }).compile();

    controller = module.get<RolePermissionController>(RolePermissionController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });
});
