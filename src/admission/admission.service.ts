import { MailerService } from '@nestjs-modules/mailer';
import {
  BadRequestException,
  ConflictException,
  ForbiddenException,
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
    private readonly mailer: MailerService,
  ) {}

  //use an array of Express.Multer for multiple uploads, even for single file upload items
  async createAdmission(
    files: {
      supportingDocument: Express.Multer.File[];
      passportPhoto: Express.Multer.File[];
      idCardPhoto: Express.Multer.File[];
      declarationDocument?: Express.Multer.File[];
      supportingSponsorDocument?: Express.Multer.File[];
      consentLetterFromSponsor?: Express.Multer.File[];
      supportingCertificates: Express.Multer.File[];
    },
    admissionDto: AdmissionDTO,
    userId: string,
  ) {
    try {
      if (!userId) {
        throw new BadRequestException('User ID is required');
      }

      if (!files.idCardPhoto || files.idCardPhoto.length === 0) {
        throw new BadRequestException('ID Card Photo file is required');
      }

      if (!files.passportPhoto || files.passportPhoto.length === 0) {
        throw new BadRequestException('Passport Photo file is required');
      }
      if (!files.supportingDocument || files.supportingDocument.length === 0) {
        throw new BadRequestException('Supporting Document file is required');
      }

      const applicant = await this.prisma.admission.findUnique({
        where: {
          email: admissionDto.email,
        },
      });

      if (applicant) {
        throw new ConflictException('Applicant already exists');
      }

      //find the user by their id and check if they have applied
      const user = await this.prisma.applicantData.findUnique({
        where: {
          id: userId,
        },
        include: {
          payment: true,
        },
      });

      if (!user) {
        throw new ForbiddenException('User not found');
      }

      const hasSuccessfulPayment = user.payment.some(
        (p) => p.status === 'success',
      );

      if (!hasSuccessfulPayment) {
        throw new ForbiddenException('User has not made payment');
      }

      if (user.hasUserApplied) {
        throw new ConflictException('User has already applied');
      }

      const supportingDocument = files?.supportingDocument?.[0] ?? null;
      const declarationDocument = files?.declarationDocument?.[0] ?? null;
      const supportingSponsorDocument =
        files?.supportingSponsorDocument?.[0] ?? null;
      const consentLetterFromSponsor =
        files?.consentLetterFromSponsor?.[0] ?? null;
      const passportPhoto = files?.passportPhoto?.[0];
      const idCardPhoto = files?.idCardPhoto?.[0];

      if (
        !files.supportingCertificates ||
        files.supportingCertificates.length === 0
      )
        throw new BadRequestException(
          'Supporting certificates files are required',
        );
      // if (!declarationDocument)
      //   throw new BadRequestException('declarationDocument file is required');
      // if (!supportingSponsorDocument)
      //   throw new BadRequestException(
      //     'supportingSponsorDocument file is required',
      //   );
      // if (!consentLetterFromSponsor)
      //   throw new BadRequestException(
      //     'consentLetterFromSponsor file is required',
      //   );
      if (!passportPhoto)
        throw new BadRequestException('passportPhoto file is required');
      if (!idCardPhoto)
        throw new BadRequestException('idCardPhoto file is required');

      //

      // Fix: Convert null to undefined
      const uploadedSupportingDocument = supportingDocument
        ? await this.helpersService.uploadPdf(
            supportingDocument,
            admissionDto.firstName,
            'supporting-document',
          )
        : null;

      // Apply the same pattern to other optional files
      const uploadedDeclarationDocument = declarationDocument
        ? await this.helpersService.uploadPdf(
            declarationDocument,
            admissionDto.firstName,
            'declaration-document',
          )
        : null;

      const uploadedSupportingSponsorDocument = supportingSponsorDocument
        ? await this.helpersService.uploadPdf(
            supportingSponsorDocument,
            admissionDto.firstName,
            'supporting-sponsor-document',
          )
        : null;

      const uploadedConsentLetterFromSponsor = consentLetterFromSponsor
        ? await this.helpersService.uploadPdf(
            consentLetterFromSponsor,
            admissionDto.firstName,
            'consent-letter-from-sponsor',
          )
        : null;

      const uploadedSupportingCertificates = await Promise.all(
        (files?.supportingCertificates ?? []).map(async (e, index) => {
          if (e.buffer !== null) {
            const uploadedFile = await this.helpersService.uploadPdf(
              e,
              admissionDto.firstName,
              `supporting-certificate ${index + 1}`,
            );
            return uploadedFile.publicUrl;
          }
          return undefined;
        }),
      );

      const uploadedPassportPhoto = await this.helpersService.uploadImage(
        passportPhoto,
        admissionDto.firstName,
        'passport-photo',
      );

      const uploadIdCardPhoto = await this.helpersService.uploadImage(
        idCardPhoto,
        admissionDto.firstName,
        'id-card-photo',
      );

      const applicantData = await this.prisma.$transaction(async (ctx) => {
        const applicant = await ctx.admission.create({
          data: {
            firstName: admissionDto.firstName,
            lastName: admissionDto.lastName,
            middleName: admissionDto.middleName,
            passportPhoto: uploadedPassportPhoto.publicUrl || '',
            supportingDocument: uploadedSupportingDocument?.publicUrl ?? '',
            idCardPhoto: uploadIdCardPhoto?.publicUrl || '',
            declarationDocument: uploadedDeclarationDocument?.publicUrl || '',
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
              uploadedSupportingSponsorDocument?.publicUrl || '',
            consentLetterFromSponsor:
              uploadedConsentLetterFromSponsor?.publicUrl || '',
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
                  ? admissionDto.startDate.map((d) => new Date(d))
                  : [new Date(admissionDto.startDate)],
                endDate: Array.isArray(admissionDto.endDate)
                  ? admissionDto.endDate.map((d) => new Date(d))
                  : [new Date(admissionDto.endDate)],

                supportingCertificates: uploadedSupportingCertificates.map(
                  (e) => e || '',
                ),
              },
            },
          },
        });

        //update user application status
        await ctx.applicantData.update({
          where: {
            id: user?.id,
          },
          data: {
            hasUserApplied: true,
          },
        });
        return applicant;
      });

      //send an email after prisma transaction succeeds
      try {
        await this.mailer.sendMail({
          to: ['admissions@comas.edu.gh', 'k.aboagyegyedu@comas.edu.gh'],
          subject: `New Admission Application - ${admissionDto.firstName} ${admissionDto.lastName}`,
          template: 'new-application',
          attachments: [
            {
              filename: 'passport-photo.jpg',
              content: files.passportPhoto[0].buffer,
            },
            {
              filename: 'id-card-photo.jpg',
              content: files.idCardPhoto[0].buffer,
            },
            ...(supportingDocument
              ? [
                  {
                    filename: 'supporting-document.pdf',
                    content: supportingDocument.buffer,
                  },
                ]
              : []),
            ...(declarationDocument
              ? [
                  {
                    filename: 'declaration-document.pdf',
                    content: declarationDocument.buffer,
                  },
                ]
              : []),
            ...(supportingSponsorDocument
              ? [
                  {
                    filename: 'supporting-sponsor-document.pdf',
                    content: supportingSponsorDocument.buffer,
                  },
                ]
              : []),
            ...(consentLetterFromSponsor
              ? [
                  {
                    filename: 'consent-letter-from-sponsor.pdf',
                    content: consentLetterFromSponsor.buffer,
                  },
                ]
              : []),
            ...files.supportingCertificates.map((file, index) => ({
              filename: `supporting-certificate-${index + 1}.pdf`,
              content: file.buffer,
            })),
          ],
          context: {
            applicant: admissionDto,
            passportPhoto: uploadedPassportPhoto?.publicUrl,
            idCardPhoto: uploadIdCardPhoto?.publicUrl,
            supportingDocument: uploadedSupportingDocument?.publicUrl,
            declarationDocument: uploadedDeclarationDocument?.publicUrl,
            supportingSponsorDocument:
              uploadedSupportingSponsorDocument?.publicUrl,
            consentLetterFromSponsor:
              uploadedConsentLetterFromSponsor?.publicUrl,
            supportingCertificates: uploadedSupportingCertificates.map(
              (f) => f,
            ),
          },
        });
      } catch (mailError) {
        console.log(mailError);
        await this.prisma.$transaction([
          this.prisma.admission.delete({ where: { id: applicantData.id } }),
          this.prisma.applicantData.update({
            where: { id: userId },
            data: { hasUserApplied: false },
          }),
        ]);

        throw new InternalServerErrorException(
          'Application submission failed (email not sent)',
        );
      }

      return {
        message: 'Application submitted successfully',
        applicantData,
      };
    } catch (error) {
      console.error('Error in createAdmission:', error);

      if (
        error instanceof BadRequestException ||
        error instanceof ConflictException ||
        error instanceof ForbiddenException ||
        error instanceof InternalServerErrorException
      ) {
        throw error;
      }

      throw new InternalServerErrorException(
        // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
        error?.message || 'An unexpected error occurred',
      );
    }
  }
}
