import { Module } from '@nestjs/common';
import { AdmissionController } from './admission.controller';
import { AdmissionService } from './admission.service';
// import { HelpersService } from 'src/helpers/helpers.service';
import { HelpersModule } from 'src/helpers/helpers.module';
import { PrismaService } from 'src/prisma/prisma.service';

@Module({
  imports: [HelpersModule],
  controllers: [AdmissionController],
  providers: [AdmissionService, PrismaService],
  exports: [AdmissionService],
})
export class AdmissionModule {}
