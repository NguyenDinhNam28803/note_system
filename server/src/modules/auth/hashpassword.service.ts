import { Injectable } from '@nestjs/common';
import * as bcrypt from 'bcrypt';

/**
 * Băm và so sánh mật khẩu bằng bcrypt.
 */
@Injectable()
export class HashPasswordService {
  private readonly saltRounds = 10;

  /** Băm mật khẩu dạng plain text trước khi lưu vào DB. */
  hash(plain: string): Promise<string> {
    return bcrypt.hash(plain, this.saltRounds);
  }

  /** So sánh mật khẩu nhập vào với hash đã lưu. */
  compare(plain: string, hashed: string): Promise<boolean> {
    return bcrypt.compare(plain, hashed);
  }
}
