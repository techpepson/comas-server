import {
  BadRequestException,
  Controller,
  Get,
  Post,
  Query,
  Req,
  Res,
} from '@nestjs/common';

import { PaymentService } from './payment.service';
import { Request, Response } from 'express';
import { ConfigService } from '@nestjs/config';
import { HttpService } from '@nestjs/axios';
import * as crypto from 'crypto';
import { PrismaService } from 'src/prisma/prisma.service';
import { HelpersService } from 'src/helpers/helpers.service';
import { MailerService } from '@nestjs-modules/mailer';

type PaystackWebhookPayload = {
  event?: string;
  data?: {
    reference?: string;
    customer?: {
      email?: string;
    };
  };
};

@Controller('payments')
export class PaymentController {
  constructor(
    private readonly paymentService: PaymentService,
    private configService: ConfigService,
    private httpService: HttpService,
    private prisma: PrismaService,
    private helper: HelpersService,
    private readonly mailer: MailerService,
  ) {}

  @Get('verify-transaction')
  async verifyTransaction(@Query('reference') reference: string) {
    if (!reference) {
      throw new BadRequestException('Query parameter "reference" is required');
    }
    return this.paymentService.verifyTransaction(reference);
  }

  @Post('webhooks/paystack')
  async handleWebhook(@Req() req: Request, @Res() res: Response) {
    const secret = this.configService.get<string>('paystackSecretKey');
    if (!secret) throw new Error('Paystack secret key not found');

    const maybeRawBody: unknown = (req as unknown as { rawBody?: unknown })
      .rawBody;

    const rawBody: Buffer = Buffer.isBuffer(maybeRawBody)
      ? maybeRawBody
      : Buffer.from(JSON.stringify(req.body));

    const hash = crypto
      .createHmac('sha512', secret)
      .update(rawBody)
      .digest('hex');

    const payload = req.body as PaystackWebhookPayload;

    // Verify Paystack signature
    if (hash !== req.headers['x-paystack-signature']) {
      return res.status(400).send('Invalid signature');
    }

    // Process only charge.success events
    if (payload?.event === 'charge.success') {
      const reference: string | undefined = payload?.data?.reference;

      if (!reference) {
        return res.status(400).send('Missing reference');
      }

      // Verify transaction via Paystack
      const verifyTransaction =
        await this.paymentService.verifyTransaction(reference);

      if (
        (verifyTransaction?.data as { status?: unknown } | undefined)
          ?.status === true
      ) {
        const payment = await this.prisma.payment.findUnique({
          where: { reference },
          include: { applicant: true },
        });

        if (!payment) {
          console.warn(`No payment found for reference: ${reference}`);
          return res.status(404).send('Payment not found');
        }

        await this.prisma.payment.update({
          where: { reference },
          data: {
            status: 'success',
            paidAt: payment.paidAt ?? new Date(),
            provider: 'paystack',
          },
        });

        const clientUrl = process.env.CLIENT_URL;

        //send an email to the user for their application
        await this.mailer.sendMail({
          to: payment.applicant.email,
          subject: 'Your Application Payment was Successful',
          template: 'verification-success', // views/emails/verification-success.hbs
          context: {
            name: payment.applicant.firstName,
            link: `${clientUrl}/?user=${payment.applicant.id}&applicantType=${payment.applicant.applicantType}`, // 👈 your actual app link
          },
        });
        console.log(
          '✅ Payment verified and updated:',
          payment.applicant.email,
        );
        return res.status(200).send('success');
      }
    }

    return res.status(200).send('ok');
  }
}
