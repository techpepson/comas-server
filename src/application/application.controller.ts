import { Controller, Post, Body } from '@nestjs/common';
import { ApplicationService } from './application.service';
import CreateApplicationDto from 'src/dto/create-application.dto';

@Controller('applications')
export class ApplicationController {
  constructor(private applicationService: ApplicationService) {}

  @Post('create-application')
  async createApplication(@Body() createApplicationDto: CreateApplicationDto) {
    const applicationService =
      await this.applicationService.createApplication(createApplicationDto);
    return applicationService;
  }
}
