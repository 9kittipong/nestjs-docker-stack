import { Injectable, Inject } from '@nestjs/common';
import { NodePgDatabase } from 'drizzle-orm/node-postgres';
import { eq } from 'drizzle-orm';
import { DRIZZLE } from '../database/database.provider';
import * as schema from '../database/schema';
import { users } from '../database/schema/users';
import { CreateUserDto } from './dto/create-user.dto';
import { UpdateUserDto } from './dto/update-user.dto';

@Injectable()
export class UsersService {
  constructor(@Inject(DRIZZLE) private db: NodePgDatabase<typeof schema>) {}

  async findAll() {
    return this.db.select().from(users);
  }

  async findOne(id: number) {
    const [user] = await this.db.select().from(users).where(eq(users.id, id));
    return user ?? null;
  }

  async create(dto: CreateUserDto) {
    const [user] = await this.db.insert(users).values(dto).returning();
    return user;
  }

  async update(id: number, dto: UpdateUserDto) {
    const [user] = await this.db
      .update(users)
      .set(dto)
      .where(eq(users.id, id))
      .returning();
    return user ?? null;
  }

  async remove(id: number) {
    const [user] = await this.db
      .delete(users)
      .where(eq(users.id, id))
      .returning();
    return user ?? null;
  }
}
