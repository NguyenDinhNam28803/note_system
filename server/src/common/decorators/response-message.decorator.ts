import { SetMetadata } from '@nestjs/common';

export const RESPONSE_MESSAGE_KEY = 'response_message';

/**
 * Đặt message tuỳ biến cho response thành công của một route.
 *
 * @example
 * @ResponseMessage('Tạo note thành công')
 * @Post()
 * create() { ... }
 */
export const ResponseMessage = (message: string) =>
  SetMetadata(RESPONSE_MESSAGE_KEY, message);
