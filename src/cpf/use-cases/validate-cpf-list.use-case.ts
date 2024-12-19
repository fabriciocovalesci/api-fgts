
import { Injectable } from '@nestjs/common';
import { cpf as _cpf } from 'cpf-cnpj-validator';

@Injectable()
export class ValidateCpfListUseCase {
  validate(cpfList: string[]) {
    return cpfList.map(cpf => ({
      cpf,
      isValid: _cpf.isValid(cpf) 
    }));
  }
}
