"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.PaymentRequiredException = void 0;
const common_1 = require("@nestjs/common");
class PaymentRequiredException extends common_1.HttpException {
    constructor(message = '积分不足，请充值') {
        super({
            statusCode: common_1.HttpStatus.PAYMENT_REQUIRED,
            message,
            error: 'Payment Required',
        }, common_1.HttpStatus.PAYMENT_REQUIRED);
    }
}
exports.PaymentRequiredException = PaymentRequiredException;
//# sourceMappingURL=payment-required.exception.js.map