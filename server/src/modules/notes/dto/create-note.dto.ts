import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsArray,
  IsBoolean,
  IsNotEmpty,
  IsOptional,
  IsString,
} from 'class-validator';

export class CreateNoteDto {
  @ApiProperty({ example: 'Ghi chú cuộc họp', description: 'Tiêu đề note' })
  @IsString()
  @IsNotEmpty()
  title: string;

  @ApiPropertyOptional({
    example: 'Nội dung chi tiết của note...',
    description: 'Nội dung note',
  })
  @IsString()
  @IsOptional()
  content?: string;

  @ApiPropertyOptional({
    example: false,
    default: false,
    description: 'Đánh dấu note đã lưu trữ',
  })
  @IsBoolean()
  @IsOptional()
  isArchived?: boolean;

  @ApiPropertyOptional({
    type: [String],
    example: ['clx123abc', 'clx456def'],
    description: 'Danh sách id của các tag gắn vào note',
  })
  @IsArray()
  @IsString({ each: true })
  @IsOptional()
  tagIds?: string[];
}
