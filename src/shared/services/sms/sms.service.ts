import { Injectable, InternalServerErrorException } from '@nestjs/common';

@Injectable()
export class SmsService {
  async enviarSMS(telefone: string, texto: string) {
    try {
      console.log("Envio de SMS não implementado")
    } catch (err) {
      console.error(err);
      throw new InternalServerErrorException(
        'Ocorreu um erro ao enviar o email',
      );
    }
  }
}
