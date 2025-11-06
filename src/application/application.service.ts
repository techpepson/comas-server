import { Injectable, InternalServerErrorException } from '@nestjs/common';
import CreateApplicationDto from 'src/dto/create-application.dto';
import { PaymentService } from 'src/payment/payment.service';
import { PrismaService } from 'src/prisma/prisma.service';

@Injectable()
export class ApplicationService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly paymentService: PaymentService,
  ) {}

  async createApplication(createApplicationDto: CreateApplicationDto) {
    try {
      //initialize payment right after user submits data
      const paymentData: any = await this.paymentService.initializeTransaction(
        createApplicationDto.email,
        createApplicationDto.applicantType,
      );
      console.log(paymentData);
      if (paymentData.status === true) {
        await this.prisma.applicantData.create({
          data: {
            firstName: createApplicationDto.firstName,
            lastName: createApplicationDto.lastName,
            middleName: createApplicationDto.middleName || '',
            email: createApplicationDto.email,
            phoneNumber: createApplicationDto.phoneNumber,
            nationality: createApplicationDto.nationality,
            message: createApplicationDto.message,
            applicantType: createApplicationDto.applicantType,
            payment: {
              create: {
                reference: paymentData.data.reference,
                amount:
                  createApplicationDto.applicantType == 'Undergraduate'
                    ? 200
                    : 300,
              },
            },
          },
        });

        return {
          message: 'Your application request has been submitted successfully',
          success: true,
          paymentData,
        };
      } else {
        return;
      }
    } catch (error) {
      if (error instanceof InternalServerErrorException) {
        return {
          message:
            'Your application request has failed due to an internal error',
          success: false,
          error: error.message,
        };
      }
      if (error instanceof Error) {
        return {
          message: 'Your application request has failed',
          success: false,
          error: error.message,
        };
      }
      return {
        message: 'Your application request has failed',
        success: false,
        error,
      };
    }
  }
}
