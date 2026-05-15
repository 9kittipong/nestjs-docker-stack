import { ApiProperty } from '@nestjs/swagger';

export class HealthResponseDto {
  @ApiProperty({
    description: 'Health status of the application',
    example: 'ok',
  })
  status: string;

  @ApiProperty({
    description: 'Timestamp of the health check',
    example: '2026-01-15T12:00:00.000Z',
  })
  timestamp: string;
}
