import { BadRequestException, Controller, Get, Query } from '@nestjs/common';

import { PaymentService } from './payment.service';

@Controller('payments')
export class PaymentController {
  constructor(private readonly paymentService: PaymentService) {}

  @Get('verify-transaction')
  async verifyTransaction(@Query('reference') reference: string) {
    if (!reference) {
      throw new BadRequestException('Query parameter "reference" is required');
    }
    return this.paymentService.verifyTransaction(reference);
  }
}
