import { HttpException } from '@nestjs/common';
export declare class PaymentRequiredException extends HttpException {
    constructor(message?: string);
}
