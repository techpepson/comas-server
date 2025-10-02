import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { ApplicationModule } from './application/application.module';
import configuration from './config/configuration';
import { PaymentModule } from './payment/payment.module';
// import { PaymentModule } from './payment/payment.module';

@Module({
  imports: [
    ApplicationModule,
    PaymentModule,
    ConfigModule.forRoot({ isGlobal: true, load: [configuration] }),
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
