import { ApiProperty } from '@nestjs/swagger';
import { Expose } from 'class-transformer';

export class UserResponseDto {
  @ApiProperty({
    description: 'Unique identifier of the user',
    example: 1,
  })
  @Expose()
  id!: number;

  @ApiProperty({
    description: 'The name of the user',
    example: 'John Doe',
  })
  @Expose()
  name!: string;

  @ApiProperty({
    description: 'The email address of the user',
    example: 'john@example.com',
  })
  @Expose()
  email!: string;

  @ApiProperty({
    description: 'Date when the user was created',
    example: '2026-01-15T12:00:00.000Z',
  })
  @Expose()
  createdAt!: Date;

  @ApiProperty({
    description: 'Date when the user was last updated',
    example: '2026-01-15T12:00:00.000Z',
  })
  @Expose()
  updatedAt!: Date;
}
