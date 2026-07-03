import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsString, MaxLength } from 'class-validator';

export class CreateTagDto {
  @ApiProperty({ example: 'công việc', description: 'Tên tag (duy nhất)' })
  @IsString()
  @IsNotEmpty()
  @MaxLength(50)
  name: string;
}
