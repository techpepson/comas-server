import { Injectable, PreconditionFailedException } from '@nestjs/common';
import { supabase } from 'src/supabase/supabase-client';
import { v4 as uuid } from 'uuid';
import nodemailer from 'nodemailer';

@Injectable()
export class HelpersService {
  constructor() {}

  private readonly bucketName = 'comas-applicant-pdf';

  async uploadPdf(file: Express.Multer.File) {
    const fileExt = file?.originalname?.split('.').pop();
    const fileName = `${uuid()}.${fileExt}`;
    const filePath = `pdfs/${fileName}`;
    console.log(fileExt);

    const { data, error } = await supabase.storage
      .from(this.bucketName)
      .upload(filePath, file.buffer, {
        contentType: 'application/pdf',
        upsert: true,
      });

    if (error) {
      throw new PreconditionFailedException(
        'Upload of file failed',
        error.message,
      );
    }

    const { data: publicData } = supabase.storage
      .from(this.bucketName)
      .getPublicUrl(filePath);

    //sign the public url
    const singedUrl = await supabase.storage
      .from(this.bucketName)
      .createSignedUrl(data.path, 3600);

    return {
      path: data.path,
      publicUrl: publicData.publicUrl,
      signedUrl: singedUrl,
    };
  }

  async uploadImage(file: Express.Multer.File) {
    const fileExt = file?.originalname?.split('.').pop();
    const fileName = `${uuid()}.${fileExt}`;
    const filePath = `images/${fileName}`;

    const { data, error } = await supabase.storage
      .from(this.bucketName)
      .upload(filePath, file.buffer, {
        contentType: 'image/*',
        upsert: false,
      });

    if (error) {
      throw new PreconditionFailedException(
        'Upload of image failed',
        error.message,
      );
    }

    const { data: publicData } = supabase.storage
      .from(this.bucketName)
      .getPublicUrl(filePath);

    //sign the public url
    const singedUrl = await supabase.storage
      .from(this.bucketName)
      .createSignedUrl(data.path, 3600);

    return {
      path: data.path,
      publicUrl: publicData.publicUrl,
      signedUrl: singedUrl,
    };
  }

  async sendMailToClient(
    to: string,
    subject: string,
    text?: string,
    html?: any,
    attachments?: any[],
  ) {
    try {
      const transporter = nodemailer.createTransport({
        host: process.env.COMAS_MAIL_HOST ?? 'mail.comas.edu.gh',
        port: Number(process.env.COMAS_MAIL_PORT ?? 587),
        secure: true,
        auth: {
          user: process.env.COMAS_MAIL_USER ?? 'info@comas.edu.gh',
          pass: process.env.COMAS_MAIL_PASS,
        },
      });

      //send mail
      const mail = await transporter.sendMail({
        from: process.env.COMAS_MAIL_USER ?? 'info@comas.edu.gh',
        to,
        subject,
        text,
        html,
        attachments,
        cc: process.env.COMAS_MAIL_USER ?? 'admissions@comas.edu.gh',
      });

      return mail;
    } catch (error) {
      throw new Error(error.message);
    }
  }
}
