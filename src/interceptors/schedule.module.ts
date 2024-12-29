import { Module } from '@nestjs/common';
import { SchedulerRegistry } from '@nestjs/schedule';
import { ReportModule } from 'src/reports/report.module';


@Module({
  imports: [ReportModule],
  providers: [SchedulerRegistry],
  exports: [SchedulerRegistry],
})
export class InterceptorsModule {}


