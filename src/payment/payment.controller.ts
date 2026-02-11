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
    const secret = this.configService.get('paystackSecretKey');
    if (!secret) throw new Error('Paystack secret key not found');

    const hash = crypto
      .createHmac('sha512', secret)
      .update(JSON.stringify(req.body))
      .digest('hex');

    const payload = req.body;

    // Verify Paystack signature
    if (hash !== req.headers['x-paystack-signature']) {
      return res.status(400).send('Invalid signature');
    }

    // Process only charge.success events
    if (payload?.event === 'charge.success') {
      const reference = payload?.data?.reference;
      const email = payload?.data?.customer?.email;

      // Verify transaction via Paystack
      const verifyTransaction =
        await this.paymentService.verifyTransaction(reference);

      if (verifyTransaction?.data?.status === true) {
        const user = await this.prisma.applicantData.findFirst({
          where: { email },
          include: { payment: true },
        });

        if (!user) {
          console.warn(`No applicant found for email: ${email}`);
          return res.status(404).send('Applicant not found');
        }

        // Update payment record (by reference)
        await this.prisma.payment.updateMany({
          where: {
            applicant: {
              email,
            },
          },
          data: {
            status: 'success',
            paidAt: new Date(),
            provider: 'paystack',
          },
        });

        const clientUrl = process.env.CLIENT_URL;

        //send an email to the user for their application
        await this.mailer.sendMail({
          to: user.email,
          subject: 'Your Application Payment was Successful',
          template: 'verification-success', // views/emails/verification-success.hbs
          context: {
            name: user.firstName,
            link: `${clientUrl}/?user=${user.id}&applicantType=${user.applicantType}`, // 👈 your actual app link
          },
        });
        console.log(user.email);

        console.log('✅ Payment verified and applicant updated:', user.email);
        return res.status(200).send('success');
      }
    }
  }
}
