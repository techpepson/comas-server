import { Module } from '@nestjs/common';
import { HttpModule } from '@nestjs/axios';
import { AdmissionController } from './admission.controller';
import { AdmissionService } from './admission.service';
// import { HelpersService } from 'src/helpers/helpers.service';
import { HelpersModule } from 'src/helpers/helpers.module';
import { PrismaService } from 'src/prisma/prisma.service';

@Module({
  imports: [HelpersModule, HttpModule],
  controllers: [AdmissionController],
  providers: [AdmissionService, PrismaService],
  exports: [AdmissionService],
})
export class AdmissionModule {}
