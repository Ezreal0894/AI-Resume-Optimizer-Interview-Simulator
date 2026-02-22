/**
 * 402 Payment Required 异常
 * 用于积分不足等付费相关错误
 */
import { HttpException, HttpStatus } from '@nestjs/common';

export class PaymentRequiredException extends HttpException {
  constructor(message: string = '积分不足，请充值') {
    super(
      {
        statusCode: HttpStatus.PAYMENT_REQUIRED,
        message,
        error: 'Payment Required',
      },
      HttpStatus.PAYMENT_REQUIRED,
    );
  }
}
