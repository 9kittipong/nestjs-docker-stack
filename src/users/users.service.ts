import {
  Injectable,
  NotFoundException,
  ConflictException,
  Logger,
} from '@nestjs/common';
import { CreateUserDto } from './dto/create-user.dto';
import { UpdateUserDto } from './dto/update-user.dto';
import { UsersRepository } from './repositories/users.repository';

@Injectable()
export class UsersService {
  private readonly logger = new Logger(UsersService.name);

  constructor(private readonly usersRepository: UsersRepository) {}

  async findAll() {
    this.logger.log('Fetching all users');
    return this.usersRepository.findAll();
  }

  async findOne(id: number) {
    const user = await this.usersRepository.findOne(id);
    if (!user) {
      throw new NotFoundException(`User with ID ${id} not found`);
    }
    return user;
  }

  async create(dto: CreateUserDto) {
    const existing = await this.usersRepository.findByEmail(dto.email);
    if (existing) {
      throw new ConflictException('Email already registered');
    }

    this.logger.log('Creating user', { email: dto.email });
    return this.usersRepository.create(dto);
  }

  async update(id: number, dto: UpdateUserDto) {
    const existingUser = await this.findOne(id);

    if (dto.email) {
      const existingEmail = await this.usersRepository.findByEmail(dto.email);
      if (existingEmail && existingEmail.id !== existingUser.id) {
        throw new ConflictException('Email already registered');
      }
    }

    this.logger.log('Updating user', { id });
    return this.usersRepository.update(id, dto);
  }

  async remove(id: number) {
    await this.findOne(id);
    this.logger.log('Removing user', { id });
    return this.usersRepository.remove(id);
  }
}
