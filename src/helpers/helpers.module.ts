import { Module } from '@nestjs/common';
import { HelpersService } from './helpers.service';

@Module({
  imports: [],
  controllers: [],
  providers: [HelpersService],
  exports: [HelpersService],
})
export class HelpersModule {}
