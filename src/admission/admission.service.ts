import {
  BadRequestException,
  ConflictException,
  Injectable,
  InternalServerErrorException,
} from '@nestjs/common';
import AdmissionDTO from 'src/dto/admission.dto';

// import AdmissionDTO from 'src/dto/admission.dto';
import { HelpersService } from 'src/helpers/helpers.service';
import { PrismaService } from 'src/prisma/prisma.service';

@Injectable()
export class AdmissionService {
  constructor(
    private helpersService: HelpersService,
    private prisma: PrismaService,
  ) {}

  //use an array of Express.Multer for multiple uploads, even for single file upload items
  async createAdmission(
    files: {
      supportingDocument?: Express.Multer.File[];
      passportPhoto?: Express.Multer.File[];
      idCardPhoto?: Express.Multer.File[];
      declarationDocument?: Express.Multer.File[];
      supportingSponsorDocument?: Express.Multer.File[];
      consentLetterFromSponsor?: Express.Multer.File[];
      supportingCertificates?: Express.Multer.File[];
    },
    admissionDto: AdmissionDTO,
  ) {
    try {
      const applicant = await this.prisma.admission.findUnique({
        where: {
          email: admissionDto.email,
        },
      });

      if (applicant) {
        throw new ConflictException('Applicant already exists');
      }

      const supportingDocument = files.supportingDocument?.[0];
      const declarationDocument = files.declarationDocument?.[0];
      const supportingSponsorDocument = files.supportingSponsorDocument?.[0];
      const consentLetterFromSponsor = files.consentLetterFromSponsor?.[0];
      const passportPhoto = files.passportPhoto?.[0];
      const idCardPhoto = files.idCardPhoto?.[0];

      if (!supportingDocument)
        throw new BadRequestException('supportingDocument file is required');
      if (!declarationDocument)
        throw new BadRequestException('declarationDocument file is required');
      if (!supportingSponsorDocument)
        throw new BadRequestException(
          'supportingSponsorDocument file is required',
        );
      if (!consentLetterFromSponsor)
        throw new BadRequestException(
          'consentLetterFromSponsor file is required',
        );
      if (!passportPhoto)
        throw new BadRequestException('passportPhoto file is required');
      if (!idCardPhoto)
        throw new BadRequestException('idCardPhoto file is required');

      //
      const uploadedSupportingDocument =
        await this.helpersService.uploadPdf(supportingDocument);

      const uploadedDeclarationDocument =
        await this.helpersService.uploadPdf(declarationDocument);

      const uploadedSupportingSponsorDocument =
        await this.helpersService.uploadPdf(supportingSponsorDocument);

      const uploadedConsentLetterFromSponsor =
        await this.helpersService.uploadPdf(consentLetterFromSponsor);

      const uploadedSupportingCertificates = await Promise.all(
        (files.supportingCertificates ?? []).map(async (e) => {
          if (e.buffer !== null) {
            const uploadedFile = await this.helpersService.uploadPdf(e);
            return uploadedFile.signedUrl;
          }
          return undefined;
        }),
      );

      const uploadedPassportPhoto =
        await this.helpersService.uploadImage(passportPhoto);

      const uploadIdCardPhoto =
        await this.helpersService.uploadImage(idCardPhoto);

      const applicantData = await this.prisma.admission.create({
        data: {
          firstName: admissionDto.firstName,
          lastName: admissionDto.lastName,
          middleName: admissionDto.middleName,
          passportPhoto: uploadedPassportPhoto.signedUrl.data?.signedUrl || '',
          supportingDocument:
            uploadedSupportingDocument.signedUrl.data?.signedUrl || '',
          idCardPhoto: uploadIdCardPhoto.signedUrl.data?.signedUrl || '',
          declarationDocument:
            uploadedDeclarationDocument.signedUrl.data?.signedUrl || '',
          email: admissionDto.email,
          phoneNumber: admissionDto.phoneNumber,
          dateOfBirth: new Date(admissionDto.dateOfBirth),
          gender: admissionDto.gender,
          nationality: admissionDto.nationality,
          postalAddress: admissionDto.postalAddress,
          maritalStatus: admissionDto.maritalStatus,
          languages: Array.isArray(admissionDto.languages)
            ? admissionDto.languages
            : [admissionDto.languages],
          programChoice: admissionDto.programChoice,
          reference: admissionDto.reference,
          addressOfReference: admissionDto.addressOfReference,
          phoneOfReference: admissionDto.phoneOfReference,
          emailOfReference: admissionDto.emailOfReference,
          parentName: admissionDto.parentName,
          parentPhoneNumber: admissionDto.parentPhoneNumber,
          parentEmail: admissionDto.parentEmail,
          parentAddress: admissionDto.parentAddress,
          sponsor: admissionDto.sponsor,
          supportingSponsorDocument:
            uploadedSupportingSponsorDocument.signedUrl.data?.signedUrl || '',
          consentLetterFromSponsor:
            uploadedConsentLetterFromSponsor.signedUrl.data?.signedUrl || '',
          academics: {
            create: {
              qualification: Array.isArray(admissionDto.qualification)
                ? admissionDto.qualification
                : [admissionDto.qualification],
              institution: Array.isArray(admissionDto.institution)
                ? admissionDto.institution
                : [admissionDto.institution],
              yearOfCompletion: Array.isArray(admissionDto.yearOfCompletion)
                ? admissionDto.yearOfCompletion
                : [admissionDto.yearOfCompletion],
              country: Array.isArray(admissionDto.country)
                ? admissionDto.country
                : [admissionDto.country],
              startDate: Array.isArray(admissionDto.startDate)
                ? admissionDto.startDate
                : [new Date(admissionDto.startDate)],
              endDate: Array.isArray(admissionDto.endDate)
                ? admissionDto.endDate
                : [new Date(admissionDto.endDate)],
              supportingCertificates: uploadedSupportingCertificates.map(
                (e) => e?.data?.signedUrl || '',
              ),
            },
          },
        },
      });

      return {
        message: 'Application submitted successfully',
        applicantData,
      };
    } catch (error) {
      if (error instanceof InternalServerErrorException) {
        throw new InternalServerErrorException(
          'An internal error occurred while submitting application',
        );
      }
      if (error instanceof ConflictException) {
        throw new ConflictException('Applicant already exists');
      }
      throw Error(error.message);
    }
  }
}
