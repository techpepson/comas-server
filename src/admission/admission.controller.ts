import {
  Controller,
  Post,
  UseInterceptors,
  UploadedFiles,
  Body,
  Query,
} from '@nestjs/common';
import { AdmissionService } from './admission.service';
// import AdmissionDTO from 'src/dto/admission.dto';
import { FileFieldsInterceptor } from '@nestjs/platform-express';
import AdmissionDTO from 'src/dto/admission.dto';

@Controller('admissions')
export class AdmissionController {
  constructor(private readonly admissionService: AdmissionService) {}

  @Post('create-admission')
  @UseInterceptors(
    FileFieldsInterceptor([
      {
        name: 'supportingDocument',
        maxCount: 1,
      },
      {
        name: 'passportPhoto',
        maxCount: 1,
      },
      {
        name: 'idCardPhoto',
        maxCount: 1,
      },
      {
        name: 'declarationDocument',
        maxCount: 1,
      },
      {
        name: 'supportingSponsorDocument',
        maxCount: 1,
      },
      {
        name: 'consentLetterFromSponsor',
        maxCount: 1,
      },
      {
        name: 'supportingCertificates',
        maxCount: 10,
      },
    ]),
  )
  async createAdmission(
    @Body()
    admissionDto: AdmissionDTO,
    @Query('user') user: string,
    @UploadedFiles()
    files: {
      supportingDocument: Express.Multer.File[];
      passportPhoto: Express.Multer.File[];
      idCardPhoto: Express.Multer.File[];
      declarationDocument?: Express.Multer.File[];
      supportingSponsorDocument?: Express.Multer.File[];
      consentLetterFromSponsor?: Express.Multer.File[];
      supportingCertificates: Express.Multer.File[];
    },
  ) {
    return this.admissionService.createAdmission(files, admissionDto, user);
  }
}
