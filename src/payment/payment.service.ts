import { HttpService } from '@nestjs/axios';
import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { firstValueFrom } from 'rxjs';

@Injectable()
export class PaymentService {
  constructor(
    private httpService: HttpService,
    private configService: ConfigService,
  ) {}

  async initializeTransaction(email: string) {
    const params = {
      email,
      amount: '20000',
    };

    const paystackSecretKey: string | undefined =
      this.configService.get('paystackSecretKey');

    if (!paystackSecretKey) {
      throw new Error('Paystack secret key not found');
    }

    // make request to paystack
    const response = await firstValueFrom(
      this.httpService.post(
        'https://api.paystack.co/transaction/initialize',
        params,
        {
          headers: {
            Authorization: `Bearer ${paystackSecretKey}`,
            'Content-Type': 'application/json',
          },
        },
      ),
    );

    return response.data;
  }

  async verifyTransaction(reference: string) {
    const payStackSecretKey: string | undefined =
      this.configService.get('paystackSecretKey');

    if (!payStackSecretKey) {
      throw new Error('Paystack secret key not found');
    }

    // make request to paystack
    const response = await firstValueFrom(
      this.httpService.get(
        `https://api.paystack.co/transaction/verify/${reference}`,
        {
          headers: {
            Authorization: `Bearer ${payStackSecretKey}`,
            'Content-Type': 'application/json',
          },
        },
      ),
    );

    return {
      data: response.data,
      customerEmail: response.data?.data?.customer?.email,
    };
  }
}
