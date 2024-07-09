import { MailerService } from '@nestjs-modules/mailer';
import { Injectable, InternalServerErrorException } from '@nestjs/common';

@Injectable()
export class MailService {
  constructor(private readonly mailerService: MailerService) {}

  async enviarEmailHtml(destinatario: string, assunto: string, html: string) {
    try {
      // await this.mailerService.sendMail({
      //   to: destinatario,
      //   subject: assunto,
      //   html,
      // });

      console.log("Envio de email não implementado")
    } catch (err) {
      console.error(err)
      throw new InternalServerErrorException('Ocorreu um erro ao enviar o email');
    }
  }

  async enviarEmailTexto(destinatario: string, assunto: string, texto: string) {
    try {
      // await this.mailerService.sendMail({
      //   to: [destinatario],
      //   subject: assunto,
      //   text: texto,
      // });

      console.log("Envio de email não implementado")
    } catch (err) {
      console.error(err)
      throw new InternalServerErrorException('Ocorreu um erro ao enviar o email');
    }
  }
}
