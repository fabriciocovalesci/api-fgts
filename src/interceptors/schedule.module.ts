import { Module } from '@nestjs/common';
import { ScheduleInterceptor } from './schedule.interceptor';
import { SchedulerRegistry } from '@nestjs/schedule';

@Module({
  providers: [ScheduleInterceptor, SchedulerRegistry],
  exports: [ScheduleInterceptor],
})
export class InterceptorsModule {}
