
import { HttpException, HttpStatus } from '@nestjs/common';

export class NoValidCpfException extends HttpException {
  constructor() {
    super('Nenhum CPF válido foi encontrado na lista.', HttpStatus.BAD_REQUEST);
  }
}
