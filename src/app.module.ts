import { AdmissionModule } from './admission/admission.module';
import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { ApplicationModule } from './application/application.module';
import configuration from './config/configuration';
import { HelpersModule } from './helpers/helpers.module';
import { PaymentModule } from './payment/payment.module';
import { MulterModule } from '@nestjs/platform-express';
import { memoryStorage } from 'multer';

@Module({
  imports: [
    AdmissionModule,
    HelpersModule,
    MulterModule.register({
      storage: memoryStorage(),
      limits: {
        fileSize: 1024 * 1024 * 5,
      },
    }),
    ApplicationModule,
    PaymentModule,
    ConfigModule.forRoot({ isGlobal: true, load: [configuration] }),
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
