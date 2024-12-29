import { Module } from '@nestjs/common';
import { ScheduleModule } from '@nestjs/schedule';
import { CpfController } from './cpf.controller';
import { CpfService } from './cpf.service';
import { ValidateCpfListUseCase } from './use-cases/validate-cpf-list.use-case';
import { ExternalApiModule } from 'src/external-api/external-api.module';
import { InterceptorsModule } from 'src/interceptors/schedule.module';
import { ReportModule } from 'src/reports/report.module';

@Module({
  imports: [ExternalApiModule, ScheduleModule.forRoot(), InterceptorsModule,ReportModule],
  controllers: [CpfController],
  providers: [
    CpfService,
    ValidateCpfListUseCase,
  ],
})
export class CpfModule {}
