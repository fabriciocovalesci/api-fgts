import { Module } from '@nestjs/common';
import { CpfController } from './cpf.controller';
import { CpfService } from './cpf.service';
import { ValidateCpfListUseCase } from './use-cases/validate-cpf-list.use-case';
import { ExternalApiModule } from 'src/external-api/external-api.module';


@Module({
  imports: [ExternalApiModule], 
  controllers: [CpfController],
  providers: [
    CpfService,
    ValidateCpfListUseCase,
  ],
})
export class CpfModule {}
