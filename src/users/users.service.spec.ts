import { Test, TestingModule } from '@nestjs/testing';
import { NotFoundException, ConflictException } from '@nestjs/common';
import { UsersService } from './users.service';
import { UsersRepository } from './repositories/users.repository';
import { CreateUserDto } from './dto/create-user.dto';

const mockUsersRepository = {
  findAll: jest.fn(),
  findOne: jest.fn(),
  findByEmail: jest.fn(),
  create: jest.fn(),
  update: jest.fn(),
  remove: jest.fn(),
};

describe('UsersService', () => {
  let service: UsersService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        UsersService,
        { provide: UsersRepository, useValue: mockUsersRepository },
      ],
    }).compile();

    service = module.get<UsersService>(UsersService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('findAll', () => {
    it('should return an array of users', async () => {
      const users = [{ id: 1, name: 'Test', email: 'test@test.com' }];
      mockUsersRepository.findAll.mockResolvedValue(users);

      const result = await service.findAll();

      expect(result).toEqual(users);
      expect(mockUsersRepository.findAll).toHaveBeenCalled();
    });
  });

  describe('findOne', () => {
    it('should return a user when found', async () => {
      const user = { id: 1, name: 'Test', email: 'test@test.com' };
      mockUsersRepository.findOne.mockResolvedValue(user);

      const result = await service.findOne(1);

      expect(result).toEqual(user);
      expect(mockUsersRepository.findOne).toHaveBeenCalledWith(1);
    });

    it('should throw NotFoundException when user not found', async () => {
      mockUsersRepository.findOne.mockResolvedValue(null);

      await expect(service.findOne(999)).rejects.toThrow(NotFoundException);
    });
  });

  describe('create', () => {
    it('should create and return a user', async () => {
      const dto: CreateUserDto = { name: 'Test', email: 'test@test.com' };
      const user = { id: 1, ...dto };
      mockUsersRepository.findByEmail.mockResolvedValue(null);
      mockUsersRepository.create.mockResolvedValue(user);

      const result = await service.create(dto);

      expect(result).toEqual(user);
      expect(mockUsersRepository.create).toHaveBeenCalledWith(dto);
    });

    it('should throw ConflictException when email exists', async () => {
      const dto: CreateUserDto = { name: 'Test', email: 'test@test.com' };
      mockUsersRepository.findByEmail.mockResolvedValue({ id: 1, ...dto });

      await expect(service.create(dto)).rejects.toThrow(ConflictException);
    });
  });

  describe('update', () => {
    it('should update and return a user', async () => {
      const dto = { name: 'Updated' };
      const user = { id: 1, name: 'Updated', email: 'test@test.com' };
      mockUsersRepository.findOne.mockResolvedValue({
        id: 1,
        name: 'Test',
        email: 'test@test.com',
      });
      mockUsersRepository.update.mockResolvedValue(user);

      const result = await service.update(1, dto);

      expect(result).toEqual(user);
      expect(mockUsersRepository.update).toHaveBeenCalledWith(1, dto);
    });

    it('should throw NotFoundException when user not found', async () => {
      mockUsersRepository.findOne.mockResolvedValue(null);

      await expect(service.update(999, { name: 'Updated' })).rejects.toThrow(
        NotFoundException,
      );
    });
  });

  describe('remove', () => {
    it('should remove and return the user', async () => {
      const user = { id: 1, name: 'Test', email: 'test@test.com' };
      mockUsersRepository.findOne.mockResolvedValue(user);
      mockUsersRepository.remove.mockResolvedValue(user);

      const result = await service.remove(1);

      expect(result).toEqual(user);
      expect(mockUsersRepository.remove).toHaveBeenCalledWith(1);
    });

    it('should throw NotFoundException when user not found', async () => {
      mockUsersRepository.findOne.mockResolvedValue(null);

      await expect(service.remove(999)).rejects.toThrow(NotFoundException);
    });
  });
});
